var mongoose = require('mongoose')
var Admin = require('../../Models/admin')
var passwordHash = require('password-hash');

var jwt = require('jsonwebtoken');
const { Validator } = require('node-input-validator');
const { DBerror } = require('../../service/errorHaldel');
// const S3 = require('../../service/s3');

// username
// email
// password
// country
// loginType
// clientID
// token


function createToken(data) {
    return jwt.sign(data, 'DonateSmile');
}

const register = async (req, res) => {

    const v = new Validator(req.body, {
        email: 'required',
        password: 'required|minLength:4',
        fullname: 'required',
    });
    let matched = await v.check().then((val) => val);
    if (!matched) {
        return res.status(200).send({ status: false, error: v.errors });
    }

    let adminData = {
        _id: mongoose.Types.ObjectId(),
        email: req.body.email,
        password: passwordHash.generate(req.body.password),
        fullname: req.body.fullname,
        token: createToken(req.body),
    };

    if (typeof (req.body.phone) != "undefined") {
        adminData.phone = Number(req.body.phone);
    }

    const admin = await new Admin(adminData);
    return admin
        .save()
        .then((data) => {
            return res.status(200).json({
                status: true,
                success: true,
                message: 'New Admin created successfully',
                data: data,
            });
        })
        .catch((error) => {
            let errorMessage = DBerror(error);
            res.status(200).json({
                status: false,
                success: false,
                message: errorMessage,
                error: error,
            });
        });
}

const login = async (req, res) => {
    const v = new Validator(req.body, {
        email: 'required',
        password: 'required|minLength:4'
    });
    let matched = await v.check().then((val) => val);
    if (!matched) {
        return res.status(200).send({ status: false, error: v.errors });
    }

    return Admin.findOne({ email: req.body.email }, async (err, admin) => {
        if (err) {
            res.status(200).json({
                status: false,
                message: 'Server error. Please try again.',
                error: err,
            });
        } else if (admin != null && admin.comparePassword(req.body.password)) {
            await Admin.updateOne(
                { _id: { $in: [mongoose.Types.ObjectId(admin._id)] } },
                { $set: { "deviceToken": req.body.deviceToken } }
            );
            admin.password = null;
            res.status(200).json({
                status: true,
                message: 'Admin login successful',
                data: admin
            });
        } else {
            res.status(200).json({
                status: false,
                message: 'No Admin found',
                data: null
            });
        }
    });
    // res.send({status: false});
}
// email|username|clientId|fullname|country|deviceToken|photo

const getProfile = async (req, res) => {
    res.status(200).json({
        success: true,
        message: 'user profile get successful',
        data: req.user
    });
}

const getTokenData = async (token) => {
    let adminData = await Admin.findOne({ token: token }).exec();
    // console.log('adminData', adminData);
    return adminData;
}

const update = async (req, res) => {
    // console.log("req.params.id", req.user._id);
    if (typeof (req.body.password) != "undefined") {
        req.body = req.splite(req.body, "password");
    }
    return Admin.findOneAndUpdate({ _id: { $in: [mongoose.Types.ObjectId(req.user._id)] } }, req.body, async (err, data) => {
        if (err) {
            let errorMessage = DBerror(err);
            return res.status(500).json({
                success: false,
                message: errorMessage,
                error: err,
            });
        } else if (data != null) {
             data = { ...req.body,...data._doc};
            return res.status(200).json({
                success: true,
                message: 'Admin update successful',
                data: data
            });
        } else {
            return res.status(500).json({
                success: false,
                message: 'Admin not match',
                data: null
            });
        }
    })
}


const passwordChange = async (req, res) => {
    const v = new Validator(req.body, {
        password: 'required|minLength:8',
        oldPassword:'required|minLength:8'
    });
    let matched = await v.check().then((val) => val);
    if (!matched) {
        return res.status(200).send({ status: false, error: v.errors });
    }

    return Admin.findOne({ _id: { $in: [mongoose.Types.ObjectId(req.user._id)] }}, async (err, admin) => {
        if (err) {
            res.status(200).json({
                status: false,
                message: 'Server error. Please try again.',
                error: err,
            });
        } else if (admin != null && admin.comparePassword(req.body.oldPassword)) {
            await Admin.updateOne(
                { _id: { $in: [mongoose.Types.ObjectId(admin._id)] } },
                { $set: { password: passwordHash.generate(req.body.password), } }
            );
            admin.password = null;
            res.status(200).json({
                status: true,
                message: 'admin password change successful',
                data: admin
            });
        } else {
            res.status(200).json({
                status: false,
                message: 'No BPO found',
                data: null
            });
        }
    });
}

// const imageUpload = async (req, res)=> {
//     let uploadDAta = await S3.doUpload(req, "admin/profile/"+ req.user._id);
//     if (uploadDAta.status) {
//         res.send(uploadDAta);
//     } else {
//         res.send(uploadDAta);
//     }
// }

module.exports = {
    register,
    login,
    getProfile,
    getTokenData,
    update,
    passwordChange,
    // imageUpload
}

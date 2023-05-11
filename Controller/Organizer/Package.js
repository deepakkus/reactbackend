var mongoose = require("mongoose");
const Package = require("../../Models/package");
// var passwordHash = require("password-hash");
var Upload = require("../../service/upload");
const { Validator } = require("node-input-validator");
var uuidv1 = require("uuid").v1;
const { DBerror } = require("../../service/errorHaldel");


function createToken(data) {
    data.hase = uuidv1();
    return jwt.sign(data, "DonateSmile");
}

const create = async (req, res) => {
    const v = new Validator(req.body, {
        name: "required",
        // packageType: "required",
        // price: "required",
        // packageNumber: "required",
        // guest: "required",
        // description: "required",
        packageList: "array"

    });
    let matched = await v.check().then((val) => val);
    if (!matched) {
        return res.status(200).send({ status: false, error: v.errors });
    }
    let PackageData = {
        name: req.body.name,
        // packageType: req.body.packageType,
        // price: req.body.price,
        // packageNumber: req.body.packageNumber,
        // guest: req.body.guest,
        // description: req.body.description,
        packageList: req.body.packageList,

        organizerId: mongoose.Types.ObjectId(req.user._id),
        createOn: new Date()
    };

    const package = await new Package(PackageData);
    return package
        .save()
        .then((data) => {
            return res.status(200).json({
                status: true,
                message: "New Package created successfully",
                data: data,
            });
        })
        .catch((error) => {
            // console.log('error', error);
            let errorMessage = DBerror(error);
            res.status(200).json({
                status: false,
                message: errorMessage,
                error: error,
            });
        });
};

const update = async (req, res) => {

    return Package.findOneAndUpdate(
        { _id: { $in: [mongoose.Types.ObjectId(req.params.id)] } },
        req.body,
        async (err, data) => {
            if (err) {
                let errorMessage = DBerror(err);
                return res.status(500).json({
                    status: false,
                    message: errorMessage,
                    error: err,
                });
            } else if (data != null) {
                data = { ...data._doc, ...req.body };
                return res.status(200).json({
                    status: true,
                    message: "Package update successful",
                    data: data,
                });
            } else {
                return res.status(500).json({
                    status: false,
                    message: "Package not match",
                    data: null,
                });
            }
        }
    );
};

const viewAll = async (req, res) => {
    return Package.aggregate([
        {
            $match: { organizerId: mongoose.Types.ObjectId(req.user._id), isDelete: false }
        },
        {
            $project: {
                token: 0,
                __v: 0,
            },
        },
        {
            $sort: {
                _id: -1
            }
        }
    ])
        .then((data) => {
            return res.status(200).json({
                status: true,
                message: "Get All Package Successfully",
                data: data,
            });
        })
        .catch((error) => {
            res.status(200).json({
                status: false,
                message: "Server error. Please try again.",
                error: error,
            });
        });
};

const DeleteParmanet = async (req, res) => {
    return Package.remove({ _id: { $in: [mongoose.Types.ObjectId(req.params.id)] } })
        .then((data) => {
            return res.status(200).json({
                success: true,
                message: 'Package delete successfully',
                data: data
            });
        })
        .catch((error) => {
            res.status(500).json({
                success: false,
                message: 'Server error. Please try again.',
                error: error,
            });
        });
}

const Delete = async (req, res) => {
    return Package.findOneAndUpdate(
        { _id: { $in: [mongoose.Types.ObjectId(req.params.id)] } },
        {
            isDelete: true
        },
        async (err, data) => {
            if (err) {
                return res.status(500).json({
                    status: false,
                    message: "Server error. Please try again.",
                    error: err,
                });
            } else if (data != null) {
                return res.status(200).json({
                    status: true,
                    message: "Package Delete successful",
                    data: data,
                });
            } else {
                return res.status(500).json({
                    status: false,
                    message: "Package not match",
                    data: null,
                });
            }
        }
    );
}

const viewSingel = async (req, res) => {
    return Package.aggregate([
        {
            $match: { _id: mongoose.Types.ObjectId(req.params.id) }
        },
        {
            $project: {
                token: 0,
                __v: 0,
            },
        },
        {
            $sort: {
                _id: -1
            }
        }
    ])
        .then((data) => {
            if (data && data.length > 0) {
                return res.status(200).json({
                    status: true,
                    message: "Get Package Singel Successfully",
                    data: data[0],
                });
            } else {
                return res.status(200).json({
                    status: false,
                    message: "No Package Find",
                    data: null,
                });
            }

        })
        .catch((error) => {
            res.status(200).json({
                status: false,
                message: "Server error. Please try again.",
                error: error,
            });
        });
};

// const ImageUpload = async (req, res) => {
//     let uploadDAta = await Upload.uploadFile(req, "event");
//     if (uploadDAta.status) {
//         res.send(uploadDAta);
//     } else {
//         res.send(uploadDAta);
//     }
// }
module.exports = {
    create,
    update,
    viewAll,
    Delete,
    viewSingel
};

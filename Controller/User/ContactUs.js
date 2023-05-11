const mongoose = require("mongoose");
const { Validator } = require("node-input-validator");
const contactUs = require("../../Models/contactUs");
const { DBerror } = require("../../service/errorHaldel");

const create = async (req, res) => {
    const v = new Validator(req.body, {
        phone: "required",
        email: "required",
        comment: "required",
    });
    let matched = await v.check().then((val) => val);
    if (!matched) {
        return res.status(200).send({ status: false, error: v.errors });
    }

    let dataSet = {
        ...req.body,
        // userId: mongoose.Types.ObjectId(req.user._id),
        createOn: new Date()
    };

    const modelData = await new contactUs(dataSet);
    return modelData
        .save()
        .then((data) => {
            return res.status(200).json({
                status: true,
                message: "New contactUs request successfully",
                data: data,
            });
        })
        .catch((error) => {
            let errorMessage = DBerror(error);
            console.log('error', error);
            res.status(200).json({
                status: false,
                message: errorMessage,
                error: error,
            });
        });
};

const update = async (req, res) => {
    return contactUs.findOneAndUpdate(
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
                    message: "contactUs update successful",
                    data: data,
                });
            } else {
                return res.status(500).json({
                    status: false,
                    message: "contactUs not match",
                    data: null,
                });
            }
        }
    );
};

const viewAll = async (req, res) => {
    return contactUs.aggregate([
        {
            $match: { 
                isDelete: false 
            }
        },
        {
            $project: {
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
                message: "Get All contactUs Successfully",
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

module.exports = {
    create,
    update,
    viewAll
}
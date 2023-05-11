var mongoose = require("mongoose");
const Promotions = require("../../Models/promotions");
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
        // name: "required",
        startDate: "required",
        startTime: "required",
        endsDate: "required",
        endsTime: "required",

        discountType: "required",
        discountValue: "required",
        maxDiscountValue: "required",
        minimumSpend: "required",
        createCode: "required",
    });
    let matched = await v.check().then((val) => val);
    if (!matched) {
        return res.status(200).send({ status: false, error: v.errors });
    }
    let PromotionsData = {
        // name: req.body.name,
        startDate: req.body.startDate,
        startTime: req.body.startTime,
        endsDate: req.body.endsDate,
        endsTime: req.body.endsTime,

        discountType: req.body.discountType,
        discountValue: req.body.discountValue,
        maxDiscountValue: req.body.maxDiscountValue,
        minimumSpend: req.body.minimumSpend,
        createCode: req.body.createCode,


        organizerId: mongoose.Types.ObjectId(req.user._id),
        createOn: new Date()
    };

    const promotions = await new Promotions(PromotionsData);
    return promotions
        .save()
        .then((data) => {
            return res.status(200).json({
                status: true,
                message: "New Promotions created successfully",
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

const createPromotionsMany = async (req, res) => {
    if (typeof(req.body.promotions) == "undefined") {
        return true;
    }
    try {
        return await Promotions.insertMany(req.body.promotions);
    } catch (error) {
        // console.log('error', error);
        let errorMessage = DBerror(error);
        res.status(200).json({
            status: false,
            message: errorMessage,
            errorType: "Promotions",
            error: error,
        });
        return false;
    }
}
const update = async (req, res) => {

    return Promotions.findOneAndUpdate(
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
                    message: "Promotions update successful",
                    data: data,
                });
            } else {
                return res.status(500).json({
                    status: false,
                    message: "Promotions not match",
                    data: null,
                });
            }
        }
    );
};

const viewAll = async (req, res) => {
    return Promotions.aggregate([
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
                message: "Get All Promotions Successfully",
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
    return Promotions.remove({ _id: { $in: [mongoose.Types.ObjectId(req.params.id)] } })
        .then((data) => {
            return res.status(200).json({
                success: true,
                message: 'Promotions delete successfully',
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
    return Promotions.findOneAndUpdate(
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
                    message: "Promotions Delete successful",
                    data: data,
                });
            } else {
                return res.status(500).json({
                    status: false,
                    message: "Promotions not match",
                    data: null,
                });
            }
        }
    );
}

const viewSingel = async (req, res) => {
    return Promotions.aggregate([
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
                    message: "Get Promotions Singel Successfully",
                    data: data[0],
                });
            } else {
                return res.status(200).json({
                    status: false,
                    message: "No Promotions Find",
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
    viewSingel,
    createPromotionsMany
};

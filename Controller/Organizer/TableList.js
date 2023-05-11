var mongoose = require("mongoose");
const TableList = require("../../Models/tableList");
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
        tableList: "array"
        // TableType: "required",
        // price: "required",
        // avlTable: "required",
        // capacity: "required",
        // description: "required",
    });
    let matched = await v.check().then((val) => val);
    if (!matched) {
        return res.status(200).send({ status: false, error: v.errors });
    }
    let TableListData = {
        name: req.body.name,
        // TableType: req.body.TableType,
        // price: req.body.price,
        // avlTable: req.body.avlTable,
        // capacity: req.body.capacity,
        // description: req.body.description,
        tableList: req.body.tableList,

        organizerId: mongoose.Types.ObjectId(req.user._id),
        createOn: new Date()
    };

    const tableList = await new TableList(TableListData);
    return tableList
        .save()
        .then((data) => {
            return res.status(200).json({
                status: true,
                message: "New Table List created successfully",
                data: data,
            });
        })
        .catch((error) => {
            let errorMessage = DBerror(error);
            res.status(200).json({
                status: false,
                message: errorMessage,
                error: error,
            });
        });
};

const update = async (req, res) => {

    return TableList.findOneAndUpdate(
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
                    message: "TableList update successful",
                    data: data,
                });
            } else {
                return res.status(500).json({
                    status: false,
                    message: "TableList not match",
                    data: null,
                });
            }
        }
    );
};

const viewAll = async (req, res) => {
    return TableList.aggregate([
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
                message: "Get All TableList Successfully",
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
    return TableList.remove({ _id: { $in: [mongoose.Types.ObjectId(req.params.id)] } })
        .then((data) => {
            return res.status(200).json({
                success: true,
                message: 'TableList delete successfully',
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
    return TableList.findOneAndUpdate(
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
                    message: "TableList Delete successful",
                    data: data,
                });
            } else {
                return res.status(500).json({
                    status: false,
                    message: "TableList not match",
                    data: null,
                });
            }
        }
    );
}

const viewSingel = async (req, res) => {
    return TableList.aggregate([
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
                    message: "Get TableList Singel Successfully",
                    data: data[0],
                });
            } else {
                return res.status(200).json({
                    status: false,
                    message: "No TableList Find",
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

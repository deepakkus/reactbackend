var mongoose = require("mongoose");
const Ticket = require("../../Models/ticket");
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
        ticketName: "required",
        startDate: "required",
        endDate: "required",
        startTime: "required",
        endTime: "required",
        gender: "required",
        totalprice: "required|integer",
        avl: "required|integer",
        details: "required",
        salestarts: "required"
    });
    let matched = await v.check().then((val) => val);
    if (!matched) {
        return res.status(200).send({ status: false, error: v.errors });
    }
    let TicketData = {
        ticketName: req.body.ticketName,
        startDate: req.body.startDate,
        endDate: req.body.endDate,
        startTime: req.body.startTime,
        endTime: req.body.endTime,
        gender: req.body.gender,
        totalprice: req.body.totalprice,
        avl: req.body.avl,
        details: req.body.details,
        salestarts: req.body.salestarts,
        organizerId: mongoose.Types.ObjectId(req.user._id),
        createOn: new Date()
    };

    const ticket = await new Ticket(TicketData);
    return ticket
        .save()
        .then((data) => {
            return res.status(200).json({
                status: true,
                message: "New Ticket created successfully",
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

const createTicketMany = async (req, res) => {
    if (typeof(req.body.tickets) == "undefined") {
        return true;
    }
    try {
        return await Ticket.insertMany(req.body.tickets);
    } catch (error) {
        // console.log('error', error);
        let errorMessage = DBerror(error);

        res.status(200).json({
            status: false,
            message: errorMessage,
            errorType: "Tickets",
            error: error,
        });
        return false;
    }
}

const update = async (req, res) => {

    return Ticket.findOneAndUpdate(
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
                    message: "Ticket update successful",
                    data: data,
                });
            } else {
                return res.status(500).json({
                    status: false,
                    message: "Ticket not match",
                    data: null,
                });
            }
        }
    );
};

const viewAll = async (req, res) => {
    return Ticket.aggregate([
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
                message: "Get All Ticket Successfully",
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
    return Ticket.remove({ _id: { $in: [mongoose.Types.ObjectId(req.params.id)] } })
        .then((data) => {
            return res.status(200).json({
                success: true,
                message: 'Ticket delete successfully',
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
    return Ticket.findOneAndUpdate(
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
                    message: "Ticket Delete successful",
                    data: data,
                });
            } else {
                return res.status(500).json({
                    status: false,
                    message: "Ticket not match",
                    data: null,
                });
            }
        }
    );
}

const viewSingel = async (req, res) => {
    return Ticket.aggregate([
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
                    message: "Get Ticket Singel Successfully",
                    data: data[0],
                });
            } else {
                return res.status(200).json({
                    status: false,
                    message: "No Ticket Find",
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
    createTicketMany
};

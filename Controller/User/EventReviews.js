var mongoose = require("mongoose");
const Ticket = require("../../Models/ticket");
const EventReviews = require("../../Models/eventReviews");
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
        eventId: "required",
        reviews: "required",
        rating: "required"
    });
    let matched = await v.check().then((val) => val);
    if (!matched) {
        return res.status(200).send({ status: false, error: v.errors });
    }
    let datasSet = {
        rating: req.body.rating,
        eventId: mongoose.Types.ObjectId(req.body.eventId),
        reviews: req.body.reviews,
        userId: mongoose.Types.ObjectId(req.user._id),
        createOn: new Date()
    };

    const ticket = await new EventReviews(datasSet);
    return ticket
        .save()
        .then((data) => {
            return res.status(200).json({
                status: true,
                message: "New EventReviews created successfully",
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

    return EventReviews.findOneAndUpdate(
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
                    message: "Event Reviews update successful",
                    data: data,
                });
            } else {
                return res.status(500).json({
                    status: false,
                    message: "Event Reviews not match",
                    data: null,
                });
            }
        }
    );
};

const viewAll = async (req, res) => {
    return EventReviews.aggregate([
        {
            $match: {
                isDelete: false
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "userId",
                foreignField: "_id",
                pipeline: [
                    {
                        $lookup: {
                            from: "paymentmethods",
                            localField: "_id",
                            foreignField: "userId",
                            as: "paymentmethods"
                        }
                    },
                    {
                        $project: {
                            token: 0,
                            password: 0,
                            approve: 0,
                            status: 0,
                            deviceToken: 0,
                            // organizer: 0,
                            // musicType: 0,
                            // favoriteDrink: 0,
                            // eventType:0,
                            // isDelete: 0,
                            // addOnDate: 0,
                            __v: 0,
                        },
                    },
                ],
                as: "userData"
            }
        },
        {
            $unwind: "$userData"
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
                message: "Get All Event Reviews Successfully",
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
    return EventReviews.findOneAndUpdate(
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
                    message: "Event Reviews Delete successful",
                    data: data,
                });
            } else {
                return res.status(500).json({
                    status: false,
                    message: "Event Reviews not match",
                    data: null,
                });
            }
        }
    );
}

const viewSingel = async (req, res) => {
    return EventReviews.aggregate([
        {
            $match: {
                isDelete: false
            }
        },
        {
            $match: { eventId: mongoose.Types.ObjectId(req.params.id) }
        },
        {
            $lookup: {
                from: "users",
                localField: "userId",
                foreignField: "_id",
                pipeline: [
                    {
                        $lookup: {
                            from: "paymentmethods",
                            localField: "_id",
                            foreignField: "userId",
                            as: "paymentmethods"
                        }
                    },
                    {
                        $project: {
                            token: 0,
                            password: 0,
                            approve: 0,
                            status: 0,
                            deviceToken: 0,
                            // organizer: 0,
                            // musicType: 0,
                            // favoriteDrink: 0,
                            // eventType:0,
                            // isDelete: 0,
                            // addOnDate: 0,
                            __v: 0,
                        },
                    },
                ],
                as: "userData"
            }
        },
        {
            $unwind: "$userData"
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
                    message: "Get Event Reviews Singel Successfully",
                    data: data,
                });
            } else {
                return res.status(200).json({
                    status: false,
                    message: "No Event Reviews Find",
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

module.exports = {
    create,
    update,
    viewAll,
    Delete,
    viewSingel
};

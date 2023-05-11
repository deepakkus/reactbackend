var mongoose = require("mongoose");
const { Validator } = require("node-input-validator");
const { DBerror } = require("../../service/errorHaldel");
var User = require('../../Models/user');
const { sendEmail } = require("../../service/email");
const PaymentMethod = require("../../Models/paymentMethod");
const { CreateStripeCustomer, CreateStripePaymentMethod, PayStripeSingel } = require("../../service/Stripe");


const findUser = (req, res) => {
    let quesr = {};
    if (typeof (req.body.name) != "undefined") {
        quesr = { firstname: { $regex: req.body?.name, $options: "i" } }
    } else if (typeof (req.body.phone) != "undefined") {
        quesr = { phone: { $regex: req.body?.phone, $options: "i" } }
    } else {
        quesr = { email: { $regex: req.body?.email, $options: "i" } }

    }

    return User.aggregate([
        // {
        //     $match: {
        //         _id: {
        //             $nin: [ mongoose.Types.ObjectId(req.user._id) ],
        //         }
        //     }
        // },
        {
            $match: {
                $and: [
                    {
                        $or: [
                            quesr
                        ]
                    },
                    { status: true }
                ]
            },
        },
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
                __v: 0,
                organizer: 0,
                musicType: 0,
                favoriteDrink: 0,
                eventType: 0,
                password: 0,
                deviceToken: 0,
                isDelete: 0
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
                    message: "find User Successfully",
                    data: data,
                });
            } else {
                return res.status(200).json({
                    status: false,
                    message: "No user Find",
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
}


const inviteUser = async (req, res) => {
    if (typeof (req.body.email) != "undefined") {
        let html = `
            <center>
                <h1>welcome to tabyat</h1>
                <p>sending invitation by <b>${req.user.firstname} ${req.user.lastname} </b></p>
            </center>
        `;
        let sendData = await sendEmail(html, req.body.email);
        res.send({
            status: true,
            data: sendData,
            msg: "invitation send via email"
        });
    } else {
        res.send({
            status: true,
            data: "getway daini akhono",
            msg: "invitation send via phone"
        });
    }
}

const viewAllPaymentMethod = async (req, res) => {
    return PaymentMethod.aggregate([
        {
            $match: {
                userId: mongoose.Types.ObjectId(req.user._id),
                isDelete: false
            }
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


const createPaymentMethod = async (req, res) => {
    const v = new Validator(req.body, {
        cardNumber: "required",
        CardHolderName: "required",
        ExpiryMonth: "required",
        ExpireYear: "required",
        cvc: "required",

    });

    let matched = await v.check().then((val) => val);
    if (!matched) {
        return res.status(200).send({ status: false, error: v.errors });
    }
    let stripeCUS = req?.user?.stripeCUS;

    if (!req?.user?.stripeCUS) {
        let Cdata = await CreateStripeCustomer(req.user);
        stripeCUS = Cdata?.id;
    }

    let StripePaymentMethod = await CreateStripePaymentMethod(stripeCUS, {
        number: req?.body?.cardNumber,
        exp_month: req?.body?.ExpiryMonth,
        exp_year: req?.body?.ExpireYear,
        cvc: `${req?.body?.cvc}`,
    })
    if (!StripePaymentMethod?.status) {
        return res.status(200).json({
            status: false,
            message: "Payment Methord Not adding",
            error: StripePaymentMethod?.error,
        });
    }

    let DataSet = {
        ...req.body,
        ...StripePaymentMethod,
        userId: mongoose.Types.ObjectId(req.user._id),
        createOn: new Date()
    };

    let noOfPaymentMethod = await PaymentMethod.countDocuments({ userId: mongoose.Types.ObjectId(req.user._id) });
    // console.log('noOfPaymentMethod', noOfPaymentMethod)
    if (noOfPaymentMethod == 0) {
        DataSet.default = true;
    }

    const modelData = await new PaymentMethod(DataSet);
    return modelData
        .save()
        .then((data) => {
            return res.status(200).json({
                status: true,
                message: "New Payment Method created successfully",
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

const getUserProfile = (req, res) => {
    return User.aggregate([
        {
            $match: {
                _id: mongoose.Types.ObjectId(req.params.id)
            }
        },
        {
            $match: { status: true }
        },
        {
            $lookup: {
                from: "paymentmethods",
                localField: "_id",
                foreignField: "userId",
                as: "paymentmethods"
            }
        },
        {
            $lookup: {
                from: "eventbookings",
                localField: "_id",
                foreignField: "userId",
                pipeline: [
                    {
                        $lookup: {
                            from: "events",
                            localField: "eventId",
                            foreignField: "_id",
                            as: "eventsData"
                        }
                    },
                    {
                        $unwind: "$eventsData"
                    },
                    {
                        $lookup:
                        {
                            from: "organizerusers",
                            localField: "organizerId",
                            foreignField: "_id",
                            let: { organizerId: "organizerId" },
                            pipeline: [
                                {
                                    $lookup: {
                                        from: "cities",
                                        localField: "city",
                                        foreignField: "id",
                                        as: "cityData"
                                    }
                                },
                                {
                                    $unwind: "$cityData"
                                },
                                {
                                    $lookup: {
                                        from: "states",
                                        localField: "state",
                                        foreignField: "id",
                                        as: "stateData"
                                    }
                                },
                                {
                                    $unwind: "$stateData"
                                },

                                {
                                    $lookup: {
                                        from: "organizers",
                                        localField: "organizerType",
                                        foreignField: "_id",
                                        as: "organizerTypeData"
                                    }
                                },
                                {
                                    $unwind: "$organizerTypeData"
                                },
                                {
                                    $lookup: {
                                        from: "organizers",
                                        localField: "secondaryType",
                                        foreignField: "_id",
                                        as: "secondaryTypeData"
                                    }
                                },
                                {
                                    $unwind: "$secondaryTypeData"
                                },
                                {
                                    $project: {
                                        token: 0,
                                        __v: 0,
                                        "organizerTypeData.__v": 0,
                                        "secondaryTypeData.__v": 0
                                    },
                                },
                            ],
                            as: "organizerData"
                        }
                    },
                    {
                        $unwind: "$organizerData"
                    },
                    {
                        $project: {
                            "organizerData.token": 0,
                            "organizerData.password": 0,
                            "organizerData.approve": 0,
                            "organizerData.status": 0,
                            "organizerData.deviceToken": 0,
                            "organizerData.__v": 0,
                            __v: 0,
                        },
                    },
                ],
                as: "bookingEvents"
            }
        },
        // {
        //     $lookup: {
        //         from: "follows",
        //         localField: "_id",
        //         foreignField: "receiver",
        //         as: "followers"
        //     }
        // },
        {
            $lookup: {
                from: "follows",
                localField: "_id",
                foreignField: "receiver",
                pipeline: [{
                        $match: {
                            isDelete: false,
                            accpect: true,
                            status: true,
                        },
                    },  
                    {
                      $lookup: {
                        from: "users",
                        localField: "sender",
                        foreignField: "_id",
                        as: "userData",
                      },
                    },
                    {
                      $unwind: "$userData",
                    },
                    {
                      $project: {
                        "userData.token": 0,
                        "userData.password": 0,
                        "userData.organizer": 0,
                        "userData.musicType": 0,
                        "userData.favoriteDrink": 0,
                        "userData.eventType": 0,
                        "userData.__v": 0,
                        __v: 0,
                      },
                    },
                ],
                as: "followers",
            },
          },
          {
            $lookup: {
                from: "eventreviews",
                localField: "_id",
                foreignField: "userId",
                as: "review",
            },
          },
          
        {
            $project: {
                token: 0,
                __v: 0,
                // organizer: 0,
                // musicType: 0,
                // favoriteDrink: 0,
                // eventType: 0,
                password: 0,
                deviceToken: 0,
                isDelete: 0
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
                    message: "user Profile Successfully",
                    data: data[0],
                });
            } else {
                return res.status(200).json({
                    status: false,
                    message: "No user Find",
                    data: null
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
}

const PayNowSingel = async (req, res) => {
    const v = new Validator(req.body, {
        amount: "required",
        source: "required",
        BookingId: "required",
    });

    let matched = await v.check().then((val) => val);
    if (!matched) {
        return res.status(200).send({ status: false, error: v.errors });
    }

    let stripeCUS = req?.user?.stripeCUS;

    if (!req?.user?.stripeCUS) {
        return res.status(200).send({ status: false, error: "Create customer Id OR Payment Methord" });
    }
    let PaymentData = await PayStripeSingel(req?.body?.amount, req?.body?.source, req?.body?.BookingId, req?.user?.email, stripeCUS)

    res.status(200).json({
        ...PaymentData
    })
}

const PayNowSplit = async (req, res) => {
    const v = new Validator(req.body, {
        spliteList: "required|array",
        amount: "required",
        BookingId: "required"
    });
    let matched = await v.check().then((val) => val);
    if (!matched) {
        return res.status(200).send({ status: false, error: v.errors });
    }

    let spliteList = req?.body?.spliteList;
    let PaymentArray = [];
    for (let index = 0; index < spliteList.length; index++) {
        const element = spliteList[index];
        let PaymentData = await PayStripeSingel(
            req?.body?.amount,
            element?.source,
            req?.body?.BookingId,
            element?.email,
            element?.stripeCUS
        );
        PaymentArray.push(PaymentData);
    }
    if (PaymentArray.filter(it => it.status == false).length == 0) {
        res.status(200).send({ status: true, data: PaymentArray });
    } else {
        res.status(200).send({ status: false, error: PaymentArray, });
    }
}

const defaultPaymentMethod = async (req, res) => {
    const updateDoc = {
        $set: {
            default: false
        },
    };
    let extdata = await PaymentMethod.updateMany({ userId: mongoose.Types.ObjectId(req.user._id), isDelete: false }, updateDoc);
    return await PaymentMethod.findOneAndUpdate(
        { _id: { $in: [mongoose.Types.ObjectId(req.params.id)] } },
        {
            default: true
        },
        {
            new: true
        },
        async (err, data) => {
            if (err) {
                let errorMessage = DBerror(err);
                return res.status(500).json({
                    status: false,
                    message: errorMessage,
                    error: err,
                });
            } else if (data != null) {
                return res.status(200).json({
                    status: true,
                    message: "Sefault Payment Method set successful",
                    data: data,
                });
            } else {
                return res.status(500).json({
                    status: false,
                    message: "Payment Method not found",
                    data: null,
                });
            }
        }
    );
}

const DeletePaymentMethod = async (req, res) => {
    // { _id: { $in: [mongoose.Types.ObjectId(req.params.id)] }, userId: mongoose.Types.ObjectId(req.user._id) },

    return PaymentMethod.remove({ _id: { $in: [mongoose.Types.ObjectId(req.params.id)] }, userId: mongoose.Types.ObjectId(req.user._id) })
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

module.exports = {
    findUser,
    inviteUser,
    createPaymentMethod,
    viewAllPaymentMethod,
    getUserProfile,
    PayNowSingel,
    PayNowSplit,
    defaultPaymentMethod,
    DeletePaymentMethod
};
var mongoose = require("mongoose");
const Event = require("../../Models/event");
// var passwordHash = require("password-hash");
var Upload = require("../../service/upload");
const { Validator } = require("node-input-validator");
var uuidv1 = require("uuid").v1;
const { DBerror } = require("../../service/errorHaldel");
const Ticket = require("../../Models/ticket");
const { createTicketMany } = require("./Ticket");
const { createPromotionsMany } = require("./Promotions");
const Promotions = require("../../Models/promotions");
const eventBooking = require("../../Models/eventBooking");
const { CheckAvailableTable, CheckAvailableTicket } = require("../User/Event");
const { StripeRefundsAll } = require("../../service/Stripe");


function createToken(data) {
    data.hase = uuidv1();
    return jwt.sign(data, "DonateSmile");
}

const create = async (req, res) => {
    const v = new Validator(req.body, {
        name: "required",
        startDate: "required",
        endDate: "required",
        startTime: "required",
        endTime: "required",
        // ladiesDessCode: "required",
        // mensDessCode: "required",
        // cantwear: "required",
        description: "required",
        musicType: "array",
        djName: "array",
        // specialGuestsName: "array",
        tickets: "array",
        promotions: "array",

        image: "required",
        location: "required"
    });
    let matched = await v.check().then((val) => val);
    if (!matched) {
        return res.status(200).send({ status: false, error: v.errors });
    }
    let eventData = {
        ...req.body,
        name: req.body.name,
        startDate: req.body.startDate,
        endDate: req.body.endDate,
        startTime: req.body.startTime,
        endTime: req.body.endTime,
        // ladiesDessCode: req.body.ladiesDessCode,
        // mensDessCode: req.body.mensDessCode,
        // cantwear: req.body.cantwear,
        description: req.body.description,
        // musicType: mongoose.Types.ObjectId(req.body.musicType),
        musicType: req.body.musicType,
        djName: req.body.djName,
        image: req.body.image,
        location: req.body.location,
        city: Number(req.body.city),
        state: Number(req.body.state),
        address: req.body.address,
        zipcode: req.body.zipcode,

        // tickets: req.body.tickets,
        // promotions: req.body.promotions,

        createOn: new Date(),

        organizerId: mongoose.Types.ObjectId(req.user._id),
        isDelete: false
    };

    if (typeof (eventData.tableList) != "undefined" && eventData.tableList != "None") {
        eventData.tableList = mongoose.Types.ObjectId(eventData.tableList._id)
    } else {
        eventData.tableList = mongoose.Types.ObjectId('6176f8192d742da4feebe3d8')
    }

    if (typeof (eventData.packageList) != "undefined" && eventData.packageList != "None") {
        eventData.packageList = mongoose.Types.ObjectId(eventData.packageList._id)
    } else {
        eventData.packageList = mongoose.Types.ObjectId('6176f8192d742da4feebe3d8')
    }

    if (typeof (eventData.menuList) != "undefined" && eventData.menuList != "None") {
        eventData.menuList = mongoose.Types.ObjectId(eventData.menuList._id)
    } else {
        eventData.menuList = mongoose.Types.ObjectId('6176f8192d742da4feebe3d8')
    }


    const event = await new Event(eventData);
    return event
        .save()
        .then(async (data) => {
            console.log('data.id', data._id);
            req.body.tickets = req.body.tickets.map(object => {
                return { ...object, eventId: data._id, createOn: new Date(), organizerId: mongoose.Types.ObjectId(req.user._id) };
            });
            req.body.promotions = req.body.promotions.map(object => {
                return { ...object, eventId: data._id, createOn: new Date(), organizerId: mongoose.Types.ObjectId(req.user._id) };
            });
            let createTicket = await createTicketMany(req, res);
            let createPromotions = await createPromotionsMany(req, res);
            if (!createTicket || !createPromotions) {
                await Event.deleteOne({ "_id": mongoose.Types.ObjectId(data._id) });
                await Ticket.deleteMany({ "eventId": data._id });
                await Promotions.deleteMany({ "eventId": data._id });
                return false;
            } else {
                delete eventData.tickets;
                delete eventData.promotions;
                await SortUpdate(res, eventData, data._id);
            }
        })
        .catch((error) => {
            let errorMessage = DBerror(error);
            return res.status(200).json({
                status: false,
                message: errorMessage,
                error: error,
            });
        });
};


const SortUpdate = async (res, body, id) => {
    return Event.findOneAndUpdate(
        { _id: { $in: [mongoose.Types.ObjectId(id)] } },
        body,
        async (err, data) => {
            if (err) {
                let errorMessage = DBerror(err);
                return res.status(500).json({
                    status: false,
                    message: errorMessage,
                    error: err,
                });
            } else if (data != null) {
                data = { ...data._doc, ...body };
                return res.status(200).json({
                    status: true,
                    message: "New Event created successfully",
                    data: data,
                });
            } else {
                return res.status(500).json({
                    status: false,
                    message: "Event not match",
                    data: null,
                });
            }
        }
    );
}


const update = async (req, res) => {
    return Event.findOneAndUpdate(
        { _id: { $in: [mongoose.Types.ObjectId(req.params.id)] } },
        req.body,
        { new: true },
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
                    message: "Event update successful",
                    data: data,
                });
            } else {
                return res.status(500).json({
                    status: false,
                    message: "Event not match",
                    data: null,
                });
            }
        }
    );
};

const viewAll = async (req, res) => {
    return Event.aggregate([
        {
            $match: { organizerId: mongoose.Types.ObjectId(req.user._id), isDelete: false }
        },
        // {
        //     $lookup: {
        //         from: "musictypes",
        //         localField: "musicType",
        //         foreignField: "_id",
        //         as: "musicTypeData"
        //     }
        // },
        // {
        //     $unwind: "$musicTypeData"
        // },
        {
            $lookup: {
                from: "tickets",
                localField: "_id",
                foreignField: "eventId",
                as: "tickets"
            }
        },

        {
            $lookup: {
                from: "promotions",
                localField: "_id",
                foreignField: "eventId",
                as: "promotions"
            }
        },


        {
            $lookup: {
                from: "tablelists",
                localField: "tableList",
                foreignField: "_id",
                as: "tablelistsData"
            }
        },
        {
            $unwind: "$tablelistsData"
        },
        {
            $lookup: {
                from: "packages",
                localField: "packageList",
                foreignField: "_id",
                as: "packageListData"
            }
        },
        {
            $unwind: "$packageListData"
        },
        {
            $lookup: {
                from: "menus",
                localField: "menuList",
                foreignField: "_id",
                as: "menulistsData"
            }
        },
        {
            $unwind: "$menulistsData"
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
                from: "eventbookings",
                localField: "eventId",
                foreignField: "eventId",
                pipeline: [
                    {
                        $match: {
                            isDelete: false,
                            bookingStatus: "complete",
                            status: true,
                            approve: true,
                        }
                    },
                    {
                        $project: {
                            tickets: 0
                        }
                    }
                ],
                as: "bookings"
            }
        },
        {
            $addFields: {
                attend: { $size: "$bookings" }
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
                message: "Get All Event  Successfully",
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

const viewAllActive = async (req, res) => {
    return Event.aggregate([
        {
            $match: {
                organizerId: mongoose.Types.ObjectId(req.user._id),
                isDelete: false,
            }
        },
        
        {
            $addFields: {
                EndDateISO: { $toDate: "$endDate" },
                EndTimeISO: { $toDate: "$endTime" }

            }
        },
        {
            $addFields: {
                newEndDate: {
                    $dateToString: { format: "%Y-%m-%d", date: "$EndDateISO" }
                },
                newEndTIme: {
                    $dateToString: { format: "%H:%M", date: "$EndTimeISO" }
                },
            }
        },
        {
            $addFields: {
                newEndDateTime: {
                    $concat: ["$newEndDate", " ", "$newEndTIme"]
                }
            }
        },
        {
            $addFields: {
                endDateTime: {
                    $toDate: "$newEndDateTime" 
                }
            }
        },

        {
            $match: { endDateTime: { $gte: new Date() } }
        },
        
        // {
        //     $lookup: {
        //         from: "musictypes",
        //         localField: "musicType",
        //         foreignField: "_id",
        //         as: "musicTypeData"
        //     }
        // },
        // {
        //     $unwind: "$musicTypeData"
        // },





        {
            $lookup: {
                from: "tickets",
                localField: "_id",
                foreignField: "eventId",
                as: "tickets"
            }
        },

        {
            $lookup: {
                from: "promotions",
                localField: "_id",
                foreignField: "eventId",
                as: "promotions"
            }
        },


        {
            $lookup: {
                from: "tablelists",
                localField: "tableList",
                foreignField: "_id",
                as: "tablelistsData"
            }
        },
        {
            $unwind: "$tablelistsData"
        },
        {
            $lookup: {
                from: "packages",
                localField: "packageList",
                foreignField: "_id",
                as: "packageListData"
            }
        },
        {
            $unwind: "$packageListData"
        },
        {
            $lookup: {
                from: "menus",
                localField: "menuList",
                foreignField: "_id",
                as: "menulistsData"
            }
        },
        {
            $unwind: "$menulistsData"
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
                from: "eventbookings",
                localField: "eventId",
                foreignField: "eventId",
                pipeline: [
                    {
                        $match: {
                            isDelete: false,
                            bookingStatus: "complete",
                            status: true,
                            approve: true,
                        }
                    },
                    {
                        $project: {
                            tickets: 0
                        }
                    }
                ],
                as: "bookings"
            }
        },
        {
            $addFields: {
                attend: { $size: "$bookings" }
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
                message: "Get All Event  Successfully",
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
    return Event.remove({ _id: { $in: [mongoose.Types.ObjectId(req.params.id)] } })
        .then((data) => {
            return res.status(200).json({
                success: true,
                message: 'Event delete successfully',
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
    return Event.findOneAndUpdate(
        { _id: { $in: [mongoose.Types.ObjectId(req.params.id)] } },
        {
            isDelete: true,
        },
        async (err, data) => {
            if (err) {
                res.status(500).json({
                    status: false,
                    message: "Server error. Please try again.",
                    error: err,
                });
                let PaymentList = await RefundsPayment(req);
                StripeRefundsAll(PaymentList);
                return;
            } else if (data != null) {
                return res.status(200).json({
                    status: true,
                    message: "Event Delete successful",
                    data: data,
                });
            } else {
                return res.status(500).json({
                    status: false,
                    message: "Event not match",
                    data: null,
                });
            }
        }
    );
}

const RefundsPayment = async (req) => {
    return await eventBooking.aggregate([
        {
            $match: { isDelete: false, bookingStatus: "complete" }
        },
        {
            $match: { eventId: mongoose.Types.ObjectId(req.params.id) }
        },
        {
            $addFields: {
                BookingId: { $toString: "$_id" }
            }
        },
        {
            $lookup: {
                from: "paymenthistories",
                localField: "BookingId",
                foreignField: "BookingId",
                as: "payment"
            }
        },
        {
            $unwind: "$payment"
        },
        {
            $addFields: {
                paymentId: { $toString: "$payment.paymentId" }
            }
        },
        {
            $project: {
                userId: 1,
                paymentId: 1,
                _id: 0
            },
        },
    ]).exec();
}

const viewSingel = async (req, res) => {
    return Event.aggregate([
        {
            $match: { _id: mongoose.Types.ObjectId(req.params.id) }
        },
        // {
        //     $lookup: {
        //         from: "musictypes",
        //         localField: "musicType",
        //         foreignField: "_id",
        //         as: "musicTypeData"
        //     }
        // },
        // {
        //     $unwind: "$musicTypeData"
        // },
        {
            $lookup: {
                from: "tickets",
                localField: "_id",
                foreignField: "eventId",
                as: "tickets"
            }
        },

        {
            $lookup: {
                from: "promotions",
                localField: "_id",
                foreignField: "eventId",
                as: "promotions"
            }
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
                from: "tablelists",
                localField: "tableList",
                foreignField: "_id",
                as: "tablelistsData"
            }
        },
        {
            $unwind: "$tablelistsData"
        },
        {
            $lookup: {
                from: "packages",
                localField: "packageList",
                foreignField: "_id",
                as: "packageListData"
            }
        },
        // { 
        //     $unwind: "$packageListData"
        // },
        {
            $lookup: {
                from: "menus",
                localField: "menuList",
                foreignField: "_id",
                as: "menulistsData"
            }
        },
        // {
        //     $unwind: "$menulistsData"
        // },



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
        .then(async (data) => {
            if (data && data.length > 0) {
                // console.log('tablelistsData', data[0]?.tablelistsData);
                for (let index = 0; index < data[0]?.tablelistsData?.tableList?.length; index++) {
                    const element = data[0]?.tablelistsData?.tableList[index];
                    let dat = await CheckAvailableTable({ eventId: req.params.id, tickets: [element] })
                    element.isAvailable = element?.avlTable >= dat.length;
                    element.purchased = dat.length;
                }

                for (let index = 0; index < data[0]?.tickets?.length; index++) {
                    const element = data[0]?.tickets[index];
                    let dat = await CheckAvailableTicket({ eventId: req.params.id, tickets: [element] })
                    element.isAvailable = element?.avl >= dat.length;
                    element.purchased = dat.length;
                }

                return res.status(200).json({
                    status: true,
                    message: "Get Event Singel Successfully",
                    data: data[0],
                });
            } else {
                return res.status(200).json({
                    status: false,
                    message: "No Event Find",
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

const ImageUpload = async (req, res) => {
    let uploadDAta = await Upload.uploadFile(req, "event");
    if (uploadDAta.status) {
        res.send(uploadDAta);
    } else {
        res.send(uploadDAta);
    }
}

const GetDjName = async (req, res) => {
    let djName = [];
    return Event.aggregate([
        {
            $match: { organizerId: mongoose.Types.ObjectId(req.user._id), isDelete: false }
        },
        {
            $project: {
                token: 0,
                __v: 0,
                musicType: 0,
                tickets: 0,
                promotions: 0,
                approve: 0,
                status: 0,
                isDelete: 0,
                name: 0,
                startDate: 0,
                endDate: 0,
                startTime: 0,
                endTime: 0,
                ladiesDessCode: 0,
                mensDessCode: 0,
                cantwear: 0,
                description: 0,
                location: 0,
                address: 0,
                zipcode: 0,
                state: 0,
                city: 0,
                image: 0,
                createOn: 0,
                organizerId: 0,
                specialGuestsName: 0,
                _id: 0
            },
        },
        {
            $sort: {
                _id: -1,
            }
        }
    ])
        .then((data) => {
            data.forEach((item) => {
                if (typeof (item.djName) != "undefined") {
                    djName.push(...item.djName);
                }
            })
            return res.status(200).json({
                status: true,
                message: "Get All djName  Successfully",
                // data: data,
                data: [...new Set([].concat(...djName))]
            });
        })
        .catch((error) => {
            res.status(200).json({
                status: false,
                message: "Server error. Please try again.",
                error: error,
            });
        });
}

const GetSpecialGuestsName = async (req, res) => {
    let specialGuestsName = [];
    return Event.aggregate([
        {
            $match: { organizerId: mongoose.Types.ObjectId(req.user._id), isDelete: false }
        },
        {
            $project: {
                token: 0,
                __v: 0,
                musicType: 0,
                tickets: 0,
                promotions: 0,
                approve: 0,
                status: 0,
                isDelete: 0,
                name: 0,
                startDate: 0,
                endDate: 0,
                startTime: 0,
                endTime: 0,
                ladiesDessCode: 0,
                mensDessCode: 0,
                cantwear: 0,
                description: 0,
                location: 0,
                address: 0,
                zipcode: 0,
                state: 0,
                city: 0,
                image: 0,
                createOn: 0,
                organizerId: 0,
                djName: 0,
                _id: 0
            },
        },
        {
            $sort: {
                _id: -1,
            }
        }
    ])
        .then((data) => {
            data.forEach((item) => {
                if (typeof (item.specialGuestsName) != "undefined") {
                    specialGuestsName.push(...item.specialGuestsName);
                }
            })
            return res.status(200).json({
                status: true,
                message: "Get All specialGuestsName  Successfully",
                // data: data,
                data: [...new Set([].concat(...specialGuestsName))]
            });
        })
        .catch((error) => {
            res.status(200).json({
                status: false,
                message: "Server error. Please try again.",
                error: error,
            });
        });
}

const CheckCode = async (req, res) => {
    return Event.aggregate([
        {
            $match: { organizerId: mongoose.Types.ObjectId(req.user._id), isDelete: false, }
        },
        {
            $project: {
                djName: 0,
                token: 0,
                __v: 0,
                musicType: 0,
                tickets: 0,
                // promotions: 1,
                approve: 0,
                status: 0,
                isDelete: 0,
                name: 0,
                startDate: 0,
                endDate: 0,
                startTime: 0,
                endTime: 0,
                ladiesDessCode: 0,
                mensDessCode: 0,
                cantwear: 0,
                description: 0,
                location: 0,
                address: 0,
                zipcode: 0,
                state: 0,
                city: 0,
                image: 0,
                createOn: 0,
                organizerId: 0,
                specialGuestsName: 0,
                _id: 0
            },
        },
        {
            $sort: {
                _id: -1,
            }
        }
    ])
        .then((data) => {
            let promotions = [];
            data.forEach((item) => {
                if (typeof (item.promotions) != "undefined") {
                    promotions.push(...item.promotions);
                }
            })
            let dataGat = promotions.filter(it => it.code == req.body.code);
            if (promotions && dataGat.length > 0) {
                res.status(200).json({
                    status: false,
                    message: "code already exists",
                    error: {},
                    // data: dataGat
                    // promotions,
                });
            } else {
                res.status(200).json({
                    status: true,
                    message: "code Not exists",
                    error: {},
                    // promotions
                });
            }
        })
        .catch((error) => {
            console.log(error);
            res.status(200).json({
                status: false,
                message: "Server error. Please try again.",
                error: error,
            });
        });
}

const GetPromotionsCode = async (req, res) => {
    return Event.aggregate([
        {
            $match: { isDelete: false }
        },
        {
            $project: {
                djName: 0,
                token: 0,
                __v: 0,
                musicType: 0,
                tickets: 0,
                // promotions: 1,
                approve: 0,
                status: 0,
                isDelete: 0,
                name: 0,
                startDate: 0,
                endDate: 0,
                startTime: 0,
                endTime: 0,
                ladiesDessCode: 0,
                mensDessCode: 0,
                cantwear: 0,
                description: 0,
                location: 0,
                address: 0,
                zipcode: 0,
                state: 0,
                city: 0,
                image: 0,
                createOn: 0,
                organizerId: 0,
                specialGuestsName: 0,
                _id: 0
            },
        },
        {
            $sort: {
                _id: -1,
            }
        }
    ])
        .then((data) => {
            let promotions = [];
            data.forEach((item) => {
                if (typeof (item.promotions) != "undefined") {
                    promotions.push(...item.promotions);
                }
            })
            if (promotions && promotions.filter(it => it.code == req.body.code).length > 0) {
                res.status(200).json({
                    status: false,
                    message: "code already exists",
                    error: {},
                    // promotions,
                });
            } else {
                res.status(200).json({
                    status: true,
                    message: "code Not exists",
                    error: {},
                    // promotions
                });
            }
        })
        .catch((error) => {
            console.log(error);
            res.status(200).json({
                status: false,
                message: "Server error. Please try again.",
                error: error,
            });
        });
}


const viewAllBooking = async (req, res) => {
    return eventBooking.aggregate([
        {
            $match: { isDelete: false, bookingStatus: "complete" }
        },
        {
            $match: { eventId: mongoose.Types.ObjectId(req.params.id) }
        },
        {
            $lookup: {
                from: "splitbookingusers",
                localField: "_id",
                foreignField: "bookingId",
                let: { organizerId: "organizerId" },
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "email",
                            foreignField: "email",
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
                ],
                as: "splitbookingusers"
            }
        },
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
                message: "Get All Event Booking his Successfully",
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
}

const viewAllBookingHis = async (req, res) => {
    return eventBooking.aggregate([
        // {
        //     $match: { isDelete: false, bookingStatus: "complete" }
        // },
        {
            $match: { organizerId: mongoose.Types.ObjectId(req.user._id) }
        },
        {
            $lookup: {
                from: "splitbookingusers",
                localField: "_id",
                foreignField: "bookingId",
                let: { organizerId: "organizerId" },
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "email",
                            foreignField: "email",
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
                ],
                as: "splitbookingusers"
            }
        },
        {
            $lookup: {
                from: "events",
                localField: "eventId",
                foreignField: "_id",
                pipeline: [
                    {
                        $addFields: {
                            newEndDate: {
                                $toDate: "$endDate"
                            },
                            newStartDate: {
                                $toDate: "$startDate"
                            }
                        }
                    },
                    {
                        $match: { newEndDate: { $gte: new Date() }, newStartDate: { $lte: new Date() } }
                    },
                ],
                as: "eventsData",
            }
        },
        {
            $unwind: "$eventsData"
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
                message: "Get All Event Booking his Successfully",
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
}

const QrBooking = async (req, res) => {
    console.log('req.user._id', req.user._id);
    return eventBooking.aggregate([
        {
            $match: {
                _id: mongoose.Types.ObjectId(req.params.id),
                organizerId: mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $match: { isDelete: false, bookingStatus: "complete" }
        },
        // {
        //     $match: { eventId: mongoose.Types.ObjectId(req.params.id) }
        // },
        {
            $lookup: {
                from: "splitbookingusers",
                localField: "_id",
                foreignField: "bookingId",
                let: { organizerId: "organizerId" },
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "email",
                            foreignField: "email",
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
                ],
                as: "splitbookingusers"
            }
        },
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
            if (data.length == 0) {
                return res.status(200).json({
                    status: false,
                    message: "Event Not found",
                    error: null,
                });
            }
            return res.status(200).json({
                status: true,
                message: "Get All Event Booking his Successfully",
                data: data[0],
            });
        })
        .catch((error) => {
            res.status(200).json({
                status: false,
                message: "Server error. Please try again.",
                error: error,
            });
        });
}

const BookingConfrim = async (req, res) => {
    return eventBooking.findOneAndUpdate(
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
                    message: "Booking update successful",
                    data: data,
                });
            } else {
                return res.status(500).json({
                    status: false,
                    message: "Booking Not found",
                    data: null,
                });
            }
        }
    );
}

module.exports = {
    create,
    update,
    viewAll,
    viewAllActive,
    Delete,
    viewSingel,
    ImageUpload,
    GetDjName,
    GetSpecialGuestsName,
    CheckCode,
    viewAllBooking,
    viewAllBookingHis,
    QrBooking,
    BookingConfrim
};

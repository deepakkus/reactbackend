const mongoose = require("mongoose");
const { Validator } = require("node-input-validator");
const Follow = require("../../Models/follow");
const { DBerror } = require("../../service/errorHaldel");

const create = async (req, res) => {
    const v = new Validator(req.body, {
        receiver: "required",
    });
    let matched = await v.check().then((val) => val);
    if (!matched) {
        return res.status(200).send({ status: false, error: v.errors });
    }

    let dataSet = {
        receiver: mongoose.Types.ObjectId(req.body.receiver),
        sender: mongoose.Types.ObjectId(req.user._id),
        createOn: new Date()
    };

    const modelData = await new Follow(dataSet);
    return modelData
        .save()
        .then((data) => {
            return res.status(200).json({
                status: true,
                message: "New Follow request successfully",
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

    return Follow.findOneAndUpdate(
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
                    message: "Follow update successful",
                    data: data,
                });
            } else {
                return res.status(500).json({
                    status: false,
                    message: "Follow not match",
                    data: null,
                });
            }
        }
    );
};

const followers = async (req, res) => {
    return Follow.aggregate([
        {
            $match: {
                receiver: mongoose.Types.ObjectId(req.user._id),
                isDelete: false,
                accpect: true,
                status: true
            }
        },
       

        {
            $lookup: {
                from: "users",
                localField: "sender",
                foreignField: "_id",
                pipeline: [
                    {
                        $addFields: {
                            userType: "Users"
                        }  
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
                            password: 0,
                            approve: 0,
                            status: 0,
                            deviceToken: 0,
                            isDelete: 0,
                            __v: 0,
                        },
                    },
                ],
                as: "userDataSub"
            }
        },

        {
            $lookup: {
                from: "organizerusers",
                localField: "sender",
                foreignField: "_id",
                pipeline: [
                    {
                        $addFields: {
                            userType: "Organizer"
                        }  
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
                            password: 0,
                            approve: 0,
                            status: 0,
                            deviceToken: 0,
                            isDelete: 0,
                            __v: 0,
                        },
                    },
                ],
                as: "OrganizeDataSub"
            }
        },

        {
            $addFields: {
                userData: {
                    $cond: [
                        {
                            $gt: [{ $size: "$userDataSub" }, 0]
                        },
                        "$userDataSub",
                        "$OrganizeDataSub"
                    ]
                },
            }
        },


        {
            $unwind: "$userData"
        },
        {
            $project: {
                token: 0,
                __v: 0,
                userDataSub: 0,
                OrganizeDataSub: 0
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
                message: "Get All Follow Successfully",
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

const following = async (req, res) => {
    return Follow.aggregate([
        {
            $match: {
                sender: mongoose.Types.ObjectId(req.user._id),
                isDelete: false,
                accpect: true,
                status: true
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "receiver",
                foreignField: "_id",
                pipeline: [
                    {
                        $addFields: {
                            userType: "Users"
                        }  
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
                            password: 0,
                            approve: 0,
                            status: 0,
                            deviceToken: 0,
                            isDelete: 0,
                            __v: 0,
                        },
                    },
                ],
                as: "userDataSub"
            }
        },

        {
            $lookup: {
                from: "organizerusers",
                localField: "receiver",
                foreignField: "_id",
                pipeline: [
                    {
                        $addFields: {
                            userType: "Organizer"
                        }  
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
                            password: 0,
                            approve: 0,
                            status: 0,
                            deviceToken: 0,
                            isDelete: 0,
                            __v: 0,
                        },
                    },
                ],
                as: "OrganizeDataSub"
            }
        },

        {
            $addFields: {
                userData: {
                    $cond: [
                        {
                            $gt: [{ $size: "$userDataSub" }, 0]
                        },
                        "$userDataSub",
                        "$OrganizeDataSub"
                    ]
                },
            }
        },


        {
            $unwind: "$userData"
        },
        {
            $project: {
                token: 0,
                __v: 0,
                userDataSub: 0,
                OrganizeDataSub: 0
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
                message: "Get All Follow Successfully",
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

const request = async (req, res) => {
    return Follow.aggregate([
        {
            $match: {
                isDelete: false,
                accpect: false,
                status: true,
            }
        },
        {
            $match: {
                $or: [
                    { sender: mongoose.Types.ObjectId(req.user._id) },
                    { receiver: mongoose.Types.ObjectId(req.user._id) }
                ]
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "receiver",
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
                        $addFields: {
                            userType: "User"
                        }  
                    },
                    {
                        $project: {
                            token: 0,
                            password: 0,
                            approve: 0,
                            status: 0,
                            deviceToken: 0,
                            isDelete: 0,
                            __v: 0,
                        },
                    },
                ],
                as: "receiverDataUser"
            }
        },
        {
            $lookup: {
                from: "organizerusers",
                localField: "receiver",
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
                        $addFields: {
                            userType: "Organizer"
                        }  
                    },
                    {
                        $project: {
                            token: 0,
                            password: 0,
                            approve: 0,
                            status: 0,
                            deviceToken: 0,
                            isDelete: 0,
                            __v: 0,
                        },
                    },
                ],
                as: "receiverDataOrganizer"
            }
        },
        

        {
            $lookup: {
                from: "users",
                localField: "sender",
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
                        $addFields: {
                            userType: "User"
                        }  
                    },
                    {
                        $project: {
                            token: 0,
                            password: 0,
                            approve: 0,
                            status: 0,
                            deviceToken: 0,
                            isDelete: 0,
                            __v: 0,
                        },
                    },
                ],
                as: "senderDataUser"
            }
        },
        {
            $lookup: {
                from: "organizerusers",
                localField: "sender",
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
                        $addFields: {
                            userType: "Organizer"
                        }  
                    },
                    {
                        $project: {
                            token: 0,
                            password: 0,
                            approve: 0,
                            status: 0,
                            deviceToken: 0,
                            isDelete: 0,
                            __v: 0,
                        },
                    },
                ],
                as: "senderDataOrganizer"
            }
        },


        {
            $addFields: {
                receiverData: {
                    $cond: [
                        {
                            $gt: [{ $size: "$receiverDataOrganizer" }, 0]
                        },
                        "$receiverDataOrganizer",
                        "$receiverDataUser"
                    ]
                },
                senderData: {
                    $cond: [
                        {
                            $gt: [{ $size: "$senderDataOrganizer" }, 0]
                        },
                        "$senderDataOrganizer",
                        "$senderDataUser"
                    ]
                }
            },
        },
        {
            $unwind: "$receiverData"
        },
        {
            $unwind: "$senderData"
        },
        {
            $project: {
                token: 0,
                __v: 0,
                receiverDataOrganizer: 0,
                receiverDataUser: 0,
                senderDataOrganizer: 0,
                senderDataUser: 0
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
                message: "Get All Follow Successfully",
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


module.exports = {
    create,
    update,
    followers,
    following,
    request
}
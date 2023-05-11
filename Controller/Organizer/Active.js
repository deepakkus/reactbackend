var mongoose = require("mongoose");
const Active = require("../../Models/active")


const CreateActive = async (req, { massage, receverId, external }) => {

    let MenuData = {
        massage, receverId, external,
        sendId: mongoose.Types.ObjectId(req.user._id),
        createOn: new Date(),
    };
    const modelData = await new Active(MenuData);
    return modelData
        .save()
        .then((data) => {
            //   return res.status(200).json({
            //     status: true,
            //     message: "Event Booking successfully",
            //     data: data,
            //   });
        })
        .catch((error) => {
            //   let errorMessage = DBerror(error);
            //   res.status(200).json({
            //     status: false,
            //     message: errorMessage,
            //     error: error,
            //   });
        });
}

const viewAllOrganizerActive = async (req, res) => {
    return Active.aggregate([
        {
            $match: { receverId: mongoose.Types.ObjectId(req.user._id), isDelete: false }
        },
        {
            $lookup: {
                from: "events",
                localField: "eventId",
                foreignField: "_id",
                as: "eventData",
            },
        },
        {
            $unwind: "$eventData",
        },
        {
            $lookup: {
                from: "users",
                localField: "sendId",
                foreignField: "_id",
                pipeline: [
                    {
                        $project: {
                            token: 0,
                            password: 0,
                            approve: 0,
                            status: 0,
                            deviceToken: 0,
                            organizer: 0,
                            musicType: 0,
                            favoriteDrink: 0,
                            eventType:0,
                            isDelete: 0,
                            addOnDate: 0,
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
            if (data && data.length > 0) {
                return res.status(200).json({
                    status: true,
                    message: "Get Active Successfully",
                    data: data,
                });
            } else {
                return res.status(200).json({
                    status: false,
                    message: "No Active Find",
                    data: [],
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

module.exports = {
    CreateActive,
    viewAllOrganizerActive
}
var mongoose = require("mongoose");
const Event = require("../../Models/event");
const EventBooking = require("../../Models/eventBooking");
// var passwordHash = require("password-hash");
var Upload = require("../../service/upload");
const { Validator } = require("node-input-validator");
var uuidv1 = require("uuid").v1;
const { DBerror } = require("../../service/errorHaldel");
const SplitBookingUsers = require("../../Models/splitBookingUsers");
const { sendEmail } = require("../../service/email");
const { CreateActive, UpdateActive } = require("./Active");
const moment = require("moment");
const User = require("../../Models/user");

function createToken(data) {
  data.hase = uuidv1();
  return jwt.sign(data, "DonateSmile");
}
const checkAvailableTable = async ({ eventId, tickets }) => {
  let ticketsIdArray = tickets.map(it => `${it.id}`);
  return await EventBooking.aggregate([
    {
      $match: { isDelete: false, bookingStatus: "complete", bookingType: "reservation" },
    },
    {
      $match: { eventId: mongoose.Types.ObjectId(eventId) },
    },
    {
      $unwind: "$tickets",
    },
    {
      $addFields: {
        ticketsId: "$tickets.id"
      }
    },
    {
      $match: { ticketsId: { $in: ticketsIdArray } }
    },
    {
      $project: {
        "bookingStatus": 1,
        "tickets": 1,
        "split": 1,
        "bookingType": 1,
        "ticketsId": 1
      }
    }
  ]).exec();
}


const checkAvailableTicket = async ({ eventId, tickets }) => {
  let ticketsIdArray = tickets.map(it => `${it._id}`);
  return await EventBooking.aggregate([
    {
      $match: { isDelete: false, bookingStatus: "complete", bookingType: "ticket" },
    },
    {
      $match: { eventId: mongoose.Types.ObjectId(eventId) },
    },
    {
      $unwind: "$tickets",
    },
    {
      $addFields: {
        ticketsId: "$tickets._id"
      }
    },
    {
      $match: { ticketsId: { $in: ticketsIdArray } }
    },
    {
      $project: {
        "bookingStatus": 1,
        "tickets": 1,
        "split": 1,
        "bookingType": 1,
        "ticketsId": 1
      }
    }
  ]).exec();

}

const viewAll = async (req, res) => {
  return Event.aggregate([
    {
      $match: { isDelete: false, status: true },
    },
    
    // end time checking 
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
    // end time checking 


    {
      $lookup: {
        from: "eventbookings",
        localField: "_id",
        foreignField: "eventId",
        pipeline: [
          {
            $match: {
              isDelete: false,
              bookingStatus: "complete",
              status: true,
              approve: true,
              userId: mongoose.Types.ObjectId(req.user._id),
            },
          },
          {
            $project: {
              tickets: 0,
            },
          },
        ],
        as: "bookings",
      },
    },
    {
      $addFields: {
        bookingsCount: { $size: "$bookings" },
      },
    },
    // {
    //   $match: { bookingsCount: 0 },
    // },
    {
      $lookup: {
        from: "states",
        localField: "state",
        foreignField: "id",
        as: "stateData",
      },
    },
    {
      $unwind: "$stateData",
    },
    {
      $lookup: {
        from: "cities",
        localField: "city",
        foreignField: "id",
        as: "cityData",
      },
    },
    {
      $unwind: "$cityData",
    },
    {
      $lookup: {
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
              as: "cityData",
            },
          },
          {
            $unwind: "$cityData",
          },
          {
            $lookup: {
              from: "states",
              localField: "state",
              foreignField: "id",
              as: "stateData",
            },
          },
          {
            $unwind: "$stateData",
          },

          {
            $lookup: {
              from: "organizers",
              localField: "organizerType",
              foreignField: "_id",
              as: "organizerTypeData",
            },
          },
          {
            $unwind: "$organizerTypeData",
          },
          {
            $lookup: {
              from: "organizers",
              localField: "secondaryType",
              foreignField: "_id",
              as: "secondaryTypeData",
            },
          },
          {
            $unwind: "$secondaryTypeData",
          },
          {
            $project: {
              token: 0,
              __v: 0,
              deviceToken: 0,
              password: 0,
              "organizerTypeData.__v": 0,
              "secondaryTypeData.__v": 0,
            },
          },
        ],
        as: "organizerData",
      },
    },
    {
      $unwind: "$organizerData",
    },

    {
      $lookup: {
        from: "eventbookings",
        localField: "_id",
        foreignField: "eventId",
        pipeline: [
          {
            $match: {
              isDelete: false,
              bookingStatus: "complete",
              status: true,
              approve: true,
            },
          },
          {
            $project: {
              tickets: 0,
            },
          },
        ],
        as: "bookings",
      },
    },
    {
      $addFields: {
        attend: { $size: "$bookings" },
      },
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
    {
      $sort: {
        _id: -1,
      },
    },
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

const viewSingel = async (req, res) => {
  return Event.aggregate([
    {
      $match: { _id: mongoose.Types.ObjectId(req.params.id) },
    },
    {
      $lookup: {
        from: "tickets",
        localField: "_id",
        foreignField: "eventId",
        as: "tickets",
      },
    },

    {
      $lookup: {
        from: "promotions",
        localField: "_id",
        foreignField: "eventId",
        as: "promotions",
      },
    },
    {
      $lookup: {
        from: "states",
        localField: "state",
        foreignField: "id",
        as: "stateData",
      },
    },
    {
      $unwind: "$stateData",
    },
    {
      $lookup: {
        from: "cities",
        localField: "city",
        foreignField: "id",
        as: "cityData",
      },
    },
    {
      $unwind: "$cityData",
    },
    {
      $lookup: {
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
              as: "cityData",
            },
          },
          {
            $unwind: "$cityData",
          },
          {
            $lookup: {
              from: "states",
              localField: "state",
              foreignField: "id",
              as: "stateData",
            },
          },
          {
            $unwind: "$stateData",
          },

          {
            $lookup: {
              from: "organizers",
              localField: "organizerType",
              foreignField: "_id",
              as: "organizerTypeData",
            },
          },
          {
            $unwind: "$organizerTypeData",
          },
          {
            $lookup: {
              from: "organizers",
              localField: "secondaryType",
              foreignField: "_id",
              as: "secondaryTypeData",
            },
          },
          {
            $unwind: "$secondaryTypeData",
          },
          {
            $project: {
              token: 0,
              __v: 0,
              "organizerTypeData.__v": 0,
              "secondaryTypeData.__v": 0,
            },
          },
        ],
        as: "organizerData",
      },
    },
    {
      $unwind: "$organizerData",
    },

    {
      $lookup: {
        from: "tablelists",
        localField: "tableList",
        foreignField: "_id",
        as: "tablelistsData",
      },
    },
    {
      $unwind: "$tablelistsData",
    },
    {
      $lookup: {
        from: "packages",
        localField: "packageList",
        foreignField: "_id",
        as: "packageListData",
      },
    },
    {
      $unwind: "$packageListData",
    },
    {
      $lookup: {
        from: "menus",
        localField: "menuList",
        foreignField: "_id",
        as: "menulistsData",
      },
    },
    {
      $unwind: "$menulistsData",
    },

    {
      $lookup: {
        from: "eventbookings",
        localField: "_id",
        foreignField: "eventId",
        pipeline: [
          {
            $match: {
              isDelete: false,
              bookingStatus: "complete",
              status: true,
              approve: true,
            },
          },
          {
            $project: {
              tickets: 0,
            },
          },
        ],
        as: "bookings",
      },
    },
    {
      $addFields: {
        attend: { $size: "$bookings" },
      },
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
    {
      $sort: {
        _id: -1,
      },
    },
  ])
    .then(async (data) => {
      if (data && data.length > 0) {

        for (let index = 0; index < data[0]?.tablelistsData?.tableList?.length; index++) {
          const element = data[0]?.tablelistsData?.tableList[index];
          let dat = await checkAvailableTable({ eventId: req.params.id, tickets: [element] })
          element.isAvailable = element?.avlTable >= dat.length;
          element.purchased = dat.length;
        }

        for (let index = 0; index < data[0]?.tickets?.length; index++) {
          const element = data[0]?.tickets[index];
          let dat = await checkAvailableTicket({ eventId: req.params.id, tickets: [element] })
          element.isAvailable = element?.avl >= dat.length;
          element.purchased = dat.length;
        }

        return await res.status(200).json({
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



const createBooking = async (req, res) => {
  const v = new Validator(req.body, {
    organizerId: "required",
    eventId: "required",
    tickets: "array",
    bookingType: 'required'
  });
  let matched = await v.check().then((val) => val);
  if (!matched) {
    return res.status(200).send({ status: false, error: v.errors });
  }

  if (req.body?.bookingType == "reservation" && req.body?.tickets) {
    let checkAvailableTableData = await checkAvailableTable(req.body);
    if (checkAvailableTableData.length >= req.body?.tickets[0].avlTable) {
      return res.status(200).json({
        status: false,
        message: "Event all Table already booking ",
        data: null,
      });
    }
  }

  if (req.body?.bookingType == "ticket" && req.body?.tickets) {
    let checkAvailableTicketsData = await checkAvailableTicket(req.body);
    if (checkAvailableTicketsData.length >= req.body?.tickets[0].avl) {
      return res.status(200).json({
        status: false,
        message: "Event all Ticket already booking ",
        data: null,
      });
    }
  }

  let MenuData = {
    ...req.body,
    userId: mongoose.Types.ObjectId(req.user._id),
    createOn: new Date(),
  };

  const modelData = await new EventBooking(MenuData);
  return modelData
    .save()
    .then(async (data) => {

      if (req?.body?.bookingStatus == "complete") {
        let eventData = await Event.findOne({ _id: mongoose.Types.ObjectId(data.eventId) }).exec();
        let purchasedCount = data?.tickets?.map(it => it?.count).reduce((a, c) => a + c, 0);
        let reservationMsg = `${req.user.firstname} ${req.user.lastname} booked a ${data?.tickets[0]?.TableType} for ${eventData?.name} on ${moment(eventData?.startDate).format("Do MMM YYYY")} for $${data?.total}`
        let ticketsMsg = `${req.user.firstname} ${req.user.lastname} purchased ${purchasedCount} Ticket(s) for ${eventData?.name}, on ${moment(eventData?.startDate).format("Do MMM YYYY")}  for $${data?.total}`
        CreateActive(req, {
          massage: req.body?.bookingType == "reservation" ? reservationMsg : ticketsMsg,
          receverId: mongoose.Types.ObjectId(data?.organizerId),
          total: data?.total,
          eventId: mongoose.Types.ObjectId(eventData?._id),
          external: {
            type: "eventBooking",
            subtype: "complete",
            _id: mongoose.Types.ObjectId(data?._id),
            bookingType: data?.bookingType
          }
        });
      }
      return res.status(200).json({
        status: true,
        message: "Event Booking successfully",
        data: data,
      });
    })
    .catch((error) => {
      console.log('error', error);
      let errorMessage = DBerror(error);
      res.status(200).json({
        status: false,
        message: errorMessage,
        error: error,
      });
    });
};

const viewAllBooking = async (req, res) => {
  return EventBooking.aggregate([
    {
      $match: { isDelete: false },
    },
    {
      $match: { userId: mongoose.Types.ObjectId(req.user._id) },
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
                    as: "paymentmethods",
                  },
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
              as: "userData",
            },
          },
        ],
        as: "splitbookingusers",
      },
    },
    {
      $lookup: {
        from: "events",
        localField: "eventId",
        foreignField: "_id",
        as: "eventsData",
      },
    },
    {
      $unwind: "$eventsData",
    },
    {
      $lookup: {
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
              as: "cityData",
            },
          },
          {
            $unwind: "$cityData",
          },
          {
            $lookup: {
              from: "states",
              localField: "state",
              foreignField: "id",
              as: "stateData",
            },
          },
          {
            $unwind: "$stateData",
          },

          {
            $lookup: {
              from: "organizers",
              localField: "organizerType",
              foreignField: "_id",
              as: "organizerTypeData",
            },
          },
          {
            $unwind: "$organizerTypeData",
          },
          {
            $lookup: {
              from: "organizers",
              localField: "secondaryType",
              foreignField: "_id",
              as: "secondaryTypeData",
            },
          },
          {
            $unwind: "$secondaryTypeData",
          },
          {
            $project: {
              token: 0,
              __v: 0,
              "organizerTypeData.__v": 0,
              "secondaryTypeData.__v": 0,
            },
          },
        ],
        as: "organizerData",
      },
    },
    {
      $unwind: "$organizerData",
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
            },
          },
          {
            $project: {
              tickets: 0,
            },
          },
        ],
        as: "bookings",
      },
    },
    {
      $addFields: {
        attend: { $size: "$bookings" },
      },
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
    {
      $sort: {
        _id: -1,
      },
    },
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

const singelBooking = async (req, res) => {
  return EventBooking.aggregate([
    {
      $match: { isDelete: false },
    },
    {
      $match: { _id: mongoose.Types.ObjectId(req.params.id) },
    },
    {
      $match: { userId: mongoose.Types.ObjectId(req.user._id) },
    },
    {
      $lookup: {
        from: "events",
        localField: "eventId",
        foreignField: "_id",
        as: "eventsData",
      },
    },
    {
      $unwind: "$eventsData",
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
                    as: "paymentmethods",
                  },
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
              as: "userData",
            },
          },
        ],
        as: "splitbookingusers",
      },
    },
    {
      $lookup: {
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
              as: "cityData",
            },
          },
          {
            $unwind: "$cityData",
          },
          {
            $lookup: {
              from: "states",
              localField: "state",
              foreignField: "id",
              as: "stateData",
            },
          },
          {
            $unwind: "$stateData",
          },

          {
            $lookup: {
              from: "organizers",
              localField: "organizerType",
              foreignField: "_id",
              as: "organizerTypeData",
            },
          },
          {
            $unwind: "$organizerTypeData",
          },
          {
            $lookup: {
              from: "organizers",
              localField: "secondaryType",
              foreignField: "_id",
              as: "secondaryTypeData",
            },
          },
          {
            $unwind: "$secondaryTypeData",
          },
          {
            $project: {
              token: 0,
              __v: 0,
              "organizerTypeData.__v": 0,
              "secondaryTypeData.__v": 0,
            },
          },
        ],
        as: "organizerData",
      },
    },
    {
      $unwind: "$organizerData",
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
            },
          },
          {
            $project: {
              tickets: 0,
            },
          },
        ],
        as: "bookings",
      },
    },
    {
      $addFields: {
        attend: { $size: "$bookings" },
      },
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
    {
      $sort: {
        _id: -1,
      },
    },
  ])
    .then((data) => {
      return res.status(200).json({
        status: true,
        message: "Singel Event  Successfully",
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

const updateBooking = async (req, res) => {
  const v = new Validator(req.body, {
    organizerId: "required",
    eventId: "required",
    tickets: "required|array",
    bookingType: 'required'
  });
  let matched = await v.check().then((val) => val);
  if (!matched) {
    return res.status(200).send({ status: false, error: v.errors });
  }

  if (req.body?.bookingType == "reservation" && req.body?.tickets) {
    let checkAvailableTableData = await checkAvailableTable(req.body);
    console.log('checkAvailableTableData', checkAvailableTableData);
    if (checkAvailableTableData.length >= req.body?.tickets[0].avlTable) {
      return res.status(200).json({
        status: false,
        message: "Event all Table already booking ",
        data: null,
      });
    }
  }

  if (req.body?.bookingType == "ticket" && req.body?.tickets) {
    let checkAvailableTicketsData = await checkAvailableTicket(req.body);
    if (checkAvailableTicketsData.length >= req.body?.tickets[0].avl) {
      return res.status(200).json({
        status: false,
        message: "Event all Ticket already booking ",
        data: null,
      });
    }
  }

  return EventBooking.findOneAndUpdate(
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
        // console.log('6312532b1894d8eca5dc6781', req?.body)
        data = { ...data._doc, ...req.body };

        console.log('ho');
        if (req?.body?.bookingStatus == "complete") {

          let eventData = await Event.findOne({ _id: mongoose.Types.ObjectId(data.eventId) }).exec();

          // check this line 
          let splitbookinguserList = await SplitBookingUsers.find({ bookingId: mongoose.Types.ObjectId(data._id), approved: true }).exec();
          // console.log('splitbookinguserList', splitbookinguserList);
          // return;
          let purchasedCount = data?.tickets?.map(it => it?.count).reduce((a, c) => a + c, 0);
          let reservationMsg = `${req.user.firstname} ${req.user.lastname} booked a ${data?.tickets[0]?.TableType} for ${eventData?.name} on ${moment(eventData?.startDate).format("Do MMM YYYY")} for $${data?.total}`
          let ticketsMsg = `${req.user.firstname} ${req.user.lastname} purchased ${purchasedCount} Ticket(s) for ${eventData?.name}, on ${moment(eventData?.startDate).format("Do MMM YYYY")}  for $${data?.total}`

          // let splitBill = `${req.user.firstname} ${req.user.lastname} and ${data?.bookingType == "reservation" ? "Table" : "Package"} reservations with ${splitbookinguserList.length} others for ${eventData?.name} on ${moment(eventData?.startDate).format("Do MMM YYYY")}`
          let splitBill = `${req.user.firstname} ${req.user.lastname} and ${splitbookinguserList.length} others booked a ${data?.tickets[0]?.TableType} for ${eventData?.name}, on ${moment(eventData?.startDate).format("Do MMM YYYY")} for $${data?.total}`
          // console.log('splitBill', splitBill);
          CreateActive(req, {
            massage: data?.split ? splitBill : req.body?.bookingType == "reservation" ? reservationMsg : ticketsMsg,
            receverId: mongoose.Types.ObjectId(data?.organizerId),
            total: data?.total,
            eventId: mongoose.Types.ObjectId(eventData?._id),
            external: {
              type: "eventBooking",
              subtype: "complete",
              _id: mongoose.Types.ObjectId(data?._id),
              bookingType: data?.bookingType,
              split: data?.split
            }
          });
        }


        return res.status(200).json({
          status: true,
          message: "Event Booking update successfull",
          data: data,
        });
      } else {
        return res.status(500).json({
          status: false,
          message: "Event Booking not match",
          data: null,
        });
      }
    }
  );
};

const inviteUser = async (req, email) => {
  let html = `
            <center>
                <h1>welcome to tabyat</h1>
                <p>sending invitation by <b>${req.user.firstname} ${req.user.lastname} </b></p>
            </center>
        `;
  return await sendEmail(html, email);
};

const inviteBooking = async (req, res) => {
  const v = new Validator(req.body, {
    bookingId: "required",
    gestList: "required|array",
  });
  let matched = await v.check().then((val) => val);
  if (!matched) {
    return res.status(200).send({ status: false, error: v.errors });
  }

  let emailOnly = req.body.gestList
    .map((v) =>
      v?.isGest == true && typeof v.email != "undefined" ? v.email : null
    )
    .filter((it) => it != null)
    .join();

  // inviteUser(req, emailOnly)

  // const gestList = req.body.gestList.map(v => ({
  //     ...v,
  //     userId: mongoose.Types.ObjectId(req.user._id),
  //     bookingId: mongoose.Types.ObjectId(req.body.bookingId),
  // }));

  // return SplitBookingUsers.insertMany(gestList)
  return inviteUser(req, emailOnly)
    .then((result) => {
      return res.status(200).json({
        status: true,
        message: "Event Booking successfully",
        data: result,
      });
    })
    .catch((error) => {
      console.log("error", error);
      let errorMessage = DBerror(error);
      res.status(200).json({
        status: false,
        message: errorMessage,
        error: error,
      });
    });
};

const singelUserAdd = async (req, res) => {
  const v = new Validator(req.body, {
    bookingId: "required",
    fullname: "required",
    email: "required",
    isGest: "required",
  });
  let matched = await v.check().then((val) => val);
  if (!matched) {
    return res.status(200).send({ status: false, error: v.errors });
  }
  const ticket = await new SplitBookingUsers({
    ...req.body,
    userId: mongoose.Types.ObjectId(req.user._id),
    bookingId: mongoose.Types.ObjectId(req.body.bookingId),
  });
  return ticket
    .save()
    .then(async (data) => {
      let userGeData = await User.findOne({ email: data?.email }).exec();
      let eventData = await EventBooking.findOne({ _id: mongoose.Types.ObjectId(req.body.bookingId) }).exec();
      if (userGeData && eventData) {

        CreateActive(req, {
          massage: `${req.user.firstname} ${req.user.lastname} send split bill request`,
          receverId: mongoose.Types.ObjectId(userGeData?._id),
          total: 0,
          eventId: mongoose.Types.ObjectId(eventData?.eventId),
          external: {
            type: "SplitBill",
            bookingId: mongoose.Types.ObjectId(req.body.bookingId),
            _id: mongoose.Types.ObjectId(data?.bookingId),
            splitBookingId: data?._id,
            request: 0
          }
        });
      }

      return res.status(200).json({
        status: true,
        message: "New Ticket created successfully",
        data: data,
      });
    })
    .catch((error) => {
      let errorMessage = DBerror(error);
      console.log("error", error);
      res.status(200).json({
        status: false,
        message: errorMessage,
        error: error,
      });
    });
};

const approvedSplitUser = async (req, res) => {
  return SplitBookingUsers.findOneAndUpdate(
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
        console.log('data?.approved', data?.approved)
        UpdateActive(req.body?.activitie, data?.approved ? 1 : 2,
          ((e, d) => console.log(e, d))
        )
        return res.status(200).json({
          status: true,
          message: "User approved successful",
          data: data,
        });
      } else {
        return res.status(500).json({
          status: false,
          message: "Event Booking not match",
          data: null,
        });
      }
    }
  );
}

const splitUserList = async (req, res) => {
  return SplitBookingUsers.aggregate([
    {
      $match: { isDelete: false },
    },
    {
      $match: { bookingId: mongoose.Types.ObjectId(req.params.id) },
    },
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
              as: "paymentmethods",
            },
          },
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
              eventType: 0,
              isDelete: 0,
              // addOnDate: 0,
              __v: 0,
            },
          },
        ],
        as: "userData",
      },
    },
  ])
    .then((result) => {
      return res.status(200).json({
        status: true,
        message: "get split User List  successfully",
        data: result,
      });
    })
    .catch((error) => {
      console.log("error", error);
      let errorMessage = DBerror(error);
      res.status(200).json({
        status: false,
        message: errorMessage,
        error: error,
      });
    });
};

const eventUser = async (req, res) => {
  return EventBooking.aggregate([
    {
      $match: { bookingStatus: "complete" },
    },
    {
      $match: { eventId: mongoose.Types.ObjectId(req.params.id) },
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
              as: "paymentmethods",
            },
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
        as: "userData",
      },
    },
    {
      $unwind: "$userData",
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
                    as: "paymentmethods",
                  },
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
                    isDelete: 0,
                    // addOnDate: 0,
                    __v: 0,
                  },
                },
              ],
              as: "userData",
            },
          },
          {
            $unwind: "$userData",
          },
        ],
        as: "splitbookingusers",
      },
    },
    {
      $project: {
        tickets: 0,
      },
    },
    {
      $sort: {
        _id: -1,
      },
    },
  ])
    .then((result) => {
      let splitbookingusers = [];
      result.forEach((element) => {
        splitbookingusers = [
          ...splitbookingusers,
          ...element.splitbookingusers.map((itt) => itt.userData),
          ...[{ ...element?.userData }],
        ];
      });
      return res.status(200).json({
        status: true,
        message: "New Ticket created successfully",
        data: splitbookingusers, // [...result.map(it=>({ ...it.userData}))],
      });
    })
    .catch((error) => {
      let errorMessage = DBerror(error);
      console.log("error", error);
      res.status(200).json({
        status: false,
        message: errorMessage,
        error: error,
      });
    });
};

const owmeventUser = async (req, res) => {
  return EventBooking.aggregate([
    {
      $match: { bookingStatus: "complete" },
    },
    {
      $match: { eventId: mongoose.Types.ObjectId(req.params.id) },
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
              as: "paymentmethods",
            },
          },
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
              eventType: 0,
              isDelete: 0,
              addOnDate: 0,
              __v: 0,
            },
          },
        ],
        as: "userData",
      },
    },
    {
      $unwind: "$userData",
    },
    {
      $match: { "userData._id": mongoose.Types.ObjectId(req.user._id) },
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
                    as: "paymentmethods",
                  },
                },
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
                    eventType: 0,
                    isDelete: 0,
                    addOnDate: 0,
                    __v: 0,
                  },
                },
              ],
              as: "userData",
            },
          },
          {
            $unwind: "$userData",
          },
        ],
        as: "splitbookingusers",
      },
    },
    {
      $project: {
        tickets: 0,
      },
    },
    {
      $sort: {
        _id: -1,
      },
    },
  ])
    .then((result) => {
      let splitbookingusers = [];
      result.forEach((element) => {
        splitbookingusers = [
          ...splitbookingusers,
          ...element.splitbookingusers.map((itt) => itt.userData),
          // ...[{...element?.userData}]
        ];
      });
      return res.status(200).json({
        status: true,
        message: "New Ticket created successfully",
        data: splitbookingusers, // [...result.map(it=>({ ...it.userData}))],
        // data: result,
        // params: req.params
      });
    })
    .catch((error) => {
      let errorMessage = DBerror(error);
      console.log("error", error);
      res.status(200).json({
        status: false,
        message: errorMessage,
        error: error,
      });
    });
};

const eventBookingCancel = async (req, res) => {
  const v = new Validator(req.body, {
    bookingId: "required",
    reason: "required",
  });
  let matched = await v.check().then((val) => val);
  if (!matched) {
    return res.status(200).send({ status: false, error: v.errors });
  }

  return EventBooking.findOneAndUpdate(
    { _id: { $in: [mongoose.Types.ObjectId(req.body.bookingId)] } },
    {
      bookingStatus: "cancel",
      reason: req.body.reason,
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

        let eventData = await Event.findOne({ _id: mongoose.Types.ObjectId(data.eventId) }).exec();
        let bookingType = data.tablesPay ? "Table" : "Package"
        CreateActive(req, {
          massage: `${req.user.firstname} ${req.user.lastname} Canceled their ${bookingType} reservation for ${eventData?.name} on ${moment(eventData?.startDate).format("Do MMM YYYY")}`,
          receverId: mongoose.Types.ObjectId(data?.organizerId),
          total: data?.total,
          eventId: mongoose.Types.ObjectId(eventData?._id),
          external: {
            type: "eventBooking",
            subtype: "cancel",
            _id: mongoose.Types.ObjectId(data?._id)
          }
        });

        return res.status(200).json({
          status: true,
          message: "cancel successful",
          data: data,
        });
      } else {
        return res.status(500).json({
          status: false,
          message: "Event Booking not match",
          data: null,
        });
      }
    }
  );
};

const distingState = async (req, res) => {
  return Event.aggregate([
    {
      $match: { isDelete: false },
    },
    {
      $addFields: {
        newEndDate: {
          $toDate: "$endDate",
        },
      },
    },
    {
      $match: { newEndDate: { $gte: new Date() } },
    },
    {
      $group: {
        _id: {
          city: "$city",
          state: "$state",
        },
      },
    },
    {
      $lookup: {
        from: "states",
        localField: "_id.state",
        foreignField: "id",
        as: "stateData",
      },
    },
    {
      $unwind: "$stateData",
    },
    {
      $lookup: {
        from: "cities",
        localField: "_id.city",
        foreignField: "id",
        as: "cityData",
      },
    },
    {
      $unwind: "$cityData",
    },
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

const SplitUserDelete = async (req, res) => {
  return SplitBookingUsers.deleteOne({
    _id: mongoose.Types.ObjectId(req.params.id),
  })
    .then((data) => {
      return res.status(200).json({
        status: true,
        message: "Ticket Delete successful",
        data: data,
      });
    })
    .catch(() => {
      return res.status(500).json({
        status: false,
        message: "Ticket not match",
        data: null,
      });
    });
};

module.exports = {
  viewAll,
  viewSingel,
  createBooking,
  viewAllBooking,
  singelBooking,
  updateBooking,
  inviteBooking,
  singelUserAdd,
  eventUser,
  owmeventUser,
  eventBookingCancel,
  distingState,
  SplitUserDelete,
  splitUserList,
  approvedSplitUser,
  CheckAvailableTable: checkAvailableTable,
  CheckAvailableTicket: checkAvailableTicket
};

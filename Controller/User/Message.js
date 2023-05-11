const mongoose = require("mongoose");
const { Validator } = require("node-input-validator");
const Message = require("../../Models/message");
const { DBerror } = require("../../service/errorHaldel");

const sendMessage = async (req, res) => {
  const v = new Validator(req.body, {
    sender: "required",
    message: "required",
    type: "required",
  });
  let matched = await v.check().then((val) => val);
  if (!matched) {
    return res.status(200).send({ status: false, error: v.errors });
  }

  let dataSet = {
    ...req.body,
    sender: mongoose.Types.ObjectId(req.body.sender),
    userId: mongoose.Types.ObjectId(req.user._id),
    createOn: new Date(),
  };

  const modelData = await new Message(dataSet);
  return modelData
    .save()
    .then((data) => {
      return res.status(200).json({
        status: true,
        message: "New Message send successfully",
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

const sendList = async (req, res) => {
  return Message.aggregate([
    {
      $match: {
        isDeleteUser: false,
        isDelete: false,
        status: true,
      },
    },
    {
      $match: {
        $or: [
          {
            // sender: mongoose.Types.ObjectId(req.params.id),
            userId: mongoose.Types.ObjectId(req.user._id),
          },
          {
            // userId: mongoose.Types.ObjectId(req.params.id),
            sender: mongoose.Types.ObjectId(req.user._id),
          },
        ],
      },
    },
    {
      $addFields: {
        user_id: {
          $cond: {
            if: {
              $eq: [req.user._id, "$userId"],
            },
            then: "$sender",
            else: "$userId",
          },
        },
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "user_id",
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
              isDelete: 0,
              addOnDate: 0,
              eventType: 0,
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
      $project: {
        token: 0,
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
        message: "Get All Message Successfully",
        data: data
          .map((item) => item.user_id.toString())
          .filter((value, index, self) => self.indexOf(value) === index)
          .map((item, index) => {
            let filter = data.filter(
              (ddd) => ddd.user_id.toString() == item.toString()
            );
            if (filter.length > 0) {
              return filter[0];
            }
          }),
      });
    })
    .catch((error) => {
      console.log("error", error);
      res.status(200).json({
        status: false,
        message: "Server error. Please try again.",
        error: error,
      });
    });
};

const singelMessage = async (req, res) => {
  return Message.aggregate([
    {
      $match: {
        isDelete: false,
        isDeleteUser: false,
        status: true,
      },
    },
    {
      $match: {
        $or: [
          {
            sender: mongoose.Types.ObjectId(req.params.id),
            userId: mongoose.Types.ObjectId(req.user._id),
          },
          {
            userId: mongoose.Types.ObjectId(req.params.id),
            sender: mongoose.Types.ObjectId(req.user._id),
          },
        ],
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "userId",
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
              isDelete: 0,
              addOnDate: 0,
              eventType: 0,
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
      $project: {
        token: 0,
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
        message: "Get All Message Successfully",
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

const isSeenMessage = async (req, res) => {
  return Message.updateMany(
    {
      $or: [
        {
          sender: mongoose.Types.ObjectId(req.params.id),
          userId: mongoose.Types.ObjectId(req.user._id),
        },
        {
          userId: mongoose.Types.ObjectId(req.params.id),
          sender: mongoose.Types.ObjectId(req.user._id),
        },
      ],
    },
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
        return res.status(200).json({
          status: true,
          message: "Message update successful",
        });
      } else {
        return res.status(500).json({
          status: false,
          message: "Follow not match",
        });
      }
    }
  );
};

const deleteMessage = async (req, res) => {
  // Message.updateMany(f)
  return Message.updateMany(
    {
      _id: mongoose.Types.ObjectId(req.params.id),
    },
    {
      isDeleteUser: true,
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
          message: "Message update successful",
        });
      } else {
        return res.status(500).json({
          status: false,
          message: "Follow not match",
        });
      }
    }
  );
};
module.exports = {
  sendMessage,
  sendList,
  singelMessage,
  deleteMessage,
  isSeenMessage,
};

var mongoose = require("mongoose");
const Category = require("../../Models/category");
var Upload = require("../../service/upload");
const {
    Validator
} = require("node-input-validator");
var uuidv1 = require("uuid").v1;


function createToken(data) {
    data.hase = uuidv1();
    return jwt.sign(data, "DonateSmile");
}
const create = async (req, res) => {
    const v = new Validator(req.body, {
        name: "required",
    });
    let matched = await v.check().then((val) => val);
    if (!matched) {
        return res.status(200).send({
            status: false,
            error: v.errors
        });
    }
    let categoryData = {
        _id: mongoose.Types.ObjectId(),
        name: req.body.name,
        image: req.body.image,
        createdOn: new Date()
    };
    const category = await new Category(categoryData);
    return category
        .save()
        .then((data) => {
            return res.status(200).json({
                status: true,
                message: "New Category Created successfully",
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
const update = async (req, res) => {

    return Category.findOneAndUpdate(
      { _id: { $in: [mongoose.Types.ObjectId(req.params.id)] } },
      req.body,
      async (err, data) => {
        if (err) {
          return res.status(500).json({
            status: false,
            message: "Server error. Please try again.",
            error: err,
          });
        } else if (data != null) {
          data = { ...data._doc, ...req.body };
          return res.status(200).json({
            status: true,
            message: "Category Content update successful",
            data: data,
          });
        } else {
          return res.status(500).json({
            status: false,
            message: "Category Content not match",
            data: null,
          });
        }
      }
    );
  };
const viewAll = async (req, res) => {
    return Category.aggregate([{
                $match: {
                    isDelete: false
                }
            },
            {
                $project: {
                  token: 0,
                  __v: 0,
                }
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
                message: "Get All Category content  Successfully",
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
const Delete = async (req, res) => {
    return Category.findOneAndUpdate(
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
            message: "Category Content Delete successfully",
            data: data,
          });
        } else {
          return res.status(500).json({
            status: false,
            message: "Category not match",
            data: null,
          });
        }
      }
    );
  }

  const ImageUpload = async (req, res) => {
    let uploadDAta = await Upload.uploadFile(req, "category");
    if (uploadDAta.status) {
        res.send(uploadDAta);
    } else {
        res.send(uploadDAta);
    }
}
module.exports = {
    create,
    update,
    viewAll,
    Delete,
    ImageUpload
};
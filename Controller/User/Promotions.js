var mongoose = require("mongoose");
const Promotions = require("../../Models/promotions");
// var passwordHash = require("password-hash");
var Upload = require("../../service/upload");
const { Validator } = require("node-input-validator");
var uuidv1 = require("uuid").v1;
const { DBerror } = require("../../service/errorHaldel");


function createToken(data) {
    data.hase = uuidv1();
    return jwt.sign(data, "DonateSmile");
}



const viewSingel = async (req, res) => {
    return Promotions.aggregate([
        {
            $match: {
                eventId: mongoose.Types.ObjectId(req.body.eventId),
                code: req.body.code,

            }
        },
        // {
        //     $match: { $gt: ["$minspend", req.body.price] }
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
        .then((data) => {
            if (data && data.length > 0 && data[0].minspend <= req.body.price) {
                let discount = Number(req.body.price) * Number(data[0].discountVal) / 100;
                if (Number(data[0].maxdiscount) <= discount) {
                    discount = Number(data[0].maxdiscount);
                }
                data[0].discount = discount;

                return res.status(200).json({
                    status: true,
                    message: "Get Promotions Singel Successfully",
                    data: data[0],
                });
            } else {
                return res.status(200).json({
                    status: false,
                    message: "No Promotions Find",
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
    viewSingel,
};

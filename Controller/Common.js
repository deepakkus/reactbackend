const mongoose = require('mongoose')
const State = require('../Models/state')
const City = require('../Models/city')
const { Validator } = require('node-input-validator');
const FavoriteDrink = require('../Models/favoriteDrink');
const pinCode = require('../Models/pinCode');
const Category = require('../Models/category');
const News = require('../Models/news');
const Event = require('../Models/event');
const viewAllState = (req, res) => {
    return State.find({ country_id: 233 })
        .then((data) => {
            return res.status(200).json({
                success: true,
                message: 'get all State',
                data: data,
            });
        })
        .catch((error) => {
            return res.status(200).json({
                success: false,
                message: 'Server error. Please try again.',
                error: error,
            });
        });
}


const viewAllCity = (req, res) => {
    return City.find({ state_id: Number(req.params.id), country_id: 233 })
        .then((data) => {
            return res.status(200).json({
                success: true,
                message: 'get all City',
                data: data,
            });
        })
        .catch((error) => {
            return res.status(200).json({
                success: false,
                message: 'Server error. Please try again.',
                error: error,
            });
        });
}

const FavoriteDrinkCreate = async (req, res) => {
    const v = new Validator(req.body, {
        name: "required",
    });
    let matched = await v.check().then((val) => val);
    if (!matched) {
        return res.status(200).send({ status: false, error: v.errors });
    }
    let favoriteDrinkData = {
        _id: mongoose.Types.ObjectId(),
        name: req.body.name,
        userId: mongoose.Types.ObjectId(req.user._id),
        Added: "User",
        status: false
    };

    const favoriteDrink = await new FavoriteDrink(favoriteDrinkData);
    return favoriteDrink
        .save()
        .then((data) => {
            // data.status = false;
            return res.status(200).json({
                status: true,
                message: "New FavoriteDrink created successfully",
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

const PingCodeAdd = async (req, res) => {
    const modelData = await new pinCode({
        "zip_code": 501,
        "latitude": 40.922326,
        "longitude": -72.637078,
        "city": "Holtsville",
        "state": "NY",
        "county": "Suffolk"
    });
    return modelData
        .save()
        .then((data) => {
            console.log('Active add', data);
            return res.status(200).json({
                status: true,
                message: "Event Booking successfully",
                data: data,
            });
        })
        .catch((error) => {
            console.log('error Active', error);
            res.status(200).json({
                status: false,
                message: "errorMessage",
                error: error,
            });
        });
}

const PingCodeGet = async (req, res) => {
    pinCode.aggregate([
        {
            $match: { zip_code: Number(req.params.code) },
        },
        {
            $lookup: {
                from: "cities",
                localField: "city",
                foreignField: "name",
                as: "citiesData"
            }
        },
        {
            $unwind: "$citiesData",
        },
        {
            $addFields: {
                country_code: "$citiesData.country_code",
            },
        },
        {
            $lookup: {
                from: "states",
                localField: "state",
                foreignField: "state_code",
                let: { countryCode: "$country_code" },
                pipeline: [
                    {
                        $match:
                        {
                            $expr:
                            {
                                $and:
                                    [
                                        { $eq: ["$country_code", "$$countryCode"] }
                                    ]
                            }
                        }
                    },
                ],
                as: "statesData"
            }
        },
        {
            $unwind: "$statesData",
        },
    ]).then((data) => {
        if (data.length > 0) {
            return res.status(200).json({
                status: true,
                message: "Get pincode  Successfully",
                data: data[0],
            });
        } else {
            return res.status(200).json({
                status: false,
                message: "No pincode available",
                data: data[0],
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
const viewAllCategory = (req, res) => {
    return Category.find()
        .then((data) => {
            return res.status(200).json({
                success: true,
                message: 'get all Category',
                data: data,
            });
        })
        .catch((error) => {
            return res.status(200).json({
                success: false,
                message: 'Server error. Please try again.',
                error: error,
            });
        });
}
const viewAllEvent = (req, res) => {
    return Event.find()
        .then((data) => {
            return res.status(200).json({
                success: true,
                message: 'get all Event',
                data: data,
            });
        })
        .catch((error) => {
            return res.status(200).json({
                success: false,
                message: 'Server error. Please try again.',
                error: error,
            });
        });
}
const viewAllNews = (req, res) => {
    return News.find()
        .then((data) => {
            return res.status(200).json({
                success: true,
                message: 'get all News',
                data: data,
            });
        })
        .catch((error) => {
            return res.status(200).json({
                success: false,
                message: 'Server error. Please try again.',
                error: error,
            });
        });
}
const viewTomorrowEvent = (req, res) => {
    let today = new Date();
    today.setDate(today.getDate() + 1);
    let year = today.getFullYear()
    let month = String(today.getMonth() + 1)
    let day = String(today.getDate())
    month = month.length == 1 ? 
    month.padStart('2', '0') : month;   
    day = day.length == 1 ? 
    day.padStart('2', '0') : day;
    let tomorrownext = new Date()
    tomorrownext.setDate(tomorrownext.getDate() + 2);
    let year1 = tomorrownext.getFullYear()
    let month1 = String(tomorrownext.getMonth() + 1)
    let day1 = String(tomorrownext.getDate())
    month1 = month1.length == 1 ? 
    month1.padStart('2', '0') : month1;   
    day1 = day1.length == 1 ? 
    day1.padStart('2', '0') : day1;
    let tomorrownxt = year1 + "-" + month1 + "-" + day1 + "T12:60:60.000Z";
    let tomorrow = year + "-" + month + "-" + day + "T12:60:60.000Z";
    return Event.find({startDate:{$gte:tomorrow,$lte:tomorrownxt}})
        .then((data) => {
            return res.status(200).json({
                success: true,
                message: 'get all Tomorrow Event',
                data: data,
                p:tomorrownxt
            });
        })
        .catch((error) => {
            return res.status(200).json({
                success: false,
                message: 'Server error. Please try again.',
                error: error,
            });
        });
}
const viewCategoryEvent = (req, res) => {
    return Event.find({ catId: req.params.id})
        .then((data) => {
            return res.status(200).json({
                success: true,
                message: 'get all Category Event',
                data: data,
            });
        })
        .catch((error) => {
            return res.status(200).json({
                success: false,
                message: 'Server error. Please try again.',
                error: error,
            });
        });
}
const getSingleEvent = (req, res) => {
    return Event.find({ _id: { $in: [mongoose.Types.ObjectId(req.params.id)] } },)
        .then((data) => {
            return res.status(200).json({
                success: true,
                message: 'get Event Details',
                data: data,
            });
        })
        .catch((error) => {
            return res.status(200).json({
                success: false,
                message: 'Server error. Please try again.',
                error: error,
            });
        });
}
const viewAllCatEvents = (req, res) => {
    return Category.aggregate([
        {
          $lookup: {
            from: "events",
            localField: "name",
            foreignField: "catId",
            as: "events",
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
            message: "Get All Events  Successfully",
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
    viewAllCity,
    viewAllState,
    FavoriteDrinkCreate,
    PingCodeAdd,
    PingCodeGet,
    viewAllCategory,
    viewAllEvent,
	viewAllNews,
    viewTomorrowEvent,
    viewCategoryEvent,
    getSingleEvent,
    viewAllCatEvents
}
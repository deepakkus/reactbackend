var mongoose = require("mongoose");
const { Validator } = require("node-input-validator");
const { DBerror } = require("../../service/errorHaldel");
var User = require('../../Models/user');
const { sendEmail } = require("../../service/email");
const PaymentMethod = require("../../Models/paymentMethod");
const { CreateStripeCustomer, CreateStripePaymentMethod, PayStripeSingel } = require("../../service/Stripe");

const PayNowSplitDue = async (req, res) => {
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

module.exports = {
    PayNowSplitDue
}
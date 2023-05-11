const Mongoose = require('mongoose');
const PaymentHistory = require('../Models/PaymentHistory');
const paymentRefund = require('../Models/paymentRefund');
const user = require('../Models/user');
const { DBerror } = require('./errorHaldel');

require('dotenv').config();

const stripe = require('stripe')(process.env.SecretKey);
const DefoltCardTest = {
    number: '4242424242424242',
    exp_month: 10,
    exp_year: 2023,
    cvc: '314',
}

const CreateStripeCustomer = async (data) => {
    const DataSet = {
        email: data.email,
        description: `${data?.firstname} ${data?.lastname}`,
    };
    const customers = await stripe.customers.create(DataSet);
    await user.findOneAndUpdate({ _id: { $in: [Mongoose.Types.ObjectId(data._id)] } }, { stripeCUS: customers?.id });
    return customers;
}

const CreateStripePaymentMethod = async (stripeCUS, GetCard = DefoltCardTest) => {
    try {
        const token = await stripe.tokens.create({
            card: GetCard,
        });
        const card = await stripe.customers.createSource(
            stripeCUS,
            { source: token?.id }
        );
        return { status: true, tokenId: token.id, cardId: card.id, type: `stripe ${card?.brand}` };

    } catch (error) {
        console.log('error', error);
        return { status: false, error }
    }

}


const PayStripeSingel = async (amount, source, BookingId, email, stripeCUS) => {
    try {
        console.log('customer', stripeCUS);
        const charge = await stripe.charges.create({
            amount: Number(amount * 100),
            currency: 'usd',
            source: source,
            description: BookingId,
            receipt_email: email,
            customer: stripeCUS
        });
        await PaymentHistory.insertMany([{
            BookingId,
            email: charge?.receipt_email,
            paymentId: charge?.id,
            balanceTransaction: charge?.balance_transaction,
            amount: charge?.amount,
            customerId: charge?.customer,
            paymentMethod: charge?.payment_method,
            paymentStatus: charge?.status,
            createOn: new Date()
        }])
        return { status: true, data: charge, stripeCUS };
    } catch (error) {
        console.log('error', error);
        return { status: false, error, stripeCUS, msg: DBerror(error) }
    }

}

const RefundsSingel = async (paymentId) => {
    try {
        return await stripe.refunds.create({
            charge: paymentId,
        });
    } catch (error) {
        console.log('error', error);
        return { status: "server error", error: JSON.stringify(error), msg: DBerror(error) }
    }
}


const StripeRefundsAll = async (data) => {
    let refundsArray = [];
    for (let index = 0; index < data.length; index++) {
        const element = data[index];
        let singelData = await RefundsSingel(element.paymentId);
        refundsArray.push(singelData);
    }
    await PaymentHistory.insertMany(refundsArray);
}

module.exports = {
    CreateStripeCustomer,
    CreateStripePaymentMethod,
    PayStripeSingel,
    RefundsSingel,
    StripeRefundsAll
};
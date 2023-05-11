"use strict";
const nodemailer = require("nodemailer");


const sendEmail = async (html, email = "lonstancelisette@gmail.com", text = `welcome to tabyat. send invitation`) => {

    const transporter = nodemailer.createTransport({
        host: "mail.evolvethought.com",
        port: 587,
        secure: false,
        auth: {
            user: "info@evolvethought.com",
            pass: "Thought@2021",
        },
        tls: {
            rejectUnauthorized: false,
        },
    });

    // send mail with defined transport object
    let info = await transporter.sendMail({
        from: '"tabyat" <info@evolvethought.com>', // sender address
        to: email,
        subject: "Tabyat ✔", // Subject line
        text, // plain text body
        html, // html body
    });

    console.log("Message sent: %s", info.messageId);
    // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>

    // Preview only available when sending through an Ethereal account
    console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
    // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...

    return { ...info, previewURL: nodemailer.getTestMessageUrl(info) };
}



module.exports = {
    sendEmail
};
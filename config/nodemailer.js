require('dotenv').config()
var mail = require('nodemailer');

exports.confirmationMail = function (userMail, title, content) {
    return new Promise((resolve, reject) => {
        const transporter = mail.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL,
                pass: process.env.PASS_MAIL
            }
        });

        const mailOptions = {
            from: process.env.EMAIL,
            to: userMail,
            subject: title,
            html: content
        }

        transporter.sendMail(mailOptions, function (err, info) {
            if (err) reject(err);
            else {
                console.log("Email sent: " + info.response)
                resolve(true)
            };
        })
    })
}

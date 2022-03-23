require('dotenv').config()
var mail = require('nodemailer');

exports.confirmationMail = async function (userMail, title, content) {
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
        if (err) throw err;
        else console.log("Email sent: " + info.response);
    })
}

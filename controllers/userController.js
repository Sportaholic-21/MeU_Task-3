require('dotenv').config({ path: '.env' })
var initModels = require("../models/init-models");
const sequelize = require('../config/sequelize')
var models = initModels(sequelize);
const UserService = require('../services/userService')
const userService = new UserService(models.UserTbl)
const genTokens = require('../helpers/genTokens')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const mail = require('../config/nodemailer');
const { apiResponse, apiResponseSuccess, apiResponseFail } = require('../helpers/apiResponseOutput');

module.exports.getAllUser = async (req, res) => {
    let message, responseData, violations
    try {
        const page = req.query.page || 1
        const size = req.query.size || 10
        const filter = req.queryFinder || {}
        const users = await userService.getAllUsers(filter, page, size)
        const count = users.length
        const totalPages = Math.ceil(users.length / size)
        message = "Sucessfully retrieved data"
        responseData = {
            count: count,
            rows: users,
            totalPages: totalPages,
            currentPage: (filter.length > 0 && count == 0) ? 0 : totalPages
        }
        return apiResponseSuccess(res, message, responseData)
    } catch (error) {
        message = "Internal Server Error"
        violations = error.toString()
        return apiResponseFail(res, message, violations)
    }
}

module.exports.login = (req, res) => {
    userService.findUserByName(req.body.name)
        .then(user => {
            if (!user) {
                return apiResponseFail(res, "Unauthorized", 'User does not exists')
            } else {
                bcrypt.compare(req.body.password, user.password, (err, isMatch) => {
                    if (err) throw err;
                    if (isMatch) {
                        const accessToken = genTokens.generateAccessToken(user.username)
                        const refreshToken = genTokens.generateRefreshToken(user.username)
                        const responseData = { accessToken: accessToken }
                        req.session.refreshToken = refreshToken
                        return apiResponseSuccess(res, "Successfully logged user in", responseData)
                    }
                    return apiResponseFail(res, "Forbidden", 'The password is not correct')
                })
            }
        })
        .catch(err => {
            console.log(err)
            return apiResponse(res, "Internal Server Error", err.toString())
        })
}

module.exports.genNewAccessToken = (req, res) => {
    const refreshToken = req.body.token
    if (refreshToken == null) return apiResponseFail(res, "Unauthorized", 'No refresh token was provided')
    if (!req.session.refreshTokens.includes(refreshToken)) return apiResponseFail(res, "Forbidden", 'Refresh token does not match')
    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
        if (err) return apiResponseFail(res, "Forbidden", "Fail to verify token")
        const accessToken = generateAccessToken({ name: user.name })
        const responseData = { accessToken: accessToken }
        return apiResponseSuccess(res, "Successfully refreshed new access token", responseData)
    })
}

module.exports.register = async (req, res) => {
    try {
        // randomizer
        var result = '';
        var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        var charactersLength = characters.length;
        for (var i = 0; i < 7; i++) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
        const link = `http://localhost:${process.env.PORT}/api/users/verify/${result}`

        const newUser = {
            username: req.body.username,
            email: req.body.email,
            password: req.body.password,
            roleId: req.body.roleId
        }

        var html = "<p>Access this link to complete sign up:</p>";
        html += '<a href="' + link + '">' + link + '</a>'
        await mail.confirmationMail(req.body.email, "Verify your account", html)
        req.session.verify = result
        console.log(req.session.verify)
        req.session.newUser = newUser
        return apiResponseSuccess(res, "An email has been sent", "")
    } catch (error) {
        console.log(error)
        return apiResponseFail(res, "Internal Server Error", error.toString())
    }
}

module.exports.verifiedEmail = async (req, res) => {
    if (req.params.verifyCode != req.session.verify) {
        return apiResponse(res, "Unauthorized", "Something happened and your data could not be verified")
    }
    if (await userService.addUser(req.session.newUser)) {
        delete req.session.verify
        delete req.session.newUser
        req.session.save()
        return apiResponseSuccess(res, "Successfully created new User", "")
    }
    return apiResponse(res, "Internal Server Error", "Something happened and your data could not be verified")
}

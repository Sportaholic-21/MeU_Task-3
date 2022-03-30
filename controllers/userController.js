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
const { apiResponse } = require('../helpers/apiResponseOutput');

module.exports.getAllUser = async (req, res) => {
    let message, responseData, status, violations = ""
    let statusCode
    try {
        const page = req.query.page || 1
        const size = req.query.size || 10
        const filter = req.queryFinder || {}
        const users = await userService.getAllUsers(filter, page, size)
        const count = await userService.getUsersCount()
        message = "Sucessfully retrieved data"
        responseData = {
            count: users.length,
            rows: users,
            totalPages: Math.ceil(count / size),
            currentPage: page
        }
        status = "success"
        violations = ""
        statusCode = 200
    } catch (error) {
        message = error.toString()
        violations = "Internal Server Error"
        status = "fail"
        responseData = ""
    }
    return apiResponse(res, message, responseData, status, violations)
}

module.exports.login = (req, res) => {
    userService.findUserByName(req.body.name)
        .then(user => {
            if (!user) {
                return apiResponse(res, 'User does not exists', "", "fail", "Unauthorized")
            } else {
                bcrypt.compare(req.body.password, user.password, (err, isMatch) => {
                    if (err) throw err;
                    if (isMatch) {
                        const accessToken = genTokens.generateAccessToken(user.username)
                        const refreshToken = genTokens.generateRefreshToken(user.username)
                        const responseData = { accessToken: accessToken }
                        req.session.refreshToken = refreshToken
                        return apiResponse(res, "Successfully logged user in", responseData, "success", "")
                    }
                    return apiResponse(res, 'The password is not correct', "", "fail", "Forbidden")
                })
            }
        })
        .catch(err => {
            console.log(err)
            return apiResponse(res, err.toString(), "", "fail", "Internal Server Error")
        })
}

module.exports.genNewAccessToken = (req, res) => {
    const refreshToken = req.body.token
    if (refreshToken == null) return apiResponse(res, 'No refresh token was provided', "", "fail", "Unauthorized")
    if (!req.session.refreshTokens.includes(refreshToken)) return apiResponse(res, 'Refresh token does not match', "", "fail", "Forbidden")
    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
        if (err) return apiResponse(res, "Fail to verify token", "", "fail", "Forbidden")
        const accessToken = generateAccessToken({ name: user.name })
        const responseData = { accessToken: accessToken }
        return apiResponse(res, "Successfully refreshed new access token", responseData, "success", "")
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
        return apiResponse(res, "An email has been sent", "", "success", "")
    } catch (error) {
        console.log(error)
        return apiResponse(res, "Error in validating", error.toString(), "fail", 500, "Internal Server Error")
    }
}

module.exports.verifiedEmail = async (req, res) => {
    if (req.params.verifyCode != req.session.verify) {
        return apiResponse(res, "Something happened and your data could not be verified", "", "fail", "Unauthorized")
    }
    if (await userService.addUser(req.session.newUser)) {
        delete req.session.verify
        delete req.session.newUser
        req.session.save()
        return apiResponse(res, "Successfully created new User", "", "success", "")
    }
    return apiResponse(res, "Something happened and your data could not be verified", "", "fail", "Internal Server Error")
}

require('dotenv').config({ path: '.env' })
var initModels = require("../models/init-models");
const sequelize = require('../config/sequelize')
var models = initModels(sequelize);
const UserService = require('../services/userService')
const userService = new UserService(models.UserTbl)
const genTokens = require('../helpers/genTokens')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const mail = require('../config/nodemailer')


module.exports.getAllUser = async (req, res) => {
    try {
        const page = req.query.page || 1
        const size = req.query.size || 10
        return res.json(await userService.getAllUsers(page, size))    
    } catch (error) {
        console.log(error)
        return res.status(500).json("Error when retrieving data")
    }
     
}

module.exports.login = (req, res) => {
    userService.findUserByName(req.body.name)
        .then(user => {
            if (!user) {
                return res.status(401).json('User does not exist')
            } else {
                bcrypt.compare(req.body.password, user.password, (err, isMatch) => {
                    if (err) throw err;
                    if (isMatch) {
                        const accessToken = genTokens.generateAccessToken(user.username)
                        const refreshToken = genTokens.generateRefreshToken(user.username)
                        req.session.refreshToken = refreshToken
                        req.session.accessToken = accessToken
                        return res.status(200).json({
                            accessToken: accessToken
                        });
                    }
                    return res.status(403).json('The password is not correct')
                })
            }
        })
        .catch(err => {
            console.log(err)
            return res.status(500).json('Error during validating')
        })
}

module.exports.genNewAccessToken = (req, res) => {
    const refreshToken = req.body.token
    if (refreshToken == null) return res.sendStatus(401).json('No refresh token was provided')
    if (!req.session.refreshTokens.includes(refreshToken)) return res.sendStatus(403)
    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
        if (err) return res.sendStatus(403).json('Failed to verify refresh token')
        const accessToken = generateAccessToken({ name: user.name })
        return res.json({ accessToken: accessToken })
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
        return res.json("An email has been sent")
    } catch (error) {
        console.log(error)
        return res.status(500).json(error)
    }
}

module.exports.verifiedEmail = async (req, res) => {
    if (req.params.verifyCode != req.session.verify) {
        return res.status(500).json("Something happened and your data could not be verified")
    }
    if (await userService.addUser(req.session.newUser)) {
        delete req.session.verify
        delete req.session.newUser
        req.session.save()
        return res.status(200).json("Successfully created new User")
    }
    return res.status(500).json("Something happened and your data could not be verified")
}
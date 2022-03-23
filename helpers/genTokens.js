require('dotenv').config()
const jwt = require('jsonwebtoken')

module.exports.generateAccessToken = (user) => {
    return jwt.sign({ user: user }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: process.env.ACCESS_TOKEN_LIFE })
}

module.exports.generateRefreshToken = (user) => {
    return jwt.sign({ user: user }, process.env.REFRESH_TOKEN_SECRET)
}
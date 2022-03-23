require('dotenv').config()
const bcrypt = require("bcrypt")
const jwt = require('jsonwebtoken')


module.exports.userAuthToken = (req, res, next) => {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]
    if (token == null) return res.send(401).json('Unauthorized')
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
        if (err) {
            console.log(err)
            return res.status(403).json("Access denied")
        }
        req.user = user
        next()
    })
}


module.exports.hashPassword = async (req, res, next) => {
    const saltRounds = 10
    req.body.password = await bcrypt.hash(req.body.password, saltRounds)
    next()
}
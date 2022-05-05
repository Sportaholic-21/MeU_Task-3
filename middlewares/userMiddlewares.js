require('dotenv').config()
const bcrypt = require("bcrypt")
const jwt = require('jsonwebtoken')
const { apiResponseFail } = require('../helpers/apiResponseOutput');
const { queryBuilder, paramsProcess, queryTableSeparation, modelArrs, buildIncludes } = require('../helpers/queryBuilder')

var initModels = require("../models/init-models");
const sequelize = require('../config/sequelize');
const ModelDiagramTree = require('../services/treeService');
var models = initModels(sequelize);


module.exports.userAuthToken = (req, res, next) => {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]
    if (token == null) return res.status(401).json(apiResponseFail("We can not verify your login", "No token provided"))
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
        if (err) {
            console.log(err)
            return res.status(403).json(apiResponseFail("We can not verify your login", "Bad token"))
        }
        req.user = user
        next()
    })
}


module.exports.hashPassword = async (req, res, next) => {
    try {
        const saltRounds = 10
        req.body.password = await bcrypt.hash(req.body.password, saltRounds)
        next()
    } catch (error) {
        throw error
    }
}

module.exports.handleFilterOptions = async (req, res, next) => {
    try {
        let rawOptions = req.params.filter
        if (rawOptions == "undefined") {
            let pagination = req.query
            let keys = Object.keys(pagination)
            let query = ""
            for (var i in keys) {
                query += keys[i] + "=" + pagination[keys[i]]
                query += "&"
            }
            return res.redirect('../users?' + query)
        }
        const userModels = new ModelDiagramTree(models.UserTbl)
        let builder = queryTableSeparation(userModels.belongsToDiagram(), paramsProcess(rawOptions))
        let includes = builder.include, options = builder.options

        req.userOptions = options
        req.includes = includes
        next()
    } catch (error) {
        return res.status(500).json(apiResponseFail("Unable to proccess filter options", error.toString()))
    }
}

module.exports.queryBuilder = async (req, res, next) => {
    try {
        req.userQuery = queryBuilder(req.userOptions)
        next()
    } catch (error) {
        return res.status(500).json(apiResponseFail("Failed to create query", error.toString()))
    }
}
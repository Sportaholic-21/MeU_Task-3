require('dotenv').config()
const bcrypt = require("bcrypt")
const jwt = require('jsonwebtoken')
const Op = require('sequelize').Op
const { apiResponse } = require('../helpers/apiResponseOutput')


module.exports.userAuthToken = (req, res, next) => {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]
    if (token == null) return apiResponse(res, "Unauthorized", "", "fail", "Unauthorized")
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
        if (err) {
            console.log(err)
            return apiResponse(res, "Access denied", "", "fail", "Forbidden")
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
        if (rawOptions == "undefined") return res.redirect('../users')
        let processedOptions = []
        rawOptions = rawOptions.split(",") // Spliting "," into separate funcs
        rawOptions.forEach(option => { // each option and
            // Identify operator
            let operator, splitChar
            let operatorChars = "@_!><="
            let operatorIndex = option.indexOf("=")
            if (operatorIndex == -1) {
                operatorIndex = option.indexOf(">")
                splitChar = ">"
                operator = Op.gt
                if (operatorIndex == -1) {
                    operatorIndex = option.indexOf("<")
                    if (operatorIndex == -1) throw new Error("No arguments was found")
                    splitChar = "<"
                    operator = Op.lt
                }
            } else {
                let temp = option.charAt(operatorIndex - 1)
                if (operatorChars.includes(temp)) {
                    if (temp == "!") operator = Op.ne
                    if (temp == ">") operator = Op.gte
                    if (temp == "<") operator = Op.lte
                    if (temp == "@") operator = Op.substring
                    if (temp == "_") operator = Op.startsWith
                    splitChar = temp + "="
                } else if (option.charAt(operatorIndex + 1) == "=") {
                    operator = Op.eq
                    splitChar = "=="
                } else throw new Error("The argument is missing an operator")
            }
            // Separate column, operator & parameter
            let splitOptions = option.split(splitChar)
            let argumentColumns = splitOptions[0], parameters = splitOptions[1]
            argumentColumns = argumentColumns.replace('(', '').replace(')', '')
            // split columns if more than 1
            let columns = []
            if (argumentColumns.includes("|")) {
                columns = argumentColumns.split("|")
            } else {
                columns.push(argumentColumns)
            }
            // push proccessed option to next middleware
            processedOptions.push({
                columns: columns,
                operator: operator,
                parameters: parameters
            })
        })
        req.filterOptions = processedOptions
        next()
    } catch (error) {
        return apiResponse(res, error.toString(),"", "fail", "Internal Server Error")
    }
}

module.exports.queryBuilder = async (req, res, next) => {
    try {
        const filters = req.filterOptions
        let query = {}
        optionOr = [],
            optionAnd = []
        const condition = (column, operator, parameter) => {
            return {
                [column]: {
                    [operator]: parameter
                }
            }
        }
        for (var optionIndex in filters) {
            let index = filters[optionIndex]
            let optionQuery = {}
            if (index.columns.length > 1) {
                for (var col in index.columns) {
                    optionOr.push(condition(index.columns[col], index.operator, index.parameters))
                }
                optionQuery = {
                    [Op.or]: optionOr
                }
            } else optionQuery = condition(index.columns[0], index.operator, index.parameters)

            optionAnd.push(optionQuery)
        }
        query = {
            [Op.and]: optionAnd
        }
        req.queryFinder = query
        next()
    } catch (error) {
        return apiResponse(res, "Failed to create query", error.toString(), "fail", "Internal Server Error")
    }
}
require('dotenv').config()
const bcrypt = require("bcrypt")
const jwt = require('jsonwebtoken')
const Op = require('sequelize').Op
const { dateInput } = require('../helpers/dateInput')
const { apiResponseFail } = require('../helpers/apiResponseOutput');
const { queryBuilder } = require('../helpers/queryBuilder')


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
        let userOptions = []
        let userRoleOptions = []
        let userRoleTypeOptions = []
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
                if (argumentColumns.includes("created_at")) {
                    parameters = dateInput(parameters)
                    let endDate = new Date("12/31/3000"), startDate = new Date("1/1/1970")
                    switch (operator) {
                        case Op.eq:
                            startDate = parameters
                            endDate = new Date(parameters.getTime() + 60 * 60 * 24 * 1000 - 1)
                            break;
                        case Op.lte:
                            endDate = new Date(parameters.getTime() + 60 * 60 * 24 * 1000 - 1)
                            break;
                        case Op.lt:
                            endDate = new Date(parameters.getTime() - 1)
                            break;
                        case Op.gt:
                            startDate = new Date(parameters.getTime() + 60 * 60 * 24 * 1000)
                            break;
                        case Op.gte:
                            startDate = parameters
                            break;
                        case Op.ne:
                            endDate = parameters
                            startDate = new Date(parameters.getTime() + 60 * 60 * 24 * 1000 - 1)
                            break;
                        default:
                            return res.status(500).json(apiResponseFail("Operator for createdAt must be >, <, =, >=, <=, !=", "Invalid operator"))
                    }
                    columns[0] = "createdAt"
                    userOptions.push({
                        columns: columns,
                        operator: Op.gte,
                        parameters: startDate
                    }, {
                        columns: columns,
                        operator: Op.lte,
                        parameters: endDate
                    })
                }
            }
            if (columns.indexOf('createdAt') == -1) {
                // push proccessed option to next middleware
                userOptions.push({
                    columns: columns,
                    operator: operator,
                    parameters: parameters
                })
            }
        })
        for (var i in userOptions) {
            let userRoleCol = []
            let userRoleTypeCol = []
            if (isNaN(parseInt(userOptions[i].parameters))) {
                userOptions[i].columns = userOptions[i].columns.filter(function (val, i, arr) {
                    return !(val.toLowerCase().includes("id"))
                })
            }
            userOptions[i].columns.forEach(function (col) {
                let temp = col
                if (col.includes("_tbl")) temp = temp.replace("_tbl","")
                if (col.includes("user_role_type")) {
                    temp = temp.replace("user_role_type.", "")
                    userRoleTypeCol.push(temp)
                } else if (col.includes("user_role")) {
                    temp = temp.replace("user_role.", "")
                    userRoleCol.push(temp)
                }
            })
            userOptions[i].columns = userOptions[i].columns.filter(function (val, i, arr) {
                return !(val.includes("user_role"))
            })
            if (userRoleCol.length > 0) {
                userRoleOptions.push({
                    columns: userRoleCol,
                    operator: userOptions[i].operator,
                    parameters: userOptions[i].parameters
                })
            }
            if (userRoleTypeCol.length > 0) {
                userRoleTypeOptions.push({
                    columns: userRoleTypeCol,
                    operator: userOptions[i].operator,
                    parameters: userOptions[i].parameters
                })
            }
            if (userOptions[i].columns.length <= 0) userOptions[i] = {}
        }
        req.userRoleOptions = userRoleOptions
        req.userRoleTypeOptions = userRoleTypeOptions
        req.userOptions = userOptions
        next()
    } catch (error) {
        return res.status(500).json(apiResponseFail("Unable to proccess filter options", error.toString()))
    }
}

module.exports.queryBuilder = async (req, res, next) => {
    try {
        req.userQuery = queryBuilder(req.userOptions)
        req.userRoleQuery = queryBuilder(req.userRoleOptions)
        req.userRoleTypeQuery = queryBuilder(req.userRoleTypeOptions)
        next()
    } catch (error) {
        return res.status(500).json(apiResponseFail("Failed to create query", error.toString()))
    }
}
const Op = require('sequelize').Op
const { dateInput, isDate } = require('./dateInput')
const { underscoreToCamelCase, camelCaseToUnderscore } = require('./syntaxHandler')
var initModels = require("../models/init-models");
const sequelize = require('../config/sequelize')
var models = initModels(sequelize);

module.exports.paramsProcess = (params) => {
    let rawOptions = params, options = []
    rawOptions = rawOptions.split(",") // Spliting "," into separate funcs
    rawOptions.forEach(option => { // each option and
        // Identify operator
        let operator, splitChar
        let operatorChars = "@_!><="
        let operatorIndex = option.indexOf("=")
        if (operatorIndex == -1) {
            // Case greater than / less than
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
            // Cases that involve "="
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
        options.push({
            columns: columns,
            operator: operator,
            parameters: parameters
        })
    })
    return options
}

const dateColumnHandler = (column, parameters, operator) => {
    let columns = [column], obj
    parameters = dateInput(parameters)
    let endDate = new Date("12/31/3000"), startDate = new Date("1/1/1970")
    switch (operator) {
        default:
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
    }
    let oper = Op.between
    if (endDate < startDate) oper = Op.notBetween
    obj = {
        columns: columns,
        operator: oper,
        parameters: [startDate, endDate]
    }
    return obj
}

const eagerQuerySyntax = (column) => {
    if (column.includes("user_role_type")) return "userRole.role."
    if (column.includes("user_role")) return "userRole."
    return ""
}


module.exports.queryTableSeparation = (options) => {
    let userOptions = options

    for (var i in userOptions) {
        let dateFlag = isDate(userOptions[i].parameters)
        for (var col in userOptions[i].columns) {
            if (userOptions[i].columns[col].includes("_tbl")) {
                userOptions[i].columns[col] = userOptions[i].columns[col].replace(/_tbl/g, "")
            }

            let syntax = "", split, column
            syntax = eagerQuerySyntax(userOptions[i].columns[col])
            split = userOptions[i].columns[col].split(".")
            column = underscoreToCamelCase(split[split.length - 1])

            if (syntax.length > 0) userOptions[i].columns[col] = "$".concat(syntax, camelCaseToUnderscore(column), "$")
            else if (userOptions[i].columns[col].includes("userRole")) {
                let temp = "$"
                for (var j = 0; j < split.length - 1; j++) temp = temp.concat(split[j], ".")
                userOptions[i].columns[col] = temp.concat(camelCaseToUnderscore(column), "$")
            } else userOptions[i].columns[col] = column

            if (dateFlag) {
                let temp = userOptions[i].columns[col]
                let model
                if (temp.includes("userRole.role")) model = models.UserRoleTypeTbl
                else if (temp.includes("userRole")) model = models.UserRoleTbl
                else model = models.UserTbl
                if (model.tableAttributes[column].type.constructor.key == "DATE") {
                    const dateColumnObj = dateColumnHandler(
                        userOptions[i].columns[col],
                        userOptions[i].parameters,
                        userOptions[i].operator
                    )
                    userOptions[i].columns[col] = dateColumnObj
                    continue
                }
            }

        }

        if (userOptions[i].columns.length <= 0) userOptions[i] = {}
    }

    return userOptions
}


module.exports.queryBuilder = (filterOption) => {
    if (filterOption.length == 0 || (filterOption.length == 1 && Object.keys(filterOption[0]).length == 0)) {
        return {}
    }
    filterOption = filterOption.filter((val, i, arr) => {
        return Object.keys(val).length > 0
    })
    console.log(filterOption)
    let query = {},
        optionOr = [],
        optionAnd = []
    const condition = (column, operator, parameter) => {
        return {
            [column]: {
                [operator]: parameter
            }
        }
    }
    const querydateColumn = (column) => {
        if (
            typeof column == "object" &&
            !Array.isArray(column) &&
            column != null
        ) {
            // For if created at Not equal
            let dateColumnObj = {}
            dateColumnObj = condition(column.columns[0], column.operator, column.parameters)
            return dateColumnObj
        }
        return undefined
    }
    let optionIndex = 0
    for (optionIndex; optionIndex < filterOption.length; optionIndex++) {
        let index = filterOption[optionIndex]
        let optionQuery = {}

        if (index.columns.length > 1) {
            for (var col in index.columns) {
                let column = index.columns[col]
                let dateColumnObj = querydateColumn(column)
                if (dateColumnObj != undefined) {
                    optionOr.push(dateColumnObj)
                } else optionOr.push(condition(index.columns[col], index.operator, index.parameters))
            }
            optionQuery = {
                [Op.or]: optionOr
            }
        } else {
            let column = index.columns[0], dateColumnObj = querydateColumn(column)
            if (dateColumnObj != undefined) {
                optionQuery = dateColumnObj
            } else optionQuery = condition(index.columns[0], index.operator, index.parameters)
        }
        optionAnd.push(optionQuery)
    }
    query = {
        [Op.and]: optionAnd
    }
    return query
}
const Op = require('sequelize').Op
const { dateInput } = require('./dateInput')

module.exports.paramsProcess = (params) => {
    let rawOptions = params, options = []
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
        options.push({
            columns: columns,
            operator: operator,
            parameters: parameters
        })
    })
    return options
}

const createdAtHandler = (column, parameters, operator) => {
    let arr = [], columns = [column.replace('created_at', 'createdAt')]
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
    arr.push({
        columns: columns,
        operator: Op.gte,
        parameters: startDate
    }, {
        columns: ['createdAt'],
        operator: Op.lte,
        parameters: endDate
    })
    return arr
}


module.exports.queryTableSeparation = (options) => {
    let userOptions = options

    for (var i in userOptions) {
        for (var col in userOptions[i].columns) {
            if (userOptions[i].columns[col].includes("_tbl")) userOptions[i].columns[col] = userOptions[i].columns[col].replace(/_tbl/g, "")

            if (userOptions[i].columns[col].includes("created_at") || userOptions[i].columns[col].includes("createdAt")) {
                const createdAtArr = createdAtHandler(userOptions[i].columns[col], userOptions[i].parameters, userOptions[i].operator)
                if (createdAtArr.length > 0) {
                    let temp = createdAtArr[0].columns[0]
                    if (temp.includes("user_role.user_role_type.")) {
                        createdAtArr[0].columns[0] = "$".concat(
                            createdAtArr[0].columns[0].replace("user_role.user_role_type.", "userRole.role."),
                            "$"
                        )
                        createdAtArr[1].columns[0] = createdAtArr[0].columns[0]
                        userOptions[i].columns[col] = createdAtArr
                        continue;
                    } else if (temp.includes("user_role_type")) {
                        createdAtArr[0].columns[0] = "$".concat(
                            createdAtArr[0].columns[0].replace("user_role_type.", "userRole.role."),
                            "$"
                        )
                        createdAtArr[1].columns[0] = createdAtArr[0].columns[0]
                        userOptions[i].columns[col] = createdAtArr
                        continue;
                    } else if (temp.includes("user_role")) {
                        createdAtArr[0].columns[0] = "$".concat(
                            createdAtArr[0].columns[0].replace("user_role", "userRole."),
                            "$"
                        )
                        createdAtArr[1].columns[0] = createdAtArr[0].columns[0]
                        userOptions[i].columns[col] = createdAtArr
                        continue;
                    }
                    userOptions[i].columns[col] = createdAtArr
                }
                else userOptions[i].columns[col].replace("created_at", "createdAt")
            }

            if (userOptions[i].columns[col].includes("user_role.user_role_type.")) {
                userOptions[i].columns[col] = "$userRole.role".concat(
                    userOptions[i].columns[col].replace("user_role.user_role_type", ""),
                    "$"
                )
            } else if (userOptions[i].columns[col].includes("user_role_type.")) {
                userOptions[i].columns[col] = "$userRole.role".concat(
                    userOptions[i].columns[col].replace("user_role_type", ""),
                    "$"
                )
            } else if (userOptions[i].columns[col].includes("user_role.")) {
                userOptions[i].columns[col] = "$userRole".concat(
                    userOptions[i].columns[col].replace("user_role", ""),
                    "$"
                )
            }
        }

        userOptions[i].columns = userOptions[i].columns.filter(function (val, i, arr) {
            return (val.includes("$") || !(val.includes("user_role")))
        })

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
    let optionIndex = 0
    for (optionIndex; optionIndex < filterOption.length; optionIndex++) {
        let index = filterOption[optionIndex]
        let optionQuery = {}
        if (index.columns.length > 1) {
            for (var col in index.columns) {
                let column = index.columns[col]
                if (Array.isArray(column)) {
                    // For if created at Not equal
                    let createdAtObj = {}
                    if (column[0].parameters > column[1].parameters) {
                        createdAtObj = {
                            [Op.not]: {
                                [Op.and]: [
                                    condition("createdAt", column[0].operator, column[1].parameters),
                                    condition("createdAt", column[1].operator, column[0].parameters)
                                ]
                            }
                        }
                    } else {
                        createdAtObj = {
                            [Op.and]: [
                                condition("createdAt", column[0].operator, column[0].parameters),
                                condition("createdAt", column[1].operator, column[1].parameters)
                            ]
                        }
                    }
                    optionOr.push(createdAtObj)
                } else optionOr.push(condition(index.columns[col], index.operator, index.parameters))
            }
            optionQuery = {
                [Op.or]: optionOr
            }
        } else {
            let column = index.columns[0]
            if (Array.isArray(column)) {
                // For if created at Not equal
                let createdAtObj = {}
                if (column[0].parameters > column[1].parameters) {
                    createdAtObj = {
                        [Op.not]: {
                            [Op.and]: [
                                condition("createdAt", column[0].operator, column[1].parameters),
                                condition("createdAt", column[1].operator, column[0].parameters)
                            ]
                        }
                    }
                } else {
                    createdAtObj = {
                        [Op.and]: [
                            condition("createdAt", column[0].operator, column[0].parameters),
                            condition("createdAt", column[1].operator, column[1].parameters)
                        ]
                    }
                }
                optionQuery = createdAtObj
            } else {
                optionQuery = condition(index.columns[0], index.operator, index.parameters)
            }

        }
        optionAnd.push(optionQuery)
    }
    query = {
        [Op.and]: optionAnd
    }
    return query
}
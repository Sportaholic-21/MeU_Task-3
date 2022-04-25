const Op = require('sequelize').Op
const { dateInput, isDate } = require('./dateInput')
const { underscoreToCamelCase, camelCaseToUnderscore, countString } = require('./syntaxHandler')

module.exports.modelArrs = (baseModel, arr = []) => {
    if (arr.length == 0) { 
        arr.push({ 
            model: baseModel 
        }) 
    }
    
    for (i in baseModel.associations) {
        let association = baseModel.associations[i]
        if (association.associationType == "BelongsTo") {
            arr.push({
                model: association.target,
                as: association.as
            })
            return this.modelArrs(association.target, arr)
        }
    }
    return arr
}

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


module.exports.buildIncludes = (models) => {
    const includeSyntax = (model, as) => {
        return {
            model: model,
            as: as
        }
    }
    
    let include = {}
    for (var i = 1; i < models.length; i++) {
        if (Object.keys(include).length == 0) {
            include = includeSyntax(models[i].model, models[i].as)
        } else include['include'] = includeSyntax(models[i].model, models[i].as)
    }
    return include
}

module.exports.queryTableSeparation = (models, options) => {

    for (var i in options) {
        let dateFlag = isDate(options[i].parameters)
        for (var col in options[i].columns) {
            if (options[i].columns[col].includes("_tbl")) {
                options[i].columns[col] = options[i].columns[col].replace(/_tbl/g, "")
            }

            let split, column
            // syntax = eagerQuerySyntax(options[i].columns[col])
            split = options[i].columns[col].split(".")
            column = underscoreToCamelCase(split[split.length - 1])

            if (split.length == 1) options[i].columns[col] = column
            else {
                let temp = "$"
                for (var j = 0; j < split.length - 1; j++) temp = temp.concat(models[j + 1].as, ".")
                options[i].columns[col] = temp.concat(camelCaseToUnderscore(column), "$")
            }

            if (dateFlag) {
                let temp = options[i].columns[col]
                let model = models[countString(temp, ".")].model
                if (model.tableAttributes[column].type.constructor.key == "DATE") {
                    const dateColumnObj = dateColumnHandler(
                        options[i].columns[col],
                        options[i].parameters,
                        options[i].operator
                    )
                    options[i].columns[col] = dateColumnObj
                    continue
                }
            }

        }

        if (options[i].columns.length <= 0) options[i] = {}
    }

    return options
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
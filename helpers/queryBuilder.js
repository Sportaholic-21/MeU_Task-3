const Op = require('sequelize').Op
const { dateInput, isDate } = require('./dateInput')
const { underscoreToCamelCase, camelCaseToUnderscore, firstLetterUppercase } = require('./syntaxHandler')

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
        let columns = splitOptions[0], parameters = splitOptions[1]
        columns = columns.replace('(', '').replace(')', '')

        options.push({
            columns: columns.split("|"),
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


const buildIncludes = (include, model) => {
    const includeSyntax = (model) => {
        return {
            model: model.model,
            as: model.as
        }
    }

    if (Object.keys(include).length == 0) include = includeSyntax(model)
    else include["include"] = includeSyntax(model)

    return include
}

module.exports.queryTableSeparation = (models, options) => {
    let include = {}
    for (var i in options) {
        let dateFlag = isDate(options[i].parameters)

        for (var col in options[i].columns) {

            options[i].columns[col] = underscoreToCamelCase(options[i].columns[col])


            let split, column, colSyntax, checkModel
            colSyntax = options[i].columns[col]
            split = colSyntax.split(".")
            column = split[split.length - 1]

            if (split.length == 1) {
                options[i].columns[col] = column
                include = { all: true, nested: true }
            } else {
                let temp = "$"

                for (var j = 0; j < split.length - 1; j++) {
                    checkModel = models[j + 1].find((e) => {
                        return (
                            split[j] == e.as ||
                            firstLetterUppercase(split[j]) == e.model.name
                        )
                    })
                    if (checkModel != undefined) {
                        checkModel = (j == 0) ?
                            (checkModel.references == models[j].model.name ? checkModel : undefined) :
                            (models[j].find((e) => {
                                return checkModel.references == e.model.name
                            }) != undefined ? checkModel : undefined)
                    } // check if ref the right parent table
                    if (checkModel == undefined) throw new Error("Invalid eager syntax. Have your syntax either match table name or its alias")
                    include = buildIncludes(include, checkModel)
                    temp = temp.concat(checkModel.as, ".")
                }
                options[i].columns[col] = temp.concat(camelCaseToUnderscore(column), "$")
            }

            if (dateFlag) {
                let model = checkModel == undefined ? models[0].model : checkModel.model
                if (model.tableAttributes[column].type.constructor.key == "DATE") {
                    const dateColumnObj = dateColumnHandler(
                        options[i].columns[col],
                        options[i].parameters,
                        options[i].operator
                    )
                    options[i].columns[col] = dateColumnObj
                }
            }

        }
    }

    return { options, include }
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
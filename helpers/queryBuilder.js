const Op = require('sequelize').Op
const { dateInput } = require('./dateInput')

module.exports.createdAtHandler = (parameters, operator) => {
    let arr = [], columns = ['createdAt']
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
        columns: columns,
        operator: Op.lte,
        parameters: endDate
    })
    return arr
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
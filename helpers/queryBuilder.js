const Op = require('sequelize').Op

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
    for (let optionIndex = 0; optionIndex < filterOption.length; optionIndex++) {
        let index = filterOption[optionIndex]
        if (optionIndex == 0 && index.columns[0] == "createdAt") {
            // For if created at Not equal
            if (index.parameters > filterOption[optionIndex + 1].parameters) {
                optionAnd.push({
                    [Op.not]: {
                        [Op.and]: [
                            condition("createdAt", index.operator, filterOption[optionIndex + 1].parameters),
                            condition("createdAt", filterOption[optionIndex + 1].operator, index.parameters)
                        ]
                    }
                })
                optionIndex++
                continue;
            }
        }
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
    return query
}
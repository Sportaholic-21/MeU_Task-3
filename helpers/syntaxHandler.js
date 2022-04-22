module.exports.underscoreToCamelCase = (string) => {
    return string.replace(/_([a-z])/g, function (g) { return g[1].toUpperCase() })
}

module.exports.camelCaseToUnderscore = (string) => {
    return string.replace(/([a-z][A-Z])/g, function (g) { return g[0] + '_' + g[1].toLowerCase() })
}
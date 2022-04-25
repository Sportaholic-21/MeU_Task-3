module.exports.underscoreToCamelCase = (string) => {
    return string.replace(/_([a-z])/g, function (g) { return g[1].toUpperCase() })
}

module.exports.camelCaseToUnderscore = (string) => {
    return string.replace(/([a-z][A-Z])/g, function (g) { return g[0] + '_' + g[1].toLowerCase() })
}

module.exports.countString = (str, letter) => {
    let count = 0;

    // looping through the items
    for (let i = 0; i < str.length; i++) {

        // check if the character is at that position
        if (str.charAt(i) == letter) {
            count += 1;
        }
    }
    return count;
}

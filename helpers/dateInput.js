module.exports.dateInput = (date) => {
    let inputDate = date.split(/[-\/]/)
    let dd = 0
    if (inputDate[0].toString().length > 2) {
        dd = 1
    }
    if (inputDate[dd] > 12) {
        inputDate[dd] = [inputDate[dd + 1], inputDate[dd + 1] = inputDate[dd]][0]
    }
    return new Date(inputDate.join("/"))
}

module.exports.isDate = (string) => {
    let inputDate = string.split(/[-\/]/)
    if (inputDate.length <= 1) {
        return false
    }
    for (var i in inputDate) {
        if (isNaN(inputDate[i])) return false
    }
    let dd = 0
    if (inputDate[0].toString().length > 2) {
        dd = 1
    }
    if (inputDate[dd] > 12) {
        inputDate[dd] = [inputDate[dd + 1], inputDate[dd + 1] = inputDate[dd]][0]
    }
    return (new Date(inputDate) != "Invalid Date" && !isNaN(new Date(inputDate)))
}
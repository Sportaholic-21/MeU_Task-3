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
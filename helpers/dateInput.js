module.exports.dateInput = (date) => {
    let inputDate = date.split(/[-\/]/)
    if (inputDate[0] > 12) {
        inputDate[0] = [inputDate[1], inputDate[1] = inputDate[0]][0]
    }
    return new Date(inputDate.join("/"))
}
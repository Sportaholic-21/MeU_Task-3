module.exports.apiResponseSuccess = (message, responseData) => {
    return {
        "message": message,
        "responseData": responseData,
        "status": "success",
        "timeStamp": new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '')
    }
}

module.exports.apiResponseFail = (message, violations) => {
    return {
        "message": message,
        "status": "fail",
        "timeStamp": new Date().toISOString().replace(/T/, ' ').replace(/\..+/, ''),
        "violations": violations
    }
}
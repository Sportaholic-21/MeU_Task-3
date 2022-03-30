module.exports.apiResponseSuccess = (res, message, responseData) => {
    return res.status(200).json({
        "message": message,
        "responseData": responseData,
        "status": "success",
        "timeStamp": new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '')
    })
}

module.exports.apiResponseFail = (res, message, violations) => {
    let statusCode
    if (message == "Unauthorized") statusCode = 401
    if (message == "Forbidden") statusCode = 403
    if (message == "Internal Server Error") statusCode = 500
    return res.status(statusCode).json({
        "message": message,
        "status": "fail",
        "timeStamp": new Date().toISOString().replace(/T/, ' ').replace(/\..+/, ''),
        "violations": violations
    })
}
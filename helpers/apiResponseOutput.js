module.exports.apiResponse = (res, message = "", responseData = "", apiStatus = "", statusCode = 200, violations = "") => {
    return res.status(statusCode).json({
        "message": message,
        "responseData": responseData,
        "status": apiStatus,
        "timeStamp": new Date().toISOString().replace(/T/, ' ').replace(/\..+/, ''),
        "violations": violations
    })
}
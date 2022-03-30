module.exports.apiResponse = (res, message = "", responseData = "", apiStatus = "", violations = "") => {
    let response = {}, statusCode = 200
    response.message = message
    if (responseData != "") response.responseData = responseData
    response.apiStatus = apiStatus
    response.timeStamp = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '')
    if (violations != "") {
        if (violations == "Unauthorized") statusCode = 401
        if (violations == "Forbidden") statusCode = 403
        if (violations == "Internal Server Error") statusCode = 500
        response.violations = violations
    }
    return res.status(statusCode).json(response)
}
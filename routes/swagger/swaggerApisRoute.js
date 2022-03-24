const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express')

const swaggerOptions = {
    swaggerDefinition: {
        info: {
            title: "MeU Internship - Week 2 & 3",
            description: "User APIs including login, register & get all & Swagger documentations",
            contact: {
                name: "Long Nguyen Phuc"
            },
            servers: [`http://localhost:3000`]
        },
        securityDefinitions: {
            bearerAuth: {
                type: 'apiKey',
                name: 'Authorization',
                scheme: 'bearer',
                in: 'header'
            }
        }
    },
    apis: ["routes/*/*.js"],

}

const swaggerDocs = swaggerJSDoc(swaggerOptions)

module.exports = function (app) {
    /**
     * @swagger
     * /api-docs:
     *  get:
     *    description: Use to document apis
     */
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs))
}
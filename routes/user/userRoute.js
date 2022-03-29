const userController = require('../../controllers/userController')
const middleware = require('../../middlewares/userMiddlewares')
const baseRoute = '/api/users'

module.exports = function (app) {

    /**
     * @swagger
     * /api/users:
     *  get:
     *    description: Use to request all users with pagination, require to be authorized
     *    parameters:
     *     - in: query
     *       name: pagination option - page
     *       description: additional params for pagination, default at page 1
     *       required: false
     *       schema:
     *          type: number
     *     - in: query
     *       name: pagination option - size
     *       description: additional params for pagination, default at size 10
     *       required: false
     *       schema:
     *          type: number
     *    security:
     *      - bearerAuth: []
     *    responses:
     *      '200':
     *        description: A successful response
     *      '401':
     *        description: Unauthorized
     *      '403':
     *        description: Forbidden
     */
    app.get(baseRoute, middleware.userAuthToken, userController.getAllUser)

    /**
     * @swagger
     * /api/users/{filter}:
     *  get:
     *    description: Use to request all users with pagination, require to be authorized
     *    parameters:
     *     - in: query
     *       name: pagination option - page
     *       description: additional params for pagination, default at page 1
     *       required: false
     *       schema:
     *          type: number
     *     - in: query
     *       name: pagination option - size
     *       description: additional params for pagination, default at size 10
     *       required: false
     *       schema:
     *     - in: params
     *       name: filter
     *       description: add filters
     *       required: true
     *    security:
     *      - bearerAuth: []
     *    responses:
     *      '200':
     *        description: A successful response
     *      '401':
     *        description: Unauthorized
     *      '403':
     *        description: Forbidden
     */
    app.get(baseRoute + "/:filter", middleware.userAuthToken,middleware.handleFilterOptions, middleware.queryBuilder,userController.getAllUser)

    /**
     * @swagger
     * /api/users/register:
     *  post:
     *    description: Use to register user, user will then have to activate their account through email
     *    parameters:
     *      - in: body
     *        name: user
     *        description: the user to create
     *        schema:
     *          type: object
     *          required:
     *           - username
     *           - password
     *           - email
     *           - roleId
     *          properties:
     *           username:
     *              type: string
     *           password: 
     *              type: string
     *           email: 
     *              type: string
     *           roleId: 
     *              type: number
     *    responses:
     *      '200':
     *        description: A successful response
     *      '500':
     *        description: Server error
     *        
     */
    app.post(baseRoute + "/register", middleware.hashPassword, userController.register)

    /**
     * @swagger
     * /api/users/verify/{verifyCode}:
     *  get:
     *    description: Use to activate user account after registrations
     *    parameters:
     *     - in: path
     *       name: verifyCode
     *       description: verify code used for verification
     *       required: true
     *       schema:
     *        type: string
     *    responses:
     *      '200':
     *        description: A successful response
     *      '500':
     *        description: Server error
     */
    app.get(baseRoute + "/verify/:verifyCode", userController.verifiedEmail)

    /**
     * @swagger
     * /api/users/login:
     *  post:
     *    description: Use to log user in, server will then provide an access token
     *    parameters:
     *      - in: body
     *        name: user
     *        description: the user to create
     *        schema:
     *          type: object
     *          required:
     *           - name
     *           - password
     *          properties:
     *           name:
     *              type: string
     *           password: 
     *              type: string
     *    responses:
     *      '200':
     *        description: A successful response
     *      '500':
     *        description: Server error
     *        
     */
    app.post(baseRoute + "/login", userController.login)

    /**
     * @swagger
     * /api/users/newToken:
     *  post:
     *    description: Use to generate new access token after taking in a refresh token
     *    parameters:
     *      - in: body
     *        name: user
     *        description: the user to create
     *        schema:
     *          type: object
     *          required:
     *           - refreshToken
     *          properties:
     *           refreshToken:
     *              type: string
     *    responses:
     *      '200':
     *        description: A successful response
     *      '500':
     *        description: Server error
     *        
     */
    app.post(baseRoute + "/newToken", userController.genNewAccessToken)
}
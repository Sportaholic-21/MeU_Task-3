const Op = require("sequelize").Op

class UserService {
    constructor(models) {
        this._User = models.UserTbl
        this._User_Role = models.UserRoleTbl
        this._User_Role_Type = models.UserRoleTypeTbl
    }

    async getUsersCount() {
        return await this._User.count()
    }

    async getAllUsers(userQuery, page, size) {
        const { count, rows } = await this._User.findAndCountAll({
            where: userQuery,
            attributes: {
                exclude: ['password'],
            },
            include: {
                model: this._User_Role,
                as: "userRole",
                include: {
                    model: this._User_Role_Type,
                    as: "role",
                }
            },
            limit: size,
            offset: (page - 1) * size
        })
        return { count, rows }
        // return await this._User_Role.findAll({
        //     where: userRoleQuery,
        //     include: [{
        //         model: this._User,
        //         as: "user",
        //         attributes: ['userId', 'username', 'email', 'createdAt'],
        //         where: userQuery,

        //     }, {
        //         model: this._User_Role_Type,
        //         as: "role",
        //         where: userRoleTypeQuery
        //     }],
        //     limit: size,
        //     offset: (page - 1) * size
        // })
    }

    async addUser(newUser) {
        try {
            const userRole = await this._User_Role.create({
                roleId: newUser.roleId
            })
            const user = await this._User.create({
                username: newUser.username,
                password: newUser.password,
                email: newUser.email,
                userRoleId: userRole.userRoleId
            })
            console.log(user)
            return true
        } catch (error) {
            console.log(error)
            return false
        }
    }

    // Could be username or email
    async findUserByName(name) {
        try {
            return await this._User.findOne({
                where: name.includes("@") ? { email: name } : { username: name }
            })
        } catch (error) {
            throw error
        }
    }

    async findUserById(id) {
        try {
            return await this._User.findByPk(id)
        } catch (error) {
            throw error
        }
    }
}

module.exports = UserService
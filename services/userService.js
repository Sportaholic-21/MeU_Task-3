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

    async getAllUsers(userQuery, userRoleQuery, userRoleTypeQuery, page, size) {
        const checkQueryEmpty = (query) => {
            return query[Op.and] == undefined
        }
        if (checkQueryEmpty(userRoleQuery) && (!checkQueryEmpty(userQuery) || !checkQueryEmpty(userRoleTypeQuery))) {
            let output = []
            if (!checkQueryEmpty(userQuery)) {
                const user = await this._User.findAll({
                    where: userQuery,
                    attributes: ['userId', 'username', 'email', 'createdAt'],
                    limit: size,
                    offset: (page - 1) * size
                })
                if (user.length > 0) output.push(user)
            }
            if (!checkQueryEmpty(userRoleTypeQuery)) {
                const role = await this._User_Role_Type.findAll({
                    where: userRoleTypeQuery,
                    limit: size,
                    offset: (page - 1) * size
                })
                if (role.length > 0) output.push(role)
            }
            return output
        }
        return await this._User_Role.findAll({
            where: userRoleQuery,
            include: [{
                model: this._User,
                as: "user",
                attributes: ['userId', 'username', 'email', 'createdAt'],
                where: userQuery,

            }, {
                model: this._User_Role_Type,
                as: "role",
                where: userRoleTypeQuery
            }],
            limit: size,
            offset: (page - 1) * size
        })
    }

    async addUser(newUser) {
        try {
            await this._User.create({
                username: newUser.username,
                password: newUser.password,
                email: newUser.email,
            }).then(async user => {
                await this._User_Role.create({
                    userId: user.userId,
                    roleId: newUser.roleId
                })
            })
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
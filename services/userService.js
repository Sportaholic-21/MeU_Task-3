class UserService {
    constructor(models) {
        this._User = models.UserTbl
        this._User_Role = models.UserRoleTbl
        this._User_Role_Type = models.UserRoleTypeTbl
    }

    async getUsersCount() {
        return await this._User.count()
    }

    async getAllUsers(userQuery, includes, page, size) {
        const { count, rows } = await this._User.findAndCountAll({
            where: userQuery,
            attributes: {
                exclude: ['password'],
            },
            include: includes,
            limit: size,
            offset: (page - 1) * size
        })
        return { count, rows }
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
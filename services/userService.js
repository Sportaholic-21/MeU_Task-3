class UserService {
    constructor(User) {
        this._User = User
    }

    async getAllUsers(page, size) {
        return await this._User.findAll({
            attributes: {exclude: ['password']},
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
                roleId: newUser.roleId
            }).then(function (user) {
                console.log(user)
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
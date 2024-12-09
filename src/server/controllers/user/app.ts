import * as createUser from './Create'
import * as getAllUsers from './GetAllUsers'
import * as getUserById from './GetUserById'



export const UserController = {
    ...createUser,
    ...getAllUsers,
    ...getUserById
}
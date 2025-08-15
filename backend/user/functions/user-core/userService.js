// Author(s): Rhys Cleary
const { updateUser, getUserById } = require("@etron/shared/utils/auth");
const workspaceUsersRepo = require("@etron/shared/repositories/workspaceUsersRepository");

async function updateUserInUserPool(userId, workspaceId, updateData) {

    // update user in userpool
    await updateUser(userId, updateData);

    const updatedUser = await getUserById(userId);

    const userData = {
        given_name: updatedUser.given_name,
        family_name: updateUser.family_name,
        picture: updatedUser.picture
    }

    return workspaceUsersRepo.updateUser(workspaceId, userId, userData);
}

module.exports = {
    updateUserInUserPool
};
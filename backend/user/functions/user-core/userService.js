// Author(s): Rhys Cleary
const { updateUser, getUserById } = require("@etron/shared/utils/auth");
const workspaceUsersRepo = require("@etron/shared/repositories/workspaceUsersRepository");
const { logAuditEvent } = require("@etron/shared/utils/auditLogger");

async function updateUserInUserPool(userId, workspaceId, updateData) {
    // update user in userpool
    await updateUser(userId, updateData);

    const updatedUser = await getUserById(userId);

    const userData = {
        given_name: updatedUser.given_name,
        family_name: updatedUser.family_name,
        phone_number: updatedUser.phone_number,
        picture: updatedUser.picture
    }

    // log audit
    await logAuditEvent({
        workspaceId,
        userId: userId,
        action: "Updated",
        filters: ["user", "settings", "updated"],
        itemType: "user",
        itemId: userId,
        itemName: `${updatedUser.given_name} ${updatedUser.family_name}`
    });

    return workspaceUsersRepo.updateUser(workspaceId, userId, userData);
}

module.exports = {
    updateUserInUserPool
};
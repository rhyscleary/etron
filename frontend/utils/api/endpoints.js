// eTRONs API endpoints

const WORKSPACE_BASE_URL = "https://9vwo52sbo0.execute-api.ap-southeast-2.amazonaws.com/Prod/workspace";

const endpoints = {
    workspace: {
        core: {
            create: `${WORKSPACE_BASE_URL}/workspace`,
            update: (workspaceId) => `${WORKSPACE_BASE_URL}/${workspaceId}`,
            get: (workspaceId) => `${WORKSPACE_BASE_URL}/${workspaceId}`,
            getByUserId: (userId) => `${WORKSPACE_BASE_URL}/users/${userId}`,
            transfer: (workspaceId, userId) => `${WORKSPACE_BASE_URL}/${workspaceId}/transfer/${userId}`,
            delete: (workspaceId) => `${WORKSPACE_BASE_URL}/${workspaceId}`,
            getDefaultPermissions: `${WORKSPACE_BASE_URL}/permissions` 
        },

        invites: {
            create: (workspaceId) => `${WORKSPACE_BASE_URL}/${workspaceId}/invites`,
            cancelAllInvites: (workspaceId, email) => `${WORKSPACE_BASE_URL}/${workspaceId}/invites/${email}`,
            cancelInvite: (workspaceId, inviteId) => `${WORKSPACE_BASE_URL}/${workspaceId}/invites/${inviteId}`,
            get: (workspaceId, inviteId) => `${WORKSPACE_BASE_URL}/${workspaceId}/invites/${inviteId}`,
            getInvitesSent: (workspaceId) => `${WORKSPACE_BASE_URL}/${workspaceId}/invites`,
        },

        roles: {

        },

        users: {

        },

        profiles: {

        },

        modules: {
            
        }
    },

}

export default endpoints;
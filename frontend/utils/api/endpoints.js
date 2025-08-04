// eTRONs API endpoints

const WORKSPACE_BASE_URL = "https://9vwo52sbo0.execute-api.ap-southeast-2.amazonaws.com/Prod/workspace";
const USER_BASE_URL = "https://19eulpomf3.execute-api.ap-southeast-2.amazonaws.com/Prod/user";
const DATASOURCES_BASE_URL = "https://curkjf7oi6.execute-api.ap-southeast-2.amazonaws.com/Prod/day-book/data-sources";
const METRICS_BASE_URL = "https://curkjf7oi6.execute-api.ap-southeast-2.amazonaws.com/Prod/day-book/metrics";

const endpoints = {
    workspace: {
        core: {
            create: `${WORKSPACE_BASE_URL}`,
            update: (workspaceId) => `${WORKSPACE_BASE_URL}/${workspaceId}`,
            getWorkspace: (workspaceId) => `${WORKSPACE_BASE_URL}/${workspaceId}`,
            getByUserId: (userId) => `${WORKSPACE_BASE_URL}/users/${userId}`,
            transfer: (workspaceId, userId) => `${WORKSPACE_BASE_URL}/${workspaceId}/transfer/${userId}`,
            delete: (workspaceId) => `${WORKSPACE_BASE_URL}/${workspaceId}`,
            getDefaultPermissions: `${WORKSPACE_BASE_URL}/permissions` 
        },

        invites: {
            create: (workspaceId) => `${WORKSPACE_BASE_URL}/${workspaceId}/invites`,
            cancelAllInvites: (email) => `${WORKSPACE_BASE_URL}/invites/${email}`,
            cancelInvite: (workspaceId, inviteId) => `${WORKSPACE_BASE_URL}/${workspaceId}/invites/${inviteId}`,
            getInvite: (workspaceId, inviteId) => `${WORKSPACE_BASE_URL}/${workspaceId}/invites/${inviteId}`,
            getInvitesSent: (workspaceId) => `${WORKSPACE_BASE_URL}/${workspaceId}/invites`,
        },

        roles: {
            create: (workspaceId) => `${WORKSPACE_BASE_URL}/${workspaceId}/roles`,
            update: (workspaceId, roleId) => `${WORKSPACE_BASE_URL}/${workspaceId}/roles/${roleId}`,
            delete: (workspaceId, roleId) => `${WORKSPACE_BASE_URL}/${workspaceId}/roles/${roleId}`,
            getRole: (workspaceId, roleId) => `${WORKSPACE_BASE_URL}/${workspaceId}/roles/${roleId}`,
            getRoles: (workspaceId) => `${WORKSPACE_BASE_URL}/${workspaceId}/roles`,
        },

        users: {
            add: (workspaceId, inviteId) => `${WORKSPACE_BASE_URL}/${workspaceId}/users/invites/${inviteId}`,
            update: (workspaceId, userId) => `${WORKSPACE_BASE_URL}/${workspaceId}/users/${userId}`,
            remove: (workspaceId, userId) => `${WORKSPACE_BASE_URL}/${workspaceId}/users/${userId}`,
            getUser: (workspaceId, userId) => `${WORKSPACE_BASE_URL}/${workspaceId}/users/${userId}`,
            getUsers: (workspaceId) => `${WORKSPACE_BASE_URL}/${workspaceId}/users`,
        },

        profiles: {
            create: (workspaceId) => `${WORKSPACE_BASE_URL}/${workspaceId}/profiles`,
            update: (workspaceId, profileId) => `${WORKSPACE_BASE_URL}/${workspaceId}/profiles/${profileId}`,
            delete: (workspaceId, profileId) => `${WORKSPACE_BASE_URL}/${workspaceId}/profiles/${profileId}`,
            getProfile: (workspaceId, profileId) => `${WORKSPACE_BASE_URL}/${workspaceId}/profiles/${profileId}`,
            getProfiles: (workspaceId) => `${WORKSPACE_BASE_URL}/${workspaceId}/profiles`
        },

        modules: {
            install: (workspaceId, moduleKey) => `${WORKSPACE_BASE_URL}/${workspaceId}/modules/${moduleKey}`,
            uninstall: (workspaceId, moduleKey) => `${WORKSPACE_BASE_URL}/${workspaceId}/modules/${moduleKey}`,
            toggle: (workspaceId, moduleKey) => `${WORKSPACE_BASE_URL}/${workspaceId}/modules/${moduleKey}/toggle`,
            getInstalledModules: (workspaceId) => `${WORKSPACE_BASE_URL}/${workspaceId}/modules/installed`,
            getUninstalledModules: (workspaceId) => `${WORKSPACE_BASE_URL}/${workspaceId}/modules/uninstalled`,
            
        }
    },

    user: {
        core: {
            updateUser: (userId, workspaceId) => `${USER_BASE_URL}/${userId}/workspace/${workspaceId}`,
        },

        invites: {
            getUserInvites: (userId, workspaceId) => `${USER_BASE_URL}/${userId}/workspace/${workspaceId}`,
        }
    },

    modules: {
        day_book: {
            data_sources: {
                add: `${DATASOURCES_BASE_URL}`,
                update: (dataSourceId) => `${DATASOURCES_BASE_URL}/${dataSourceId}`,
                getDataSource: (dataSourceId) => `${DATASOURCES_BASE_URL}/${dataSourceId}`,
                getDataSources: `${DATASOURCES_BASE_URL}`,
                removeDataSource: (dataSourceId) => `${DATASOURCES_BASE_URL}/${dataSourceId}`,
            },

            metrics: {
                add: `${METRICS_BASE_URL}`,
                update: (metricId) => `${METRICS_BASE_URL}/${metricId}`,
                getMetric: (metricId) => `${METRICS_BASE_URL}/${metricId}`,
                getMetrics: `${METRICS_BASE_URL}`,
                removeMetric: (metricId) => `${METRICS_BASE_URL}/${metricId}`,
            }
        }
    }

}

export default endpoints;
// eTRONs API endpoints

const WORKSPACE_BASE_URL = "https://om8cd7wmkc.execute-api.ap-southeast-2.amazonaws.com/dev/workspace";
const USER_BASE_URL = "https://jhpswpwuo4.execute-api.ap-southeast-2.amazonaws.com/dev/user";
const DATASOURCES_BASE_URL = "https://ewkie0rh0a.execute-api.ap-southeast-2.amazonaws.com/dev/day-book/data-sources";
const METRICS_BASE_URL = "https://ewkie0rh0a.execute-api.ap-southeast-2.amazonaws.com/dev/day-book/metrics";
const REPORTS_BASE_URL = "https://ewkie0rh0a.execute-api.ap-southeast-2.amazonaws.com/dev/day-book/reports";

const endpoints = {
    workspace: {
        core: {
            create: `${WORKSPACE_BASE_URL}`,
            update: (workspaceId) => `${WORKSPACE_BASE_URL}/${workspaceId}`,
            getWorkspace: (workspaceId) => `${WORKSPACE_BASE_URL}/${workspaceId}`,
            getByUserId: (userId) => `${WORKSPACE_BASE_URL}/users/${userId}`,
            transfer: (workspaceId) => `${WORKSPACE_BASE_URL}/${workspaceId}/transfer`,
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
            getRoleOfUser: (workspaceId) => `${WORKSPACE_BASE_URL}/${workspaceId}/roleOfUser`,
            getRoles: (workspaceId) => `${WORKSPACE_BASE_URL}/${workspaceId}/roles`,
        },

        users: {
            add: (workspaceId) => `${WORKSPACE_BASE_URL}/${workspaceId}/users`,
            update: (workspaceId, userId) => `${WORKSPACE_BASE_URL}/${workspaceId}/users/${userId}`,
            remove: (workspaceId, userId) => `${WORKSPACE_BASE_URL}/${workspaceId}/users/${userId}`,
            getUser: (workspaceId, userId) => `${WORKSPACE_BASE_URL}/${workspaceId}/users/${userId}`,
            getUsers: (workspaceId) => `${WORKSPACE_BASE_URL}/${workspaceId}/users`,
        },

        boards: {
            create: (workspaceId) => `${WORKSPACE_BASE_URL}/${workspaceId}/boards`,
            update: (workspaceId, boardId) => `${WORKSPACE_BASE_URL}/${workspaceId}/boards/${boardId}`,
            delete: (workspaceId, boardId) => `${WORKSPACE_BASE_URL}/${workspaceId}/boards/${boardId}`,
            getBoard: (workspaceId, boardId) => `${WORKSPACE_BASE_URL}/${workspaceId}/boards/${boardId}`,
            getBoards: (workspaceId) => `${WORKSPACE_BASE_URL}/${workspaceId}/boards`
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
            getUserInvites: `${USER_BASE_URL}/invites`,
        }
    },

    modules: {
        day_book: {
            data_sources: {
                addRemote: `${DATASOURCES_BASE_URL}/remote`,
                addLocal: `${DATASOURCES_BASE_URL}/local`,
                update: (dataSourceId) => `${DATASOURCES_BASE_URL}/${dataSourceId}`,
                getDataSource: (dataSourceId) => `${DATASOURCES_BASE_URL}/${dataSourceId}`,
                getDataSources: `${DATASOURCES_BASE_URL}`,
                removeDataSource: (dataSourceId) => `${DATASOURCES_BASE_URL}/${dataSourceId}`,
                testConnection: `${DATASOURCES_BASE_URL}/test-connection`,
                remotePreview: `${DATASOURCES_BASE_URL}/preview/remote`,
                viewData: (dataSourceId) => `${DATASOURCES_BASE_URL}/${dataSourceId}/view-data`,
                viewDataForMetric: (dataSourceId, metricId) => `${DATASOURCES_BASE_URL}/${dataSourceId}/view-data-for-metric/${metricId}`,
                getUploadUrl: (dataSourceId) => `${DATASOURCES_BASE_URL}/${dataSourceId}/upload`,
                getAvailableSheets: `${DATASOURCES_BASE_URL}/available-sheets`,
                updateData: (dataSourceId) => `${DATASOURCES_BASE_URL}/${dataSourceId}/update-data`,
                
                // google sheets specific endpoints
                integrations: {
                    getUserTokens: `${DATASOURCES_BASE_URL}/integrations/user-tokens`,

                    google: {
                        linkGoogle: `${DATASOURCES_BASE_URL}/integrations/google/link`
                    },

                }
            },

            metrics: {
                add: `${METRICS_BASE_URL}`,
                update: (metricId) => `${METRICS_BASE_URL}/${metricId}`,
                getMetric: (metricId) => `${METRICS_BASE_URL}/${metricId}`,
                getMetrics: `${METRICS_BASE_URL}`,
                removeMetric: (metricId) => `${METRICS_BASE_URL}/${metricId}`,
            },

            reports: {
                drafts: {
                    createDraft: `${REPORTS_BASE_URL}/drafts`,
                    updateDraft: (draftId) => `${REPORTS_BASE_URL}/drafts/${draftId}`,
                    getDraft: (draftId) => `${REPORTS_BASE_URL}/drafts/${draftId}`,
                    getDrafts: (workspaceId) => `${REPORTS_BASE_URL}/drafts?workspaceId=${workspaceId}`,
                    deleteDraft: (draftId) => `${REPORTS_BASE_URL}/drafts/${draftId}`,
                },
                templates: {
                    createTemplate: `${REPORTS_BASE_URL}/templates`,
                    updateTemplate: (templateId) => `${REPORTS_BASE_URL}/templates/${templateId}`,
                    getTemplate: (templateId) => `${REPORTS_BASE_URL}/templates/${templateId}`,
                    getTemplates: `${REPORTS_BASE_URL}/templates`,
                    deleteTemplate: (templateId) => `${REPORTS_BASE_URL}/templates/${templateId}`,
                },
                exports: { 
                    addExport: `${REPORTS_BASE_URL}/exports`,
                    getExport: (exportId) => `${REPORTS_BASE_URL}/exports/${exportId}`,
                    getExports: `${REPORTS_BASE_URL}/exports`,
                    getExportDownloadUrl: (exportId) => `${REPORTS_BASE_URL}/exports/${exportId}/download`,
                }
            },
        }
    }

}

export default endpoints;
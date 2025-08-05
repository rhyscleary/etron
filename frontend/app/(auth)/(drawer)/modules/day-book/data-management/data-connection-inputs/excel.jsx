import React from "react";
import { router } from "expo-router";
import MicrosoftButton from "../../../../../../../components/common/buttons/MicrosoftButton";
import ConnectionDataSourceLayout from "../../../../../../../components/layout/ConnectionDataSourceLayout";
import { apiPost } from "../../../../../../../utils/api/apiClient"; 
import endpoints from "../../../../../../../utils/api/endpoints";
import { 
    getCurrentUser, 
    fetchAuthSession,
    signOut
} from "aws-amplify/auth";



const Excel = () => {
    const apiClient = {
            post: apiPost,
            get: async (url) => ({ data: [] }), 
            put: async (url, data) => ({ data: {} }),
            delete: async (url) => ({ data: {} })
        };

        const authService = {
            getCurrentUser,
            fetchAuthSession,
            signOut
        };

    const getItemDescription = (spreadsheet, formatDate) => {
        return `${spreadsheet.location} • ${spreadsheet.size} • Last modified: ${formatDate(spreadsheet.lastModified)}`;
    };

    const getItemIcon = () => "microsoft-excel";

    return (
        <ConnectionDataSourceLayout
            title="Excel"
            adapterType="microsoft-excel"
            adapterDependencies={{
                authService: { getCurrentUser, fetchAuthSession, signOut },
                apiClient: { post: apiPost },
                endpoints,
                options: {
                    demoMode: typeof __DEV__ !== 'undefined' ? __DEV__ : true,
                    fallbackToDemo: true
                }
            }}
            serviceDisplayName="Microsoft"
            ConnectButton={MicrosoftButton}
            connectButtonProps={{
                imageSource: require('../../../../../../../assets/images/Microsoft.png')
            }}
            getItemDescription={getItemDescription}
            getItemIcon={getItemIcon}
            showLocationFilter={true}
            searchPlaceholder="Search Excel files"
            emptyStateMessage="No Excel files found in your OneDrive or SharePoint"
            demoModeMessage="Using sample Excel files for development"
            enablePersistentConnection={true}
            dataSourceName="My Excel Connection"
            apiClient={apiClient}
            authService={authService}
            dataManagementPath="/modules/day-book/data-management/data-management"
        />
    );
};

export default Excel;
import React from "react";
import GoogleButton from "../../../../../../../components/common/buttons/GoogleButton";
import ConnectionDataSourceLayout from "../../../../../../../components/layout/ConnectionDataSourceLayout";
import { apiPost } from "../../../../../../../utils/api/apiClient"; 
import endpoints from "../../../../../../../utils/api/endpoints";
import { 
    getCurrentUser, 
    fetchAuthSession,
    signOut
} from "aws-amplify/auth";

const GoogleSheets = () => {
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
        return `Last modified: ${formatDate(spreadsheet.lastModified)}`;
    };

    const getItemIcon = () => "google-spreadsheet";

    return (
        <ConnectionDataSourceLayout
            title="Google Sheets"
            adapterType="google-sheets"
            adapterDependencies={{
                authService,
                apiClient: { post: apiPost },
                endpoints,
                options: {
                    demoMode: typeof __DEV__ !== 'undefined' ? __DEV__ : true,
                    fallbackToDemo: true
                }
            }}
            serviceDisplayName="Google"
            ConnectButton={GoogleButton}
            connectButtonProps={{
                imageSource: require('../../../../../../../assets/images/Google.jpg')
            }}
            getItemDescription={getItemDescription}
            getItemIcon={getItemIcon}
            showLocationFilter={false}
            searchPlaceholder="Search spreadsheets"
            emptyStateMessage="No spreadsheets found"
            demoModeMessage="Using sample Google Sheets data for development"
            enablePersistentConnection={true}
            dataSourceName="My Google Sheets Connection"
            apiClient={apiClient}
            authService={authService}
            dataManagementPath="/modules/day-book/data-management/data-management"
           
        />
    );
};

export default GoogleSheets;
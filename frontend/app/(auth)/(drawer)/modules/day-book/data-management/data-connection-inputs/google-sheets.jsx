import React from "react";
import { router } from "expo-router";
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
    const handleContinue = async (selectedSpreadsheet) => {
        router.push({
            pathname: "/modules/day-book/data-management/data-management",
            params: {
                type: "google-sheets",
                spreadsheetId: selectedSpreadsheet.id,
                name: selectedSpreadsheet.name,
                url: selectedSpreadsheet.url,
            },
        });
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
                authService: { getCurrentUser, fetchAuthSession, signOut },
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
            onContinue={handleContinue}
            showLocationFilter={false}
            searchPlaceholder="Search spreadsheets"
            emptyStateMessage="No spreadsheets found"
            demoModeMessage="Using sample Google Sheets data for development"
        />
    );
};

export default GoogleSheets;
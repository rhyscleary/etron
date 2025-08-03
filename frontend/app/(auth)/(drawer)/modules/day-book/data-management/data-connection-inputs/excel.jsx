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
        const handleContinue = async (selectedSpreadsheet, { getWorksheets }) => {
            try {
                let worksheets = ["Sheet1"];
                try {
                    worksheets = await getWorksheets(selectedSpreadsheet.id);
                } catch (error) {
                    console.warn("Failed to get worksheets, using default");
                }

                router.push({
                    pathname: "/modules/day-book/data-management/data-management",
                    params: {
                        type: "microsoft-excel",
                        spreadsheetId: selectedSpreadsheet.id,
                        name: selectedSpreadsheet.name,
                        url: selectedSpreadsheet.url,
                        location: selectedSpreadsheet.location,
                        size: selectedSpreadsheet.size,
                        worksheets: JSON.stringify(worksheets)
                    },
                });
            } catch (error) {
                console.error("Error preparing navigation:", error);
                router.push({
                    pathname: "/modules/day-book/data-management/data-management",
                    params: {
                        type: "microsoft-excel",
                        spreadsheetId: selectedSpreadsheet.id,
                        name: selectedSpreadsheet.name,
                        url: selectedSpreadsheet.url,
                        location: selectedSpreadsheet.location,
                        size: selectedSpreadsheet.size
                    },
                });
            }
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
                onContinue={handleContinue}
                showLocationFilter={true}
                searchPlaceholder="Search Excel files"
                emptyStateMessage="No Excel files found in your OneDrive or SharePoint"
                demoModeMessage="Using sample Excel files for development"
            />
        );
    };

    export default Excel;
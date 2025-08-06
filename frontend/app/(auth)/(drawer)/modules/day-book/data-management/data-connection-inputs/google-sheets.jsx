import React from "react";
import ConnectionDataSourceLayout from "../../../../../../../components/layout/ConnectionDataSourceLayout";

const GoogleSheets = () => {
    const getItemDescription = (dataSource, formatDate) => {
        return `Status: ${dataSource.status} • Last Modified: ${formatDate(dataSource.lastModified)}`;
    };

    const getItemIcon = () => "google-spreadsheet";

    return (
        <ConnectionDataSourceLayout
            title="Google Sheets"
            adapterType="google-sheets"
            serviceDisplayName="Google Sheets"
            getItemDescription={getItemDescription}
            getItemIcon={getItemIcon}
            showLocationFilter={false}
            searchPlaceholder="Search Google Sheets connections"
            emptyStateMessage="No Google Sheets connections found"
            demoModeMessage="Using sample Google Sheets data for development"
            enablePersistentConnection={true}
            dataSourceName="My Google Sheets Connection"
            dataManagementPath="/modules/day-book/data-management/data-management"
        />
    );
};

export default GoogleSheets;
import React from "react";
import ConnectionDataSourceLayout from "../../../../../../../components/layout/ConnectionDataSourceLayout";

const Excel = () => {
    const getItemDescription = (dataSource, formatDate) => {
        return `Status: ${dataSource.status} • Last Modified: ${formatDate(dataSource.lastModified)}`;
    };

    const getItemIcon = () => "microsoft-excel";

    return (
        <ConnectionDataSourceLayout
            title="Excel"
            adapterType="microsoft-excel"
            serviceDisplayName="Microsoft Excel"
            getItemDescription={getItemDescription}
            getItemIcon={getItemIcon}
            showLocationFilter={false}
            searchPlaceholder="Search Excel connections"
            emptyStateMessage="No Excel connections found"
            demoModeMessage="Using sample Excel files for development"
            enablePersistentConnection={true}
            dataSourceName="My Excel Connection"
            dataManagementPath="/modules/day-book/data-management/data-management"
        />
    );
};

export default Excel;
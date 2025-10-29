// Author(s): Matthew Page

import React, { useEffect, useMemo, useState } from "react";
import { router } from "expo-router";
import Header from "../../../../../../components/layout/Header";
import StackLayout from "../../../../../../components/layout/StackLayout";
import DescriptiveButton from "../../../../../../components/common/buttons/DescriptiveButton";
import ResponsiveScreen from "../../../../../../components/layout/ResponsiveScreen";
import PermissionGate from "../../../../../../components/common/PermissionGate";
import { hasPermission } from "../../../../../../utils/permissions";


const ReportsAndExportsManagement = () => {
    const [menuOptions, setMenuOptions] = useState([]);
   
    const menuButtonMap = useMemo(() => [
        {
            permKey: "modules.daybook.reports.view_reports",
            icon: "",
            label: "Reports",
            description: "Create, manage and export reports",
            onPress: () => router.navigate("/modules/day-book/reports/reports"),
        },
        {
            permKey: "modules.daybook.reports.manage_templates",
            icon: "",
            label: "View Templates",
            description: "View and edit all created templates",
            onPress: () => router.navigate("/modules/day-book/reports/templates"),
        },
        {
            permKey: "modules.daybook.reports.manage_exports",
            icon: "",
            label: "Export Metrics",
            description: "Export selected metrics as an image",
            onPress: () => router.navigate("/modules/day-book/reports/metric-selection"),
        },
        {
            permKey: "modules.daybook.reports.view_exports",
            icon: "",
            label: "View Exports",
            description: "View all past exported reports and metrics (up to 1 year prior)",
            onPress: () => router.navigate("/modules/day-book/reports/exports"),
        },
    ], []);

    const [allowedMap, setAllowedMap] = useState({});

    useEffect(() => {
        mapAllowedButtons();
    }, [menuButtonMap]);

    async function mapAllowedButtons() {
        const entries = await Promise.all(
            menuButtonMap.map(async (option) => {
                if (!option.permKey) return [option.label, true];
                try {
                    const allowed = await hasPermission(option.permKey);
                    return [option.label, allowed];
                } catch {
                    return [option.label, false];
                }
            })
        );
        setAllowedMap(Object.fromEntries(entries));
    }

    return (
        <ResponsiveScreen
            header={<Header title="Reports and Exports" showMenu />}
            center={false}
            scroll={true}
        >
            <StackLayout spacing={12}>
                {menuButtonMap.map((item) => {
                    const allowed = item.permKey ? allowedMap[item.label] : true;
                    return (
                        <PermissionGate
                            key={item.label}
                            allowed={allowed}
                            onAllowed={item.onPress}
                        >
                            <DescriptiveButton
                                icon={item.icon}
                                label={item.label}
                                description={item.description}
                            />
                        </PermissionGate>
                    );
                })}
            </StackLayout>
            </ResponsiveScreen>
    );
};

export default ReportsAndExportsManagement;
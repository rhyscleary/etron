// Author(s): Matthew Page

import { View, ScrollView, StyleSheet } from "react-native";
import Header from "../../../../../../components/layout/Header";

import { commonStyles } from "../../../../../../assets/styles/stylesheets/common";
import { router } from "expo-router";
import StackLayout from "../../../../../../components/layout/StackLayout";
import DescriptiveButton from "../../../../../../components/common/buttons/DescriptiveButton";
import React, {useState, useEffect} from "react";
import { hasPermission } from "../../../../../../utils/permissions";
import ResponsiveScreen from "../../../../../../components/layout/ResponsiveScreen";


const ReportsAndExportsManagement = () => {
    const [menuOptions, setMenuOptions] = useState([]);
   
    // container for different menu options
    const menuButtonMap = [
        {
            permKey: "modules.daybook.reports.view_reports",  
            icon: "", 
            label: "Reports", 
            description: "Create, manage and export reports", 
            onPress: () => router.navigate("/modules/day-book/reports/reports") 
        },
        {
            permKey: "modules.daybook.reports.manage_templates", 
            icon: "", 
            label: "View Templates", 
            description: "View and edit all created templates", 
            onPress: () => router.navigate("/modules/day-book/reports/templates") 
        },
        { 
            permKey: "modules.daybook.reports.manage_exports",
            icon: "", 
            label: "Export Metrics", 
            description: "Export selected metrics as an image", 
            onPress: () => router.navigate("/modules/day-book/reports/metric-selection") 
        },
        { 
            permKey: "modules.daybook.reports.view_exports",
            icon: "", 
            label: "View Exports", 
            description: "View all past exported reports and metrics (up to 1 year prior)", 
            onPress: () => router.navigate("/modules/day-book/reports/exports") 
        },
    ];

    useEffect(() => {
        async function filterButtions() {
            const filteredOptions = [];
            for (const option of menuButtonMap) {
                const allowed = option.permKey ? await hasPermission(option.permKey) : true;
                if (allowed) filteredOptions.push(option);
            }
            setMenuOptions(filteredOptions);
        }

        filterButtions();
    }, []);

    return (
        <ResponsiveScreen
            header={
                <Header title="Reports and Exports" showMenu />
            }
            center={false}
            padded={false}
            scroll={true}
        >        

            <StackLayout spacing={12}>
                {menuOptions.map((item) => (
                    <DescriptiveButton
                        key={item.label}
                        icon={item.icon}
                        label={item.label}
                        description={item.description}
                        onPress={item.onPress}
                    />
                ))}
            </StackLayout>
        </ResponsiveScreen>
    );
};

export default ReportsAndExportsManagement;
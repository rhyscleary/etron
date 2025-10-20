// Author(s): Noah Bradley

import { useState } from "react";
import { DrawerContentScrollView, DrawerItem } from "@react-navigation/drawer";
import { useTheme, Appbar, Icon, Text } from "react-native-paper";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Drawer } from "expo-router/drawer"
import DescriptiveButton from "../../../components/common/buttons/DescriptiveButton";
import { commonStyles } from "../../../assets/styles/stylesheets/common";

const generalOptions = [
    { name: "account-settings", label: "My Account", icon: "account" },
    { name: "collaboration", label: "Collaboration", icon: "account-group" },
    { name: "settings", label: "Workspace and App Settings", icon: "cog" }
]

const dayBookOptions = [
    { name: "modules/day-book/reports", label: "Reports", icon: "file-chart" },
    { name: "modules/day-book/data-management", label: "Data Management", icon: "database" },
    { name: "modules/day-book/metrics", label: "Metrics", icon: "chart-line" },
    { name: "modules/day-book/notifications", label: "Notifications", icon: "bell" },
]

const boardOptions = [
    { name: "dashboard", label: "Dashboard", icon: "view-compact" },
]

const DrawerRow = ({ label, icon, onPress, active = false, style }) => {
    const theme = useTheme();
    const lightBackground = theme.colors.altGM;
    const activeBackground = theme.colors.focusedBackground;
    const onTile = "#000000"

    return (
        <TouchableOpacity
            onPress={onPress}
            style={[
                styles.row,
                { backgroundColor: active ? activeBackground : lightBackground },
                style,
            ]}
            activeOpacity={0.7}
        >
            <Icon source={icon} size={22} color={onTile} />
            <Text style={[styles.rowLabel, { color: onTile }]} numberOfLines={1}>
                {label}
            </Text>
        </TouchableOpacity>
    )
}

const DrawerButton = ({route, options, navigation, isActive }) => {
    return (
        <DrawerItem
            key={route.key}
            label={options.drawerLabel ?? route.name}
            icon={({ size }) => <Icon source={options.drawerIcon ? options.drawerIcon({}).source ?? options.drawerIcon : options.drawerIcon} size={size} color={"#000"} />}
            onPress={() => navigation.navigate(route.name)}
            style={[styles.itemContainer, isActive && styles.itemContainerActive]}
            labelStyle={[styles.itemLabel]}
            focused={isActive}
        />
    );
}

const CustomDrawer = (props) => {
    const { navigation, drawerState, setDrawerState, state, descriptors } = props;
    const theme = useTheme();

    const activeRouteName = state?.routes?.[state.index]?.name;

    let generalRoutes = [];
    let dayBookRoutes = [];
    let boardRoutes = [];
    state.routes.map((route) => {
        if (generalOptions.some(page => page.name == route.name)) generalRoutes.push(route);
        else if (dayBookOptions.some(page => page.name == route.name)) dayBookRoutes.push(route);
        else if (boardOptions.some(page => page.name == route.name)) boardRoutes.push(route);
    })

    let displayedRoutes;
    switch (String(drawerState)) {
        case "day-book":
            displayedRoutes = dayBookRoutes;
            break;
        case "boards":
            displayedRoutes = boardRoutes;
            break;
        default:
            displayedRoutes = []
    }

    return (
        <View style={{ flex: 1 }}>
            <DrawerContentScrollView {...props} contentContainerStyle={{ flexGrow: 1 }}>
                {drawerState == "default" ? (
                    <Appbar.Action icon={"menu-open"} onPress={() => {navigation.closeDrawer()}} />
                ) : (
                    <Appbar.Action icon={"arrow-left-thin"} onPress={() => {setDrawerState("default")}} />
                )}
                {drawerState == "default" ? (
                    <View>
                        <DrawerRow
                            label="Boards"
                            icon="view-dashboard"
                            onPress={() => setDrawerState("boards")}
                            style={{ marginTop: 6 }}
                        />
                        <View style={styles.divider} />
                        <DrawerRow
                            label="Day Book"
                            icon="file-document-multiple"
                            onPress={() => setDrawerState("day-book")}
                            style={{ marginTop: 6}}
                        />
                    </View>
                ) : (
                    displayedRoutes.map((route) => (
                        <DrawerButton
                            key={route.key}
                            route={route}
                            options={descriptors[route.key].options}
                            navigation={navigation}
                            isActive={activeRouteName == route.name}
                            style={{backgroundColor:"#000000"}}
                        />
                    ))
                )}
            </DrawerContentScrollView>
            <View style={styles.bottomSection}>
                <View style={styles.divider} />
                {generalRoutes.map((route) => (
                    <DrawerButton
                        key={route.key}
                        route={route}
                        options={descriptors[route.key].options}
                        navigation={navigation}
                        isActive={activeRouteName == route.name}    
                    />
                ))}
            </View>
        </View>
    );
}

export default function DrawerLayout() {
    const theme = useTheme();
    const [drawerState, setDrawerState] = useState("default");

    return (
        <Drawer
            drawerContent={(props) => (
                <CustomDrawer
                    {...props}
                    drawerState={drawerState}
                    setDrawerState={setDrawerState}
                />
            )}
            screenOptions={{
                headerShown: false,
                drawerType: 'front',
                drawerStyle: {
                    backgroundColor: theme.colors.navigationRailBackground,
                },
                overlayColor: 'transparent',
                sceneContainerStyle: {
                    backgroundColor: theme.colors.background,
                }
            }}
        >
            {boardOptions.map(({ name, label, icon }) =>
                <Drawer.Screen
                    key={name}
                    name={name}
                    options={{
                        drawerLabel: label,
                        drawerIcon: ({ size }) => (
                            <Icon source={icon} color="#000" size={size} />
                        ),
                    }}
                />
            )}

            {dayBookOptions.map(({ name, label, icon }) => (
                <Drawer.Screen
                    key={name}
                    name={name}
                    options={{
                        drawerLabel: label,
                        drawerIcon: ({ size }) => (
                            <Icon source={icon} color="#000" size={size} />
                        ),
                    }}
                />
            ))}

            {generalOptions.map(({ name, label, icon }) => (
                <Drawer.Screen
                    key={name}
                    name={name}
                    options={{
                        drawerLabel: label,
                        drawerIcon: ({ size }) => (
                            <Icon source={icon} color="#000" size={size} />
                        )
                    }}
                />
            ))}
        </Drawer>
    );
}

const styles = StyleSheet.create({
    // DrawerItem container
    itemContainer: {
        marginHorizontal: 10,
        marginVertical: 6,
        borderRadius: 10,
        backgroundColor: "#FFFFFF"
    },
    itemContainerActive: {
        backgroundColor: "#E0E0E0"
    },
    itemLabel: {
        color: "#000",
        fontSize: 16,
    },

    // Rows meant to look like drawer buttons
    row: {
        marginHorizontal: 10,
        marginVertical: 6,
        borderRadius: 10,
        paddingHorizontal: 16,
        paddingVertical: 16,
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    rowLabel: {
        fontSize: 16,
    },

    bottomSection: {
        paddingBottom: 30,
        marginHorizontal: 14
    },
    divider: {
        alignSelf: "center",
        width: "90%",
        borderTopWidth: 1,
        borderTopColor: "#FFFFFF",
        marginTop: 8,
        marginBottom: 4,
        opacity: 0.6,
    },
});
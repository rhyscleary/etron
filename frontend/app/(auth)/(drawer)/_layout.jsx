// Author(s): Noah Bradley

import { useState } from "react";
import { DrawerContentScrollView, DrawerItem } from "@react-navigation/drawer";
import { useTheme, Appbar, Icon } from "react-native-paper";
import { View, StyleSheet } from "react-native";
import { Drawer } from "expo-router/drawer"
import DescriptiveButton from "../../../components/common/buttons/DescriptiveButton";

const generalOptions = [
    { name: "settings-account", label: "Account", icon: "account" },
    { name: "collaboration", label: "Collaboration", icon: "account-group" },
    { name: "settings", label: "Settings", icon: "cog" }
]

const dayBookOptions = [
    { name: "modules/day-book/reports", label: "Reports", icon: "file-chart" },
    { name: "modules/day-book/data-management", label: "Data Management", icon: "database" },
    { name: "modules/day-book/metrics", label: "Metrics", icon: "chart-line" },
    { name: "modules/day-book/notifications", label: "Notifications", icon: "bell" },
]

const boardOptions = [
    { name: "dashboard", label: "Dashboard", icon: "view-dashboard" },
]

const DrawerButton = ({route, options, navigation}) => {
    const { name, key } = route;
    const label = options.drawerLabel ?? name;
    const icon = options.drawerIcon;

    return (
        <DrawerItem
            key={key}
            label={label}
            icon={icon}
            onPress={() => navigation.navigate(name)}
        />
    );
}

const CustomDrawer = (props) => {
    const { navigation, drawerState, setDrawerState, state, descriptors } = props;

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
                        <DescriptiveButton
                            label="Boards"
                            icon="view-dashboard"
                            onPress={() => setDrawerState("boards")}
                            transparentBackground
                            altText
                            showChevron={false}
                        />
                        <View style={styles.divider} />
                        <DescriptiveButton
                            label="Day Book"
                            icon="calendar"
                            onPress={() => setDrawerState("day-book")}
                            transparentBackground
                            altText
                            showChevron={false}
                        />
                    </View>
                ) : (
                    displayedRoutes.map((route) => (
                        <DrawerButton key={route.key} route={route} options={descriptors[route.key].options} navigation={navigation} />
                    ))
                )}
            </DrawerContentScrollView>
            <View style={styles.bottomSection}>
                <View style={styles.divider} />
                {generalRoutes.map((route) => (
                    <DrawerButton key={route.key} route={route} options={descriptors[route.key].options} navigation={navigation} />
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
                <CustomDrawer {...props} drawerState={drawerState} setDrawerState={setDrawerState} />
            )}
            screenOptions={{
                headerShown: false,
                drawerType: 'front',
                drawerStyle: {
                    backgroundColor: '#1D4364',
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
                        drawerIcon: ({ color, size }) => (
                            <Icon source={icon} color={color} size={size} />
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
                        drawerIcon: ({ color, size }) => (
                            <Icon source={icon} color={color} size={size} />
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
                        drawerIcon: ({ color, size }) => (
                            <Icon source={icon} color={color} size={size} />
                        )
                    }}
                />
            ))}
        </Drawer>
    );
}

const styles = StyleSheet.create({
    bottomSection: {
        paddingBottom: 30,
    },
    divider: {
        alignSelf: 'center',
        width: '90%',
        borderTopWidth: 1,
        borderTopColor: '#FFFFFF'
    },
});
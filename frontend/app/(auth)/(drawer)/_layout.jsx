import { useState } from "react";
import { DrawerContentScrollView, DrawerItemList } from "@react-navigation/drawer";
import { useTheme, Appbar, Icon } from "react-native-paper";
import { View, StyleSheet } from "react-native";
import { Drawer } from "expo-router/drawer"
import BasicButton from "../../../components/common/buttons/BasicButton";

//const Drawer = createDrawerNavigator();

const CustomDrawer = (props) => {
    const { navigation, drawerState, setDrawerState } = props;

    return (
        <DrawerContentScrollView {...props}>
            <Appbar.Action
                icon={drawerState == "default"
                    ? "menu-open"
                    : "arrow-left-thin"
                }
                onPress={() => {
                    drawerState == "default"
                    ? navigation.closeDrawer()
                    : setDrawerState("default")
                }}
            />
                {drawerState == "default" ? (
                    <View>
                        <BasicButton
                            label="Boards"
                            onPress={() => setDrawerState("boards")}
                        />
                        <BasicButton
                            label="Day Book"
                            onPress={() => setDrawerState("day-book")}
                        />
                    </View>
                ) : (
                    <BasicButton label="Back" onPress={() => setDrawerState("default")} />
                )}            
            <DrawerItemList {...props} />
        </DrawerContentScrollView>
    );
}

function DrawerButton({ route, name, icon }) {
    return (
        <Drawer.Screen
            name={route}
            options={{
                drawerLabel: name,
                drawerIcon: ({ color, size }) => (
                    <Icon source={icon} color={color} size={size} />
                )
            }}
        />
    );
}

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
            <Drawer.Screen
                name={"dashboard"}
                options={{
                    drawerLabel: "Dashboard",
                    drawerIcon: ({ color, size }) => (
                        <Icon source={"view-dashboard"} color={color} size={size} />
                    ),
                    drawerItemStyle: { display: drawerState == "boards" ? "flex" : "none"}
                }}
            />

            {dayBookOptions.map(({ name, label, icon }) => (
                <Drawer.Screen
                    key={name}
                    name={name}
                    options={{
                        drawerLabel: label,
                        drawerIcon: ({ color, size }) => (
                            <Icon source={icon} color={color} size={size} />
                        ),
                        drawerItemStyle: { display: drawerState == "day-book" ? "flex" : "none"}
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
  container: {
    paddingBottom: 12,
    flexGrow: 1,
  },
  topButtons: {
    paddingHorizontal: 12,
    gap: 8,
    marginTop: 8,
    marginBottom: 8,
  },
  bottomBlock: {
    marginTop: "auto",
    paddingTop: 8,
    paddingHorizontal: 0,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#FFFFFF",
    marginHorizontal: 12,
    marginBottom: 8,
  },
});
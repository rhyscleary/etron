import { createDrawerNavigator, DrawerContentScrollView, DrawerItemList } from "@react-navigation/drawer";
import { useTheme, Appbar, Icon } from "react-native-paper";
import { Drawer } from "expo-router/drawer"
import { useNavigationState } from "@react-navigation/native";

//const Drawer = createDrawerNavigator();

const CustomDrawer = (props) => {
    const { navigation } = props;

    return (
        <DrawerContentScrollView {...props}>
            <Appbar.Action icon="arrow-left" onPress={() => navigation.closeDrawer()} />
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

const screens = [
    { name: "dashboard", label: "Dashboard", icon: "view-dashboard" },
    { name: "modules/day-book/reports", label: "Reports", icon: "file-chart" },
    { name: "modules/day-book/data-management", label: "Data Management", icon: "database" },
    { name: "modules/day-book/metrics", label: "Metrics", icon: "chart-line" },
    { name: "modules/day-book/notifications", label: "Notifications", icon: "bell" },
    { name: "collaboration", label: "Collaboration", icon: "account-group" },
    { name: "settings", label: "Settings", icon: "cog" }
]

export default function DrawerLayout() {
    const theme = useTheme();

    return (
        <Drawer
            drawerContent={CustomDrawer}
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
            {screens.map(({ name, label, icon }) => (
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
/*import React from "react";
import { createDrawerNavigator, DrawerContentScrollView, DrawerItemList } from "@react-navigation/drawer";
import { Slot } from "expo-router";
import { Divider, Text, useTheme, Appbar } from "react-native-paper";
import { View } from "react-native";
import { Drawer } from "expo-router/drawer"
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useNavigation, DrawerActions } from "@react-navigation/native";

//const Drawer = createDrawerNavigator();

const CustomDrawer = (props) => {
    const { navigation } = props;

    return (
        <DrawerContentScrollView {...props}>
            <Appbar.Action icon="close" onPress={() => navigation.closeDrawer()} />
            <DrawerItemList {...props} />
        </DrawerContentScrollView>
    );
}

export default function DrawerLayout() {
    const theme = useTheme();

    return (
        <Drawer
            drawerContent={CustomDrawer}
            screenOptions={{
                headerShown: false,
                drawerType: 'front',
                drawerHideStatusBarOnOpen: true,
                drawerStyle: {
                    backgroundColor: '#1D4364',
                },
                overlayColor: 'transparent',
                sceneContainerStyle: {
                    backgroundColor: theme.colors.background,
                }
            }}
        >

            <Drawer.Screen name="dashboard" />

            <Drawer.Screen 
                name="collaboration/collaboration"
                options={{
                    drawerLabel: "Collaboration",
                    title: "test"
                }} 
            />

            <Drawer.Screen 
                name="account-settings"
                options={{
                    drawerLabel: "Account",
                
                }} 
            />

            <Drawer.Screen 
                name="settings/settings"
                options={{
                    drawerLabel: "Settings",

                }} 
            />

        </Drawer>
    );
}*/
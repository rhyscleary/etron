import React from "react";
import { createDrawerNavigator, DrawerContentScrollView, DrawerItemList } from "@react-navigation/drawer";
import { Slot } from "expo-router";
import { Divider, Text, useTheme } from "react-native-paper";
import { View } from "react-native";
import { Drawer } from "expo-router/drawer"
import { GestureHandlerRootView } from "react-native-gesture-handler";

//const Drawer = createDrawerNavigator();

function CustomDrawer(props) {
    return (
        <DrawerContentScrollView {...props}>
            <View>
                <Text>Hello</Text>
            </View>
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
        

            <Drawer.Screen name="profile" />


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
}

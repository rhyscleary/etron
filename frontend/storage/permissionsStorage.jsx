// Author(s): Noah Bradley

import AsyncStorage from "@react-native-async-storage/async-storage"

const permissionsKey = "permissions";

export async function savePermissions(permissions) {
    try {
        const value = JSON.stringify(permissions);
        await AsyncStorage.setItem(permissionsKey, value);
    } catch (error) {
        console.log("Error saving permissions: ", error);
    }
}

export async function getPermissions() {
    try {
        const value = await AsyncStorage.getItem(permissionsKey);
        return value != null ? JSON.parse(value) : null;
    } catch (error) {
        console.log("Error retrieving permissions: ", error);
        return null;
    }
}
// Author(s): Noah Bradley

import AsyncStorage from "@react-native-async-storage/async-storage"

const roleKey = "role";

export async function saveRole(role) {
    try {
        const roleValue = JSON.stringify(role);
        await AsyncStorage.setItem(roleKey, roleValue);
    } catch (error) {
        console.error("Error saving role: ", error);
    }
}

export async function getRole() {
    try {
        const roleValue = await AsyncStorage.getItem(roleKey);
        return roleValue != null ? JSON.parse(roleValue) : null;
    } catch (error) {
        console.error("Error retrieving role:", error);
        return null;
    }
}

export async function getPermissions() {
    try {
        const roleValue = await AsyncStorage.getItem(roleKey);
        return roleValue != null ? JSON.parse(roleValue).permissions : null;
    } catch (error) {
        console.error("Error retrieving permissions:", error);
    }
}

export async function isOwnerRole() {
    try {
        const roleValue = await AsyncStorage.getItem(roleKey);
        if (!roleValue) return false;

        const role = JSON.parse(roleValue);
        return !!role.owner;
    } catch (error) {
        console.error("Error checking role for owner:", error);
        return false;
    }
}
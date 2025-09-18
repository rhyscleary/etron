// Author(s): Noah Bradley

import AsyncStorage from "@react-native-async-storage/async-storage"

const userKey = "userInfo";

export async function saveUserInfo(user) {
    try {
        const userInfo = JSON.stringify(user);
        await AsyncStorage.setItem(userKey, userInfo);
    } catch (error) {
        console.log("Error saving user info: ", error);
    }
}

export async function getUserInfo() {
    try {
        const value = await AsyncStorage.getItem(userKey);
        return value != null ? JSON.parse(value) : null;
    } catch (error) {
        console.log("Error retrieving user info: ", error);
        return null;
    }
}

export async function getUserType() {
    try {
        const user = await getUserInfo();
        if (user && user.type) return user.type
        return null;
    } catch (error) {
        console.error("Error fetching user type from local storage:", error);
        return null;
    }
}
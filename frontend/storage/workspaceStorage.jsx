// Author(s): Rhys Cleary

import AsyncStorage from "@react-native-async-storage/async-storage"

// store workspace information: workspaceId, name, location, description, createdAt, UpdatedAt
const workspaceKey = "workspaceInfo";

export async function saveWorkspaceInfo(workspace) {
    try {
        const value = JSON.stringify(workspace);
        await AsyncStorage.setItem(workspaceKey, value);
    } catch (error) {
        console.log("Error saving workspace information: ", error);
    }
}

export async function getWorkspaceInfo() {
    try {
        const value = await AsyncStorage.getItem(workspaceKey);
        return value != null ? JSON.parse(value) : null;
    } catch (error) {
        console.log("Error occured retrieving workspace information: ", error);
        return null;
    }
}

export async function removeWorkspaceInfo() {
    try {
        await AsyncStorage.removeItem(workspaceKey);
    } catch (error) {
        console.log("Error occured removing workspace information: ", error);
    }
}

// get values from the information stored
export async function getWorkspaceId() {
    try {
        const workspace = await getWorkspaceInfo();
        if (workspace && workspace.workspaceId) {
            return workspace.workspaceId;
        }
        return null;
    } catch (error) {
        console.error("Error fetching workspaceId from local storage:", error);
        return null;
    }
}

// TESTING
/*export async function saveTestWorkspaceInfo() {
    const workspaceData = {
        id: "e676164b-7447-4d39-9118-babb5c97fbb3",
        name: "InSync",
        description: "hello this is a workspace",
        location: "Sydney"
    };

    saveWorkspaceInfo(workspaceData);
}*/


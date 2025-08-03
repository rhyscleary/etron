import { Button, Pressable, View } from "react-native";
import Header from "../../../../components/layout/Header";
import { commonStyles } from "../../../../assets/styles/stylesheets/common";
import { Link, router } from "expo-router";
import { Text, TextInput } from "react-native-paper";
import { apiDelete, apiGet, apiPost, apiPut } from "../../../../utils/api/apiClient";
import { useState } from "react";
import { getWorkspaceId } from "../../../../storage/workspaceStorage";
import { useEffect } from "react";
import endpoints from "../../../../utils/api/endpoints";

const CollabEndpoints = () => {
    const [workspaceId, setWorkspaceId] = useState(null);
    const email = "rhysjcleary@gmail.com";
    const [inviteId, setInviteId] = useState("");
    const [roleId, setRoleId] = useState("");
    const [userId, setUserId] = useState("");

    useEffect(() => {
        async function loadWorkspaceId() {
            const workspaceId = await getWorkspaceId();
            setWorkspaceId(workspaceId);
        }
        loadWorkspaceId();
    }, []);

    // Type of user: owner (cannot be set on the frontend), manager, employee
    // Role can be anything

    // Default permissions
    async function getDefaultPermissions() {
        try {
            const result = await apiGet(
                endpoints.workspace.core.getDefaultPermissions
            );

            console.log(result);

        } catch (error) {
            console.log(error);
        }
    }

    // INVITES

    async function inviteUser() {
        try {
            const data = {
                email: "haw402@uowmail.edu.au",
                type: "manager",
                roleId: "tv"
            }

            const result = await apiPost(
                endpoints.workspace.invites.create(workspaceId),
                data
            );

            console.log(result);
            setInviteId(result.inviteId);

        } catch (error) {
            console.log(error);
        }
    }

    async function cancelInvite() {
        try {
            const result = await apiDelete(
                endpoints.workspace.invites.cancelInvite(workspaceId, inviteId)
            );

            console.log(result);

        } catch (error) {
            console.log(error);
        }
    }

    async function getSentInvites() {
        try {
            const result = await apiGet(
               endpoints.workspace.invites.getInvitesSent(workspaceId)
            );

            console.log(result);

        } catch (error) {
            console.log(error);
        }
    }

    // needs to be fixed up in the backend
    /*async function getUserInvites() {
        try {
            const result = await apiGet(
                `https://nlt5sop5q9.execute-api.ap-southeast-2.amazonaws.com/Prod/user/${email}/invites`
            );

            console.log(result);

        } catch (error) {
            console.log(error);
        }
    }*/

    // ROLES

    async function createRole() {
        try {
            const data = {
                name: "Human Resources",
                permissions: []
            }

            const result = await apiPost(
                endpoints.workspace.roles.create(workspaceId),
                data
            );

            console.log(result);
            setRoleId(result.roleId);

        } catch (error) {
            console.log(error);
        }
    }

    async function updateRole() {
        try {
            const data = {
                name: "Developers",
                permissions: ["view_users"]
            }

            const result = await apiPut(
                endpoints.workspace.roles.update(workspaceId, roleId),
                data
            );

            console.log(result);

        } catch (error) {
            console.log(error);
        }
    }

    async function deleteRole() {
        try {
            const result = await apiDelete(
                endpoints.workspace.roles.delete(workspaceId, roleId)
            );

            console.log(result);

        } catch (error) {
            console.log(error);
        }
    }

    async function getRole() {
        try {
            const result = await apiGet(
                endpoints.workspace.roles.getRole(workspaceId, roleId)
            );

            console.log(result);

        } catch (error) {
            console.log(error);
        }
    }

    async function getRoles() {
        try {
            const result = await apiGet(
                endpoints.workspace.roles.getRoles(workspaceId)
            );

            console.log(result);

        } catch (error) {
            console.log(error);
        }
    }


    // USERS
    async function addUser() {
        try {
            console.log(inviteId);
            const result = await apiPost(
                endpoints.workspace.users.add(workspaceId, inviteId)
            );

            console.log(result);
            setUserId(result.userId);
        } catch (error) {
            console.log(error);
        }
    }

    async function getUser() {
        try {
            const result = await apiGet(
                endpoints.workspace.users.getUser(workspaceId, userId)
            );

            console.log(result);

        } catch (error) {
            console.log(error);
        }
    }

    async function getAllUsers() {
        try {
            const result = await apiGet(
                endpoints.workspace.users.getUsers(workspaceId)
            );

            console.log(result);

        } catch (error) {
            console.log(error);
        }
    }

    async function removeUser() {
        try {
            const result = await apiDelete(
                endpoints.workspace.users.remove(workspaceId, userId)
            );

            console.log(result);

        } catch (error) {
            console.log(error);
        }
    }

    async function updateUser() {
        try {
            const data = {
                type: "employee",
                roleId: "Cleaner"
            }

            const result = await apiPut(
                endpoints.workspace.users.update(workspaceId, userId),
                data
            );

            console.log(result);

        } catch (error) {
            console.log(error);
        }
    }

    // MODULES

    async function getInstalledModules() {
        try {
            
            const result = await apiGet(
                endpoints.workspace.modules.getInstalledModules(workspaceId),
            );

            console.log(result);

        } catch (error) {
            console.log(error);
        }
    }

    async function getUninstalledModules() {
        try {
            
            const result = await apiGet(
                endpoints.workspace.modules.getUninstalledModules(workspaceId),
            );

            console.log(result);

        } catch (error) {
            console.log(error);
        }
    }

    return (
        <View style={commonStyles.screen}>
            <Header title="Endpoints" showBack />

            <View>
                <Button title="Default perms" onPress={(getDefaultPermissions)}/>
            </View>

            <Text>Invites</Text>

            <View>
                <Button title="Invite user" onPress={(inviteUser)}/>
            </View>

            <View>
                <Button title="Cancel invite" onPress={(cancelInvite)}/>
            </View>

            <View>
                <Button title="Get sent invites" onPress={(getSentInvites)}/>
            </View>

            <View>
                <Button title="Get invites for email" /> {/*Will be used in Join Workspace page*/}
            </View>

            <Text>Roles</Text>

            <View>
                <Button title="Create role" onPress={(createRole)}/>
            </View>

            <View>
                <Button title="Update role" onPress={(updateRole)}/>
            </View>

            <View>
                <Button title="Delete role" onPress={(deleteRole)}/>
            </View>

            <View>
                <Button title="Get role with roleId in workspace" onPress={(getRole)}/>
            </View>

            <View>
                <Button title="Get roles in workspace" onPress={(getRoles)}/>
            </View>

            <Text>Users</Text>

            <View>
                <Button title="Add user" onPress={(addUser)}/> {/*Will be used in Join Workspace page*/}
            </View>

            <View>
                <Button title="Get User" onPress={(getUser)}/>
            </View>

            <View>
                <Button title="Get all users in a workspace" onPress={(getAllUsers)}/>
            </View>

            <View>
                <Button title="Remove user from workspace" onPress={(removeUser)}/>
            </View>

            <View>
                <Button title="Update user info (role and type)" onPress={(updateUser)}/>
            </View>

            <Text>Modules</Text>

            <View>
                <Button title="Get Installed Modules" onPress={(getInstalledModules)}/>
            </View>

            <View>
                <Button title="Get Uninstalled Modules" onPress={(getUninstalledModules)}/>
            </View>
        </View>
    )
}

export default CollabEndpoints;
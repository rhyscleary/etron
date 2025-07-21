import { Button, Pressable, View } from "react-native";
import Header from "../../../../components/layout/Header";
import { commonStyles } from "../../../../assets/styles/stylesheets/common";
import { Link, router } from "expo-router";
import { Text, TextInput } from "react-native-paper";
import { apiDelete, apiGet, apiPost } from "../../../../utils/api/apiClient";
import { useState } from "react";
import { getWorkspaceId } from "../../../../storage/workspaceStorage";
import { useEffect } from "react";

const CollabEndpoints = () => {
    const [workspaceId, setWorkspaceId] = useState(null);
    const email = "rhysjcleary@gmail.com"
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

    // INVITES

    async function inviteUser() {
        try {
            const data = {
                email: "rhysjcleary@gmail.com",
                type: "manager",
                role: "tv"
            }

            const result = await apiPost(
                `https://t8mhrt9a61.execute-api.ap-southeast-2.amazonaws.com/Prod/workspace/${workspaceId}/invites/create`,
                data
            );

            console.log(result);
            setInviteId(result.invite);

        } catch (error) {
            console.log(error);
        }
    }

    async function cancelInvite() {
        try {
            const result = await apiDelete(
                `https://t8mhrt9a61.execute-api.ap-southeast-2.amazonaws.com/Prod/workspace/${workspaceId}/invites/cancel/${email}`
            );

            console.log(result);

        } catch (error) {
            console.log(error);
        }
    }

    async function getSentInvites() {
        try {
            const result = await apiGet(
               `https://t8mhrt9a61.execute-api.ap-southeast-2.amazonaws.com/Prod/workspace/${workspaceId}/invites`
            );

            console.log(result);

        } catch (error) {
            console.log(error);
        }
    }

    async function getUserInvites() {
        try {
            const result = await apiGet(
                `https://nlt5sop5q9.execute-api.ap-southeast-2.amazonaws.com/Prod/user/${email}/invites`
            );

            console.log(result);

        } catch (error) {
            console.log(error);
        }
    }

    // ROLES

    async function createRole() {
        try {
            const data = {
                name: "Human Resources",
                permissions: {}
            }

            const result = await apiPost(
                `https://t8mhrt9a61.execute-api.ap-southeast-2.amazonaws.com/Prod/workspace/${workspaceId}/roles/create`,
                data
            );

            console.log(result);
            setRoleId(result.roleId);

        } catch (error) {
            console.log(error);
        }
    }

    async function deleteRole() {
        try {
            const result = await apiDelete(
                `https://t8mhrt9a61.execute-api.ap-southeast-2.amazonaws.com/Prod/workspace/${workspaceId}/roles/remove/${roleId}`
            );

            console.log(result);

        } catch (error) {
            console.log(error);
        }
    }

    async function getRoles() {
        try {
            const result = await apiGet(
                `https://t8mhrt9a61.execute-api.ap-southeast-2.amazonaws.com/Prod/workspace/${workspaceId}/roles`
            );

            console.log(result);

        } catch (error) {
            console.log(error);
        }
    }


    // USERS
    async function addUser() {
        try {
            const result = await apiPost(
                `https://t8mhrt9a61.execute-api.ap-southeast-2.amazonaws.com/Prod/workspace/${workspaceId}/users/add/${inviteId}`,
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
                `https://t8mhrt9a61.execute-api.ap-southeast-2.amazonaws.com/Prod/workspace/${workspaceId}/users/${userId}`
            );

            console.log(result);

        } catch (error) {
            console.log(error);
        }
    }

    async function getAllUsers() {
        try {
            const result = await apiGet(
                `https://t8mhrt9a61.execute-api.ap-southeast-2.amazonaws.com/Prod/workspace/${workspaceId}/users`
            );

            console.log(result);

        } catch (error) {
            console.log(error);
        }
    }

    async function removeUser() {
        try {
            const result = await apiDelete(
                `https://t8mhrt9a61.execute-api.ap-southeast-2.amazonaws.com/Prod/workspace/${workspaceId}/users/remove/${userId}`
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
                role: "Cleaner"
            }

            const result = await apiPost(
                `https://t8mhrt9a61.execute-api.ap-southeast-2.amazonaws.com/Prod/workspace/${workspaceId}/users/update/${userId}`,
                data
            );

            console.log(result);

        } catch (error) {
            console.log(error);
        }
    }

    return (
        <View style={commonStyles.screen}>
            <Header title="Endpoints" showBack />

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
                <Button title="Get invites for email" onPress={(getUserInvites)}/> {/*Will be used in Join Workspace page*/}
            </View>

            <Text>Roles</Text>

            <View>
                <Button title="Create role" onPress={(createRole)}/>
            </View>

            <View>
                <Button title="Delete role" onPress={(deleteRole)}/>
            </View>

            <View>
                <Button title="Get roles in workspace" onPress={(getRoles)}/>
            </View>

            {/*Todo: update role*/}

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
        </View>
    )
}

export default CollabEndpoints;
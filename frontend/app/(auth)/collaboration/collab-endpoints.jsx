import { Button, Pressable, View } from "react-native";
import Header from "../../../components/layout/Header";
import { commonStyles } from "../../../assets/styles/stylesheets/common";
import { Link, router } from "expo-router";
import { Text, TextInput } from "react-native-paper";
import { apiDelete, apiGet, apiPost } from "../../../utils/api";

const CollabEndpoints = () => {
    const workspaceId = "e676164b-7447-4d39-9118-babb5c97fbb3";
    const email = "rhysjcleary@gmail.com"

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
                `https://t8mhrt9a61.execute-api.ap-southeast-2.amazonaws.com/Prod/workspace/${workspaceId}/users`
            );

            console.log(result);

        } catch (error) {
            console.log(error);
        }
    }


    // USERS


    return (
        <View style={commonStyles.screen}>
            <Header title="Endpoints" showBack />

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
                <Button title="Get invites for email" onPress={(getUserInvites)}/>
            </View>
        </View>
    )
}

export default CollabEndpoints;
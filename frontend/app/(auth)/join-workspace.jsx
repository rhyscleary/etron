// Author(s): Rhys Cleary

import { ActivityIndicator, FlatList, StyleSheet, View } from "react-native";
import { PaperProvider, Text } from 'react-native-paper';
import Header from "../../components/layout/Header";
import { commonStyles } from "../../assets/styles/stylesheets/common";
import { useEffect, useState } from "react";
import InviteCard from "../../components/cards/inviteCard";
import BasicButton from "../../components/common/buttons/BasicButton";
import { apiGet, apiPost, apiPut } from "../../utils/api/apiClient";
import endpoints from "../../utils/api/endpoints";
import { fetchUserAttributes, getCurrentUser, updateUserAttribute } from "aws-amplify/auth";
import formatTTLDate from "../../utils/format/formatTTLDate";
import { saveWorkspaceInfo } from "../../storage/workspaceStorage";
import { router } from "expo-router";

const JoinWorkspace = () => {
    const [loading, setLoading] = useState(false);
    const [invites, setInvites] = useState([]);
    const [selectedInvite, setSelectedInvite] = useState(null);
    const [joining, setJoining] = useState(false);


    useEffect(() => {
        async function loadInvites() {
            setLoading(true);
            try {
                const userAttributes = await fetchUserAttributes();
                console.log(userAttributes);
                const email = userAttributes.email;
                console.log(email);

                const inviteResult = await apiGet(
                    endpoints.user.invites.getUserInvites,
                    { email }
                );
                console.log(inviteResult);
                if (inviteResult && inviteResult.length > 0) {
                    const processedInvites = await Promise.all(inviteResult.map(async invite => {
                        const expireAt = formatTTLDate(invite.expireAt);
                        console.log(invite.workspaceId);
                        const workspace = await apiGet(
                            endpoints.workspace.core.getWorkspace(invite.workspaceId)
                        );

                        return {
                            ...invite,
                            expireAt,
                            workspaceName: workspace.name,
                            workspaceDescription: workspace.description
                        };
                    }));

                    setInvites(processedInvites);
                }
            } catch (error) {
                console.log("Error loading workspace invites:", error);
            }
            setLoading(false);
        }
        loadInvites();
    }, []);

    // updates user attributes in cognito
    async function handleUpdateUserAttribute(attributeKey, value) {
        try {
            const output = await updateUserAttribute({
                userAttribute: {
                    attributeKey,
                    value
                }
            });

            const { nextStep } = output;

            switch (nextStep.updateAttributeStep) {
                case 'CONFIRM_ATTRIBUTE_WITH_CODE':
                    const codeDeliveryDetails = nextStep.codeDeliveryDetails;
                    console.log(`Confirmation code was sent to ${codeDeliveryDetails?.deliveryMedium} at ${codeDeliveryDetails?.destination}`);
                    return { needsConfirmation: true };
                case 'DONE':
                    const fieldName = attributeKey.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
                    console.log(`${fieldName} updated successfully`);
                    return { needsConfirmation: false };
                default:
                    console.log(`${attributeKey.replace('_', ' ')} update completed`);
                    return { needsConfirmation: false };
            }
        } catch (error) {
            console.log("Error updating user attribute:", error);
            const fieldName = attributeKey.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
            setMessage(`Error updating ${fieldName}: ${error.message}`);
            return { needsConfirmation: false, error: true };
        }
    }

    const renderInvites = ({item}) => (
        <InviteCard 
            invite={item}
            selected={selectedInvite?.inviteId === item.inviteId}
            onSelect={setSelectedInvite}
        />
    );

    async function handleJoin() {
        setJoining(true);

        try {
            const workspaceId = selectedInvite.workspaceId;
            const inviteId = selectedInvite.inviteId;

            const payload = {
                inviteId
            }

            // try adding user to the workspace
            await apiPost(
                endpoints.workspace.users.add(workspaceId),
                payload
            )

            // if successful store workspace info
            const workspace = await apiGet(
                endpoints.workspace.core.getWorkspace(workspaceId)
            )

            // save workspace info to local storage
            saveWorkspaceInfo(workspace);

            // update user attribute to be in a workspace
            await handleUpdateUserAttribute('custom:has_workspace', "true");

            console.log('Join response:', workspace);
            setJoining(false);


            // navigate to the profile
            router.navigate("/profile");
        } catch (error) {
            setJoining(false);
            console.log("Error joining workspace: ", error);
        }
    }

    return (
        <View style={commonStyles.screen}>
            <Header title="Join Workspace" showBack />

            <Text style={{ fontSize: 16, marginBottom: 12 }}>
              You have the following options:
            </Text>

            <View style={styles.contentContainer}>
                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" />
                        <Text>Loading invites...</Text>
                    </View>
                ) : invites.length === 0 ? (
                    <View style={styles.noInvitesContainer}>
                        <Text style={{ fontSize: 16, textAlign: "center"}}>
                            You currently have no pending invites.
                        </Text>
                    </View>
                ): (
                    <FlatList
                        data={invites}
                        renderItem={renderInvites}
                        keyExtractor={item => item.inviteId}
                        ItemSeparatorComponent={() => <View style={{height: 12}} />}
                        ListFooterComponent={() => (
                            <View style={commonStyles.inlineButtonContainer}>
                                <BasicButton 
                                    label={joining ? "Joining..." : "Join"} 
                                    onPress={handleJoin}
                                    disabled={joining} 
                                />
                            </View>
                        )}
                    />
                )}

            </View>
        </View>
    )

}

const styles = StyleSheet.create({
    contentContainer: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center"
    },
    noInvitesContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center"
    }
})

export default JoinWorkspace;
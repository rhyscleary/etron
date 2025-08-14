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

const JoinWorkspace = () => {
    const [loading, setLoading] = useState(false);
    const [invites, setInvites] = useState([]);
    const [selectedInvite, setSelectedInvite] = useState(null);
    const [joining, setJoining] = useState(false);


    useEffect(() => {
        async function loadInvites() {
            setLoading(true);
            try {
                const invites = await apiGet(
                    endpoints.user.invites.getUserInvites
                )
                if (invites) {
                    setInvites(invites);
                }
            } catch (error) {
                console.log("Error loading workspace invites ", error);
            }
            setLoading(false);
        }
        loadInvites();
    }, []);

    const renderInvites = ({item}) => (
        <InviteCard 
            invite={item}
            onSelect={setSelectedInvite}
        />
    );

    async function handleJoin() {
        setJoining(true);

        try {

            // try adding user to the workspace
            await apiPost(
                endpoints.workspace.users.add(selectedInvite.workspaceId, selectedInvite.inviteId)
            )

            // if successful store workspace info
            const workspace = await apiGet(
                endpoints.workspace.core.getWorkspace(workspaceId)
            )

            // save workspace info to local storage
            saveWorkspaceInfo(workspace);

            console.log('Join response:', workspace);
            setJoining(false);


            // navigate to the profile
            router.push("/profile");
        } catch (error) {
            setJoining(false);
            console.log("Error joining workspace: ", error);
        }
    }

    return (
        <View style={commonStyles.screen}>
            <Header title="Join Workspace" showBack />

            <Text style={{ fontSize: 16 }}>
              You have the following options:
            </Text>

            <View style={styles.contentContainer}>
                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" />
                    </View>
                ) : invites.length === 0 ? (
                    <View styles={styles.noInvitesContainer}>
                        <Text style={{ fontSize: 16, textAlign: "center"}}>
                            You currently have no workspace invites.
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
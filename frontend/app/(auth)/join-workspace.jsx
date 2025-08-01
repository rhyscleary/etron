import { ActivityIndicator, FlatList, StyleSheet, View } from "react-native";
import { PaperProvider, Text } from 'react-native-paper';
import Header from "../../components/layout/Header";
import { commonStyles } from "../../assets/styles/stylesheets/common";
import { useEffect, useState } from "react";
import InviteCard from "../../components/cards/inviteCard";

const JoinWorkspace = () => {
    const [loading, setLoading] = useState(false);
    const [invites, setInvites] = useState([]);
    const [selectedInvite, setSelectedInvite] = useState(null);

    useEffect(() => {
        async function loadInvites() {
            setLoading(true);
            try {
                const invites = await getWorkspaceInfo();
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
                ) : (
                    <FlatList
                        data={invites}
                        renderItem={renderInvites}
                        keyExtractor={item => item.inviteId}
                        ItemSeparatorComponent={() => <View style={{height: 12}} />}
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
    }
})

export default JoinWorkspace;
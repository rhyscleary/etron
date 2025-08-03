import React, { useEffect, useState } from "react";
import { View, FlatList, Pressable, StyleSheet } from "react-native";
import { Text } from "react-native-paper";
import { router } from "expo-router";

import Header from "../../../../components/layout/Header";
import { commonStyles } from "../../../../assets/styles/stylesheets/common";
import { apiGet } from "../../../../utils/api/apiClient";
import endpoints from "../../../../utils/api/endpoints";
import { getWorkspaceId } from "../../../../storage/workspaceStorage";

const Invites = () => {
  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [workspaceId, setWorkspaceId] = useState(null);

  useEffect(() => {
    const fetchWorkspaceIdAndInvites = async () => {
      try {
        const id = await getWorkspaceId();
        setWorkspaceId(id);

        const result = await apiGet(
          endpoints.workspace.invites.getInvitesSent(id)
        );

        console.log("Invites:", result);
        setInvites(Array.isArray(result) ? result : []);
      } catch (error) {
        console.error("Failed to fetch invites:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkspaceIdAndInvites();
  }, []);

  const renderInviteItem = ({ item }) => (
    <Pressable
      onPress={() => router.push(`/collaboration/edit-invite/${item.inviteId}`)} // ✅ Fixed route
      style={styles.inviteBox}
    >
      <Text>Email: {item.email}</Text>
      <Text>Type: {item.type}</Text>
      <Text>Status: {item.status}</Text>
    </Pressable>
  );

  return (
    <View style={commonStyles.screen}>
      <Header
        title="Invites"
        showBack
        showPlus
        onRightIconPress={() => router.push("/collaboration/invite-user")}
      />

      {loading ? (
        <Text style={{ textAlign: "center", marginTop: 20 }}>
          Loading invites...
        </Text>
      ) : (
        <FlatList
          data={invites}
          keyExtractor={(item) => item.inviteId}
          contentContainerStyle={{ paddingVertical: 16 }}
          renderItem={renderInviteItem}
          ListEmptyComponent={
            <Text style={{ textAlign: "center", marginTop: 20 }}>
              No invites sent.
            </Text>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  inviteBox: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 4,
    padding: 16,
    marginVertical: 2,
    marginHorizontal: 12,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default Invites;

// Author(s): Matthew Page

import { useEffect, useState } from "react";
import { View, FlatList, Pressable, StyleSheet, TouchableOpacity } from "react-native";
import { Card, Text, useTheme } from "react-native-paper";
import { router } from "expo-router";

import Header from "../../../../components/layout/Header";
import { commonStyles } from "../../../../assets/styles/stylesheets/common";
import { apiGet } from "../../../../utils/api/apiClient";
import endpoints from "../../../../utils/api/endpoints";
import { getWorkspaceId } from "../../../../storage/workspaceStorage";
import ResponsiveScreen from "../../../../components/layout/ResponsiveScreen";
import formatTTLDate from "../../../../utils/format/formatTTLDate";


const Invites = () => {
	const theme = useTheme();
	const [invites, setInvites] = useState([]);
	const [roles, setRoles] = useState([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const fetchInvitesAndRoles = async () => {
			const workspaceId = await getWorkspaceId();

			try {
				const result = await apiGet(endpoints.workspace.invites.getInvitesSent(workspaceId));
				const invites = result.data;

				console.log("Invites:", invites);
				setInvites(Array.isArray(invites) ? invites : []);
			} catch (error) {
				console.error("Failed to fetch invites:", error);
			}

			try {
				const result = await apiGet(endpoints.workspace.roles.getRoles(workspaceId));
				const roles = result.data;
				setRoles(roles);
			} catch (error) {
				console.error("Failed to fetch roles:", error);
			}

			setLoading(false);
		};

		fetchInvitesAndRoles();
	}, []);

	const renderInviteItem = ({ item }) => (
		<Pressable
			onPress={() => router.navigate(`/collaboration/edit-invite/${item.inviteId}`)} // ✅ Fixed route
			style={styles.inviteBox}
		>
			<Text style={commonStyles.listItemText}>{item.email}</Text>
			<Text style={commonStyles.captionText}>Role: {roles.find(role => role.roleId == item.roleId).name}</Text>
			<Text style={commonStyles.captionText}>Expiry Date: {formatTTLDate(item.expireAt)}</Text>
		</Pressable>
	);

	return (
		<ResponsiveScreen
			header={
				<Header
					title="Invites"
					showBack
					showPlus
					onRightIconPress={() => router.navigate({ pathname: "/collaboration/invite-user", params: { navigatedFrom: "invites" } })}
				/>			
			}
			center={false}
			padded={false}
			scroll={false}
		>

			{loading ? (
				<Text style={{ textAlign: "center", marginTop: 20, color: "#999" }}>
					Loading Invites...
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
		</ResponsiveScreen>
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

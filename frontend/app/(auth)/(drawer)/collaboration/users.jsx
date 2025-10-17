// Author(s): Matthew Page

import { Pressable, View, SectionList, Text as RNText, ActivityIndicator, StyleSheet } from "react-native";
import Header from "../../../../components/layout/Header";
import { commonStyles } from "../../../../assets/styles/stylesheets/common";
import { router } from "expo-router";
import { Text, TextInput, TouchableRipple, Chip } from "react-native-paper";
import { useEffect, useState, useCallback } from "react";
import { apiGet } from "../../../../utils/api/apiClient";
import { getWorkspaceId } from "../../../../storage/workspaceStorage";
import endpoints from "../../../../utils/api/endpoints";
import ResponsiveScreen from "../../../../components/layout/ResponsiveScreen";
import { useFocusEffect } from "@react-navigation/native";

const Users = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [allRoles, setAllRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedRoles, setSelectedRoles] = useState([]);
    const [groupedUsers, setGroupedUsers] = useState([]);
    const [allUsers, setAllUsers] = useState([]);

    useEffect(() => {
        loadUsersAndRoles();
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadUsersAndRoles();
        }, [loadUsersAndRoles])
    );

    const loadUsersAndRoles = useCallback(async () => {
        setLoading(true);
        
        const workspaceId = await getWorkspaceId();

        let users = [];
        try {
            const result = await apiGet(endpoints.workspace.users.getUsers(workspaceId));
            users = result.data;
            setAllUsers(users);
        } catch (error) {
            console.error("Failed to fetch users:", error);
        }

        let roles = []
        try {
            const result = await apiGet(endpoints.workspace.roles.getRoles(workspaceId));
            roles = result.data
            setAllRoles(roles);
        } catch (error) {
            console.error("Failed to fetch workspace roles:", error);
        }

        setLoading(false);

        sortUsers(users, roles);
    });

    function sortUsers(users = allUsers, roles = allRoles) {
        const filteredUsers = users.filter(user => {
            const matchesSearch = (user.name || user.email || '')
                .toLowerCase()
                .includes(searchQuery.toLowerCase());

            const matchesRole = selectedRoles.length === 0 || selectedRoles.some(role => role.roleId === user.roleId);
            return matchesSearch && matchesRole;
        });

        const rolesForSort = selectedRoles.length > 0 ? selectedRoles : roles;
        const sortedUsers = rolesForSort.map(role => {
            return { title: role.name, data: filteredUsers.filter(user => user.roleId === role.roleId) };
        });
        setGroupedUsers(sortedUsers)
    }

    const handleSearchChange = (query) => {
        setSearchQuery(query);
    };

    const handleToggleRole = (role) => {
        setSelectedRoles(prev =>
            prev.includes(role)
                ? prev.filter(r => r !== role)
                : [...prev, role]
        );
    };

    useEffect(() => {
        sortUsers();
    }, [selectedRoles, searchQuery])

    return (
		<ResponsiveScreen
			header={
                <Header
                    title="Users"
                    showBack
                    showPlus
                    onRightIconPress={() => router.navigate({ pathname: "/collaboration/invite-user", params: { navigatedFrom: "users" } })}
                />            
            }
			center={false}
			padded={false}
            scroll={false}
		>

            {/* Search Box */}
            <TextInput
                label="Search..."
                value={searchQuery}
                onChangeText={handleSearchChange}
                mode="outlined"
                style={{ marginVertical: 16 }}
            />

            {/* Role Filters */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
                {allRoles.map(role => (
                    <Chip
                        key={role.roleId}
                        mode="outlined"
                        selected={selectedRoles.includes(role)}
                        onPress={() => handleToggleRole(role)}
                        style={{ marginRight: 8, marginBottom: 8 }}
                    >
                        {role.name}
                    </Chip>
                ))}
            </View>

            {/* Sectioned User List */}
            <SectionList
                sections={groupedUsers}
                keyExtractor={(item) => item.userId}
                renderSectionHeader={({ section: { title } }) => (
                    <Text style={{ marginTop: 16, fontWeight: 'bold' }}>{title}</Text>
                )}
                renderItem={({ item }) => (
                    <TouchableRipple
                        style={{
                            borderWidth: 1,
                            borderColor: '#e0e0e0',
                            borderRadius: 4,
                            padding: 12,
                            marginVertical: 4
                        }}
                        onPress={() => router.navigate(`/collaboration/view-user/${item.userId}`)}
                    >
                        <>
                            <Text style={commonStyles.listItemText}>{item.given_name + " " + item.family_name}</Text>
                            <Text style={commonStyles.captionText}>{item.email}</Text>
                        </>
                    </TouchableRipple>
                )}
                ListEmptyComponent={
                    loading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" />
                            <RNText style={{ textAlign: 'center', marginTop: 16, color: '#999' }}>
                                Loading Users...
                            </RNText>
                        </View> 
                    ) : (
                        <RNText style={{ textAlign: 'center', marginTop: 16, color: '#999' }}>
                            No users found
                        </RNText>
                    )
                }
            />
        </ResponsiveScreen>
    );
};

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center"
    },
})

export default Users;

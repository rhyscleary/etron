// Author(s): Matthew Page

import { Pressable, View, SectionList, Text as RNText } from "react-native";
import Header from "../../../../components/layout/Header";
import { commonStyles } from "../../../../assets/styles/stylesheets/common";
import { router } from "expo-router";
import { Text, TextInput, TouchableRipple, Chip } from "react-native-paper";
import { useEffect, useState } from "react";
import { apiGet } from "../../../../utils/api/apiClient";
import { getWorkspaceId } from "../../../../storage/workspaceStorage";
import endpoints from "../../../../utils/api/endpoints";

const Users = () => {
    const [workspaceId, setWorkspaceId] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedRoles, setSelectedRoles] = useState([]);

    useEffect(() => {
        fetchIdAndUsers();
    }, []);

    const fetchIdAndUsers = async () => {
        try {
            const id = await getWorkspaceId();
            setWorkspaceId(id);
            const result = await apiGet(endpoints.workspace.users.getUsers(id));
            setUsers(result);
        } catch (error) {
            console.log("Failed to fetch users:", error);
        } finally {
            setLoading(false);
        }
    };

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

    const roleFilters = {
        owner: "Owner",
        manager: "Manager",
        employee: "Employee"
    };

    const availableRoles = ["owner", "manager", "employee"];

    // Apply search + filter logic
    const filteredUsers = users.filter(user => {
        const matchesSearch = (user.name || user.email || '')
            .toLowerCase()
            .includes(searchQuery.toLowerCase());

        const matchesRole = selectedRoles.length === 0 || selectedRoles.includes(user.type);

        return matchesSearch && matchesRole;
    });

    const uniqueRoles = [...new Set(filteredUsers.map(user => user.type))];

    const groupedUsers = uniqueRoles.map(role => {
        const data = filteredUsers.filter(user => user.type === role);
        return { title: roleFilters[role] || role, data };
    });

    return (
        <View style={commonStyles.screen}>
            <Header
                title="Users"
                showBack
                showPlus
                onRightIconPress={() => router.navigate("/collaboration/invite-user")}
            />

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
                {availableRoles.map(role => (
                    <Chip
                        key={role}
                        mode="outlined"
                        selected={selectedRoles.includes(role)}
                        onPress={() => handleToggleRole(role)}
                        style={{ marginRight: 8, marginBottom: 8 }}
                    >
                        {roleFilters[role]}
                    </Chip>
                ))}
            </View>

            {/* Workspace Log */}
            <Pressable
                onPress={() => router.navigate("/collaboration/workspace-log")}
                style={{
                    borderWidth: 1,
                    borderColor: '#ccc',
                    borderRadius: 4,
                    padding: 16,
                    marginVertical: 8
                }}
            >
                <Text>Workspace Log</Text>
            </Pressable>

            {/* Sectioned User List */}
            <SectionList
                sections={groupedUsers}
                keyExtractor={(item) => item.userId || item.id}
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
                        onPress={() => router.navigate(`/collaboration/edit-user/${item.userId || item.id}`)}
                    >
                        <Text>{item.name ?? item.email?.split('@')[0] ?? 'Unnamed User'}</Text>
                    </TouchableRipple>
                )}
                ListEmptyComponent={
                    loading ? (
                        <RNText style={{ textAlign: 'center', marginTop: 16, color: '#999' }}>
                            Loading Users...
                        </RNText>
                    ) : (
                        <RNText style={{ textAlign: 'center', marginTop: 16, color: '#999' }}>
                            No users found
                        </RNText>
                    )
                }
            />
        </View>
    );
};

export default Users;

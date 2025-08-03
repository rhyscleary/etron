import { Pressable, View, SectionList, Text as RNText } from "react-native";
import Header from "../../../../components/layout/Header";
import { commonStyles } from "../../../../assets/styles/stylesheets/common";
import { router } from "expo-router";
import { Text, TextInput, TouchableRipple } from "react-native-paper";
import { useEffect, useState } from "react";
import { apiGet } from "../../../../utils/api/apiClient";
import { getWorkspaceId } from "../../../../storage/workspaceStorage";
import endpoints from "../../../../utils/api/endpoints";

const Users = () => {
    const [workspaceId, setWorkspaceId] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

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

    // Filters users by name or email
    const filteredUsers = users.filter(user =>
        (user.name || user.email || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Group users by 'type' field (e.g., owner, manager, employee)
    const roleLabels = {
        owner: "Business Owner",
        manager: "Manager",
        employee: "Employee"
    };

    const uniqueRoles = [...new Set(filteredUsers.map(user => user.type))];

    const groupedUsers = uniqueRoles.map(role => {
        const data = filteredUsers.filter(user => user.type === role);
        return { title: roleLabels[role] || role, data };
    });

    return (
        <View style={commonStyles.screen}>
            <Header
                title="Users"
                showBack
                showPlus
                onRightIconPress={() => router.push("/collaboration/invite-user")}
            />

            {/* Search Box */}
            <TextInput
                label="Search..."
                value={searchQuery}
                onChangeText={handleSearchChange}
                mode="outlined"
                style={{ marginVertical: 16 }}
            />

            {/* Placeholder filters for search */}
            <Text>Placeholder</Text>

            {/* Workspace Log */}
            <Pressable
                onPress={() => router.push("/collaboration/workspace-log")}
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
                        onPress={() => router.push(`/collaboration/edit-user/${item.userId || item.id}`)}
                    >
                        <Text>{item.name ?? item.email?.split('@')[0] ?? 'Unnamed User'}</Text>
                    </TouchableRipple>
                )}
                ListEmptyComponent={
                    loading ? (
                        <RNText style={{ textAlign: 'center', marginTop: 16, color: '#999' }}>
                            Loading...
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

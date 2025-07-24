import { Pressable, View, SectionList, Text as RNText } from "react-native";
import Header from "../../../../components/layout/Header";
import { commonStyles } from "../../../../assets/styles/stylesheets/common";
import { Link, router } from "expo-router";
import { Text, TextInput, TouchableRipple } from "react-native-paper";
import { useEffect, useState } from "react";
import { apiGet } from "../../../../utils/api/apiClient"; // adjust path to your actual API helper
import { getWorkspaceId } from "../../../../storage/workspaceStorage";

const Users = () => {
    const [workspaceId, setWorkspaceId] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    const handleSearchChange = (query) => {
        setSearchQuery(query);
    };

    useEffect(() => {
        fetchId();
        getAllUsers();
    }, []);

    const fetchId = async () => {
        const id = await getWorkspaceId();
        setWorkspaceId(id);
    }; 

    async function getAllUsers() {
        try {
           const result = await apiGet(
                `https://t8mhrt9a61.execute-api.ap-southeast-2.amazonaws.com/Prod/workspace/${workspaceId}/users`
            );
            console.log(workspaceId);
            console.log(result);
            setUsers(result);
        } catch (error) {
            console.log(error);
        }
    }

    const roles = ['Business Owner', 'Manager', 'Employee'];

    const groupedUsers = roles.map(role => {
        const data = users
            .filter(user =>
                user.role === role &&
                user.name.toLowerCase().includes(searchQuery.toLowerCase())
            );

        return { title: role, data };
    }).filter(section => section.data.length > 0);

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
            <Link href="/collaboration/workspace-log" asChild>
                <Pressable
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
            </Link>

            {/* Sectioned User List */}
            <SectionList
                sections={groupedUsers}
                keyExtractor={(item) => item.id}
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
                        onPress={() => console.log('User tapped:', item.name)}
                        rippleColor="rgba(0, 0, 0, .1)"
                    >
                        <Text>{item.name}</Text>
                    </TouchableRipple>
                )}
                ListEmptyComponent={
                    loading ? (
                        <RNText style={{ textAlign: 'center', marginTop: 16 }}>
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

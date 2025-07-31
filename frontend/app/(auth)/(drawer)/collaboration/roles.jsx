import { View, FlatList, Pressable } from "react-native";
import Header from "../../../../components/layout/Header";
import { commonStyles } from "../../../../assets/styles/stylesheets/common";
import { Text } from "react-native-paper";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { getWorkspaceId } from "../../../../storage/workspaceStorage";
import { apiGet } from "../../../../utils/api/apiClient";
import endpoints from "../../../../utils/api/endpoints";

const Roles = () => {
    const [roles, setRoles] = useState([]);
    const [workspaceId, setWorkspaceId] = useState(null);

    useEffect(() => {
        const loadWorkspaceAndRoles = async () => {
            try {
                const id = await getWorkspaceId();
                setWorkspaceId(id);

                if (id) {
                    const result = await apiGet(endpoints.workspace.roles.getRoles(id));
                    //console.log("Fetched roles:", result);
                    console.log(result[0]?.permissions[0]);

                    // Ensure this matches your actual API shape
                    setRoles(Array.isArray(result) ? result : []);
                }
            } catch (error) {
                console.log("Error fetching roles:", error);
            }
        };

        loadWorkspaceAndRoles();
    }, []);

    return (
        <View style={commonStyles.screen}>
            <Header
                title="Roles"
                showBack
                showPlus
                onRightIconPress={() => router.push("/collaboration/create-role")}
            />

            <FlatList
                data={roles}
                keyExtractor={(item) => item.roleId}
                contentContainerStyle={{ paddingVertical: 16 }}
                renderItem={({ item }) => (
                    <Pressable
                        onPress={() => router.push(`/collaboration/edit-role/${item.roleId}`)}
                        style={{
                            borderWidth: 1,
                            borderColor: '#ccc',
                            borderRadius: 4,
                            padding: 16,
                            marginVertical: 2,
                            marginHorizontal: 12
                        }}
                    >
                        <Text>{item.name}</Text>
                    </Pressable>
                )}
                ListEmptyComponent={
                    <Text style={{ textAlign: "center", marginTop: 20 }}>
                        No roles found.
                    </Text>
                }
            />
        </View>
    );
};

export default Roles;

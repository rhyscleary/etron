// Author(s): Matthew Page

import { View, FlatList, Pressable, Text as RNText  } from "react-native";
import Header from "../../../../components/layout/Header";
import { commonStyles } from "../../../../assets/styles/stylesheets/common";
import { Text } from "react-native-paper";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { getWorkspaceId } from "../../../../storage/workspaceStorage";
import { apiGet } from "../../../../utils/api/apiClient";
import endpoints from "../../../../utils/api/endpoints";
import ResponsiveScreen from "../../../../components/layout/ResponsiveScreen";


const Roles = () => {
    const [roles, setRoles] = useState([]);
    const [workspaceId, setWorkspaceId] = useState(null);
    const [loading, setLoading] = useState(true);


    useEffect(() => {
        const loadWorkspaceAndRoles = async () => {
            try {
                const id = await getWorkspaceId();
                setWorkspaceId(id);

                if (id) {
                    const result = await apiGet(endpoints.workspace.roles.getRoles(id));
                    const roles = result.data;
                    //console.log("Fetched roles:", result);
                    console.log("Roles:", roles[0]?.permissions[0]);

                    // Ensure this matches your actual API shape
                    setRoles(Array.isArray(roles) ? roles : []);
                    setLoading(false);
                }
            } catch (error) {
                console.error("Error fetching roles:", error);
            }
        };

        loadWorkspaceAndRoles();
    }, []);

    return (
		<ResponsiveScreen
			header={
                <Header
                    title="Roles"
                    showBack
                    showPlus
                    onRightIconPress={() => router.navigate("/collaboration/create-role")}
                />             
            }
			center={false}
			padded={false}
            scroll={false}
		>

            <FlatList
                data={roles}
                keyExtractor={(item) => item.roleId}
                contentContainerStyle={{ paddingVertical: 16 }}
                renderItem={({ item }) => (
                    <Pressable
                        onPress={() => router.navigate(`/collaboration/view-role/${item.roleId}`)}
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
                    loading ? (
                        <RNText style={{ textAlign: 'center', marginTop: 16, color: '#999' }}>
                            Loading Roles...
                        </RNText>
                    ) : (
                        <RNText style={{ textAlign: 'center', marginTop: 16, color: '#999' }}>
                            No roles found
                        </RNText>
                    )
                }
            />
        </ResponsiveScreen>
    );
};

export default Roles;

// Author(s): Matthew Page

import { View, ScrollView } from "react-native";
import Header from "../../../../components/layout/Header";
import { commonStyles } from "../../../../assets/styles/stylesheets/common";
import { Text, TextInput, Checkbox } from "react-native-paper";
import { useEffect, useState } from "react";
import { getWorkspaceId } from "../../../../storage/workspaceStorage";
import { apiGet, apiPost } from "../../../../utils/api/apiClient";
import endpoints from "../../../../utils/api/endpoints";
import { router } from "expo-router";
import ResponsiveScreen from "../../../../components/layout/ResponsiveScreen";

const CreateRole = () => {
    const [roleName, setRoleName] = useState("");
    const [permissions, setPermissions] = useState([]);
    const [workspaceId, setWorkspaceId] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const loadWorkspaceAndPermissions = async () => {
            try {
                const id = await getWorkspaceId();
                setWorkspaceId(id);

                if (id) {
                    const result = await apiGet(endpoints.workspace.core.getDefaultPermissions);
                    const initialPermissions = Array.isArray(result)
                        ? result.map((p) => ({ ...p }))
                        : [];
                    setPermissions(initialPermissions);
                }
            } catch (error) {
                console.error("Error fetching permissions:", error);
            }
        };

        loadWorkspaceAndPermissions();
    }, []);

    const togglePermission = (key) => {
        setPermissions((prev) =>
            prev.map((perm) =>
                perm.key === key ? { ...perm, enabled: !perm.enabled } : perm
            )
        );
    };

    const handleCheck = async () => {
        if (!workspaceId || roleName.trim() === "") return;

        try {
            setLoading(true);

            const data = {
                name: roleName,
                permissions: permissions.filter((p) => p.enabled).map((p) => p.key),
            };

            const result = await apiPost(
                endpoints.workspace.roles.create(workspaceId),
                data
            );

            console.log("Created role:", result);
            router.navigate("/collaboration/roles"); // ✅ Redirect to the role list
        } catch (error) {
            console.error("Failed to create role:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
		<ResponsiveScreen
			header={
                <Header
                    title="Create Role"
                    showBack
                    showCheck
                    onRightIconPress={handleCheck}
                />
            }
			center={false}
			padded
            scroll={true}
		>
            <ScrollView contentContainerStyle={{ paddingBottom: 64 }}>
                <TextInput
                    label="Role Name"
                    value={roleName}
                    onChangeText={setRoleName}
                    mode="outlined"
                    style={{ marginVertical: 16 }}
                />

                <Text variant="titleLarge" style={{ marginBottom: 8 }}>
                    Permissions
                </Text>

                {permissions.map((perm) => (
                    <View
                        key={perm.key}
                        style={{
                            flexDirection: "row",
                            alignItems: "center",
                            marginBottom: 8,
                        }}
                    >
                        <Checkbox
                            status={perm.enabled ? "checked" : "unchecked"}
                            onPress={() => togglePermission(perm.key)}
                        />
                        <Text>{perm.label}</Text>
                    </View>
                ))}
            </ScrollView>
        </ResponsiveScreen>
    );
};

export default CreateRole;

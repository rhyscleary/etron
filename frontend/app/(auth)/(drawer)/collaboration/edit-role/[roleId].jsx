import { View, ScrollView } from "react-native";
import Header from "../../../../../components/layout/Header";
import { commonStyles } from "../../../../../assets/styles/stylesheets/common";
import { Text, TextInput, Checkbox } from "react-native-paper";
import { useEffect, useState } from "react";
import { getWorkspaceId } from "../../../../../storage/workspaceStorage";
import { apiGet, apiPut } from "../../../../../utils/api/apiClient";
import endpoints from "../../../../../utils/api/endpoints";
import { router, useLocalSearchParams } from "expo-router";

const EditRole = () => {
    const { roleId } = useLocalSearchParams();
    const [roleName, setRoleName] = useState("");
    const [permissions, setPermissions] = useState([]);
    const [workspaceId, setWorkspaceId] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            try {
                const id = await getWorkspaceId();
                setWorkspaceId(id);

                if (id && roleId) {
                    const [defaultPerms, roleDetails] = await Promise.all([
                        apiGet(endpoints.workspace.core.getDefaultPermissions),
                        apiGet(endpoints.workspace.roles.getRole(id, roleId)),
                    ]);

                    const enabledKeys = new Set(roleDetails.permissions.map((p) => p.key));
                    const mergedPermissions = defaultPerms.map((perm) => ({
                        ...perm,
                        enabled: enabledKeys.has(perm.key),
                    }));

                    setRoleName(roleDetails.name);
                    setPermissions(mergedPermissions);
                }
            } catch (error) {
                console.error("Error loading role data:", error);
            }
        };

        loadData();
    }, [roleId]);

    const togglePermission = (key) => {
        setPermissions((prev) =>
            prev.map((perm) =>
                perm.key === key ? { ...perm, enabled: !perm.enabled } : perm
            )
        );
    };

    const handleCheck = async () => {
        if (!workspaceId || !roleId || roleName.trim() === "") return;

        try {
            setLoading(true);

            const data = {
                name: roleName,
                permissions: permissions.filter((p) => p.enabled).map((p) => p.key),
            };

            const result = await apiPut(
                endpoints.workspace.roles.update(workspaceId, roleId),
                data
            );

            console.log(result);

            router.push("/collaboration/roles"); // ✅ Navigate back to role list
        } catch (error) {
            console.error("Failed to update role:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={commonStyles.screen}>
            <Header
                title="Edit Role"
                showBack
                showCheck
                onRightIconPress={handleCheck}
            />

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
        </View>
    );
};

export default EditRole;

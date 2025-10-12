// Author(s): Rhys Cleary

import { ActivityIndicator, FlatList, ScrollView, StyleSheet, View } from "react-native";
import Header from "../../../../../../components/layout/Header";
import { useCallback, useEffect, useMemo, useState } from "react";
import { router, useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import BasicDialog from "../../../../../../components/overlays/BasicDialog";
import ResponsiveScreen from "../../../../../../components/layout/ResponsiveScreen";
import { apiDelete, apiGet, apiPatch, apiPost, apiPut } from "../../../../../../utils/api/apiClient";
import endpoints from "../../../../../../utils/api/endpoints";
import { getWorkspaceId } from "../../../../../../storage/workspaceStorage";
import { List, Text, useTheme } from "react-native-paper";
import { hasPermission } from "../../../../../../utils/permissions";
import ErrorRetry from "../../../../../../components/common/errors/ErrorRetry";
import StackLayout from "../../../../../../components/layout/StackLayout";
import TextField from "../../../../../../components/common/input/TextField";

const BoardSettings = ({ mode = "view" }) => {
    const {boardId} = useLocalSearchParams();
    const router = useRouter();
    const theme = useTheme();

    const [workspaceId, setWorkspaceId] = useState(null);
    const [boardName, setBoardName] = useState("");
    const [isDashboard, setIsDashboard] = useState(false);
    const [roles, setRoles] = useState([]);
    const [selectedRoles, setSelectedRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);

    useEffect(() => {
        const init = async () => {
            try {
                // check permissions to view this screen
                const allowed = await hasPermission("app.workspace.manage_modules");
                if (!allowed) {
                    router.back(); // navigate the user off the screen
                    return;
                }

                const id = await getWorkspaceId();
                setWorkspaceId(id);

                const boardResponse = await apiGet(endpoints.workspace.boards.getBoard(workspaceId, boardId));
                const board = boardResponse.data;
                setBoardName(board.name);
                setIsDashboard(board.isDashboard);
                setSelectedRoles(board.roleIds || []);

                const rolesResponse = await apiGet(endpoints.workspace.roles.getRoles(workspaceId));
                setRoles(rolesResponse.data || []);

                setLoading(false);
            } catch (error) {
                console.error("Error fetching board or roles:", error);
                setError(true);
                setLoading(false);
            }
        };
        init();
    }, []);

    const handleSave = async () => {
        if (!boardName.trim()) return;

        try {
            await apiPatch(endpoints.workspace.boards.update(workspaceId, boardId), {
                name: boardName.trim(),
                isDashboard,
                roleIds: selectedRoles,
            });
            router.back();
        } catch (error) {
            console.error("Failed to save board:", error);
        }
    };

    const handleDelete = async () => {
        try {
            await apiDelete(endpoints.workspace.boards.delete(workspaceId, boardId));
            router.back();
        } catch (error) {
            console.error("Failed to delete board:", error);
        } finally {
            setDeleteDialogVisible(false);
        }
    }

    if (loading) {
        return (
            <ResponsiveScreen
                header={<Header title={mode === "view" ? "View Board" : "Edit Board"} showBack showCheck={mode === "edit"} onRightIconPress={handleSave} />}
            >
                <ActivityIndicator size="large" style={{ marginTop: 50 }} />
            </ResponsiveScreen>
        );
    }

    if (error) {
        return (
            <ResponsiveScreen header={<Header title={mode === "view" ? "View Board" : "Edit Board"} showBack showCheck={mode === "edit"} />}>
                <ErrorRetry
                    message="Error loading board."
                    onRetry={async () => {
                        setLoading(true);
                        setError(false);
                        try {
                            const boardRes = await apiGet(endpoints.workspace.boards.getBoard(workspaceId, boardId));
                            const board = boardRes.data;
                            setBoardName(board.name);
                            setIsDashboard(board.isDashboard);
                            setSelectedRoles(board.roleIds || []);
                            const rolesRes = await apiGet(endpoints.workspace.roles.getRoles(workspaceId));
                            setRoles(rolesRes.data || []);
                        } catch (err) {
                            setError(true);
                        } finally {
                            setLoading(false);
                        }
                    }}
                />
            </ResponsiveScreen>
        );
    }

    
    return (
        <ResponsiveScreen
            header={<Header title={mode === "view" ? "View Board" : "Edit Board"} showBack showEdit />}
            padded
            scroll
        >
            <StackLayout spacing={24}>
                <TextField
                    value={boardName}
                    placeholder="Name"
                    isDisabled={mode === "edit"}
                />
            </StackLayout>
            
            
            {mode === "edit" && (
                <BasicDialog
                    visible={deleteDialogVisible}
                    message={`Are you sure you want to delete the board ${boardName}? This cannot be undone.`}
                    leftActionLabel="Cancel"
                    handleLeftAction={() => setDeleteDialogVisible(false)}
                    rightActionLabel="Delete"
                    rightDanger={true}
                    handleRightAction={handleDelete}
                />
            )}
        </ResponsiveScreen>
    )
};

const styles = StyleSheet.create({
    contentContainer: {
        flex: 1,
    },
    listContainer: {
        flex: 1,
        position: "relative",
    },
    emptyContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },
    emptyText: {
        fontSize: 16,
    }
})

export default BoardSettings;
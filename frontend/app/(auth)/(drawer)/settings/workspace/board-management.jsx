// Author(s): Rhys Cleary

import { ActivityIndicator, FlatList, StyleSheet, View } from "react-native";
import Header from "../../../../../components/layout/Header";
import { useEffect, useMemo, useState } from "react";
import { router } from "expo-router";
import BasicDialog from "../../../../../components/overlays/BasicDialog";
import ResponsiveScreen from "../../../../../components/layout/ResponsiveScreen";
import SearchBar from "../../../../../components/common/input/SearchBar";
import ListCard from "../../../../../components/cards/listCard";
import { apiDelete, apiGet, apiPatch, apiPost, apiPut } from "../../../../../utils/api/apiClient";
import endpoints from "../../../../../utils/api/endpoints";
import { getWorkspaceId } from "../../../../../storage/workspaceStorage";
import { List, Text, useTheme } from "react-native-paper";
import { hasPermission } from "../../../../../utils/permissions";

const BoardManagement = () => {
    const [loading, setLoading] = useState(false);
    const [boards, setBoards] = useState([]);
    const [workspaceId, setWorkspaceId] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [createDialogVisible, setCreateDialogVisible] = useState(false);
    const [boardName, setBoardName] = useState("");
    const [inputError, setInputError] = useState(false);
    const [inputErrorMessage, setInputErrorMessage] = useState("");

    const theme = useTheme();

    useEffect(() => {
        const init = async () => {
            const id = await getWorkspaceId();

            // check permissions to view this screen
            const allowed = await hasPermission("app.workspace.manage_boards");
            if (!allowed) {
                router.back(); // navigate the user off the screen
                return;
            }
            
            setWorkspaceId(id);
            console.log("hello")

            if (id) {
                await fetchBoards(id);
            }
        };
        init();
    }, []);

    const fetchBoards = async (id) => {
        if (!id) return;

        try {
            setLoading(true);

            const response = await apiGet(
                endpoints.workspace.boards.getBoards(id)
            );

            console.log(response);

            setBoards(Array.isArray(response) ? response.filter(Boolean) : []);
        } catch (error) {
            console.error("Error fetching boards:", error);
        } finally {
            setLoading(false);
        }
    };

    const filteredBoards = useMemo(() => {
        return (boards || []).filter((board) => {
            if (!board) return false;
            const query = searchQuery.toLowerCase();
            return (
                board.name.toLowerCase().includes(query)
                
            );
        });
    }, [searchQuery, boards]);

    const handleBoardCreation = async () => {
        if (!boardName.trim()) {
            setInputError(true);
            setInputErrorMessage("Board name cannot be empty");
            return;
        }

        try {
            // call api
            await apiPost(endpoints.workspace.boards.create(workspaceId), {
                name: boardName.trim(),
                config: {}
            });

            setCreateDialogVisible(false);
            setBoardName("");

            // background refetch
            await fetchBoards(workspaceId);
        } catch (error) {
            console.error("Failed to create board:", error);
            // show toast
        }
    };

    const renderBoardItem = ({item}) => (
        <List.Item
            title={item.name}
            description={item.description}
            left={(props) => <List.Icon {...props} icon="view-dashboard-outline" />}
            right={(props) => <List.Icon {...props} icon="dots-vertical" />}
            onPress={() => {
                // navigate to board settings
            }}
            style={styles.listItem}
        />
    );
    
    return (
        <ResponsiveScreen
            header={<Header title="Boards" showBack showPlus onRightIconPress={() => setCreateDialogVisible(true)} />}
            center={false}
            padded={false}
            scroll={false}
        >
            
            <SearchBar 
                placeholder="Search boards"
                onSearch={setSearchQuery}
          
            /> 
            <View style={styles.contentContainer}>
                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" />
                        <Text>Loading Boards...</Text>
                    </View>
                ) : (
                    <FlatList
                        data={filteredBoards}
                        renderItem={renderBoardItem}
                        keyExtractor={(item, index) => 
                            item?.boardId?.toString() ?? item?.id?.toString() ?? index.toString()
                        }
                        refreshing={loading}
                        onRefresh={() => fetchBoards(workspaceId)}
                        ItemSeparatorComponent={() => <View style={{height: 10}} />}
                        ListEmptyComponent={() => (
                            <View style={styles.emptyContainer}>
                                <Text style={styles.emptyText}>No Boards Created</Text>
                            </View>
                        )}
                    />
                )}
            </View>

            {/* Dialog to create a new board */}
            <BasicDialog
                visible={createDialogVisible}
                title="New Board"
                showInput
                inputLabel="Board Name"
                inputPlaceholder="Enter board name"
                inputValue={boardName}
                inputOnChangeText={(text) => {
                    setBoardName(text);
                    if (text) {
                        setInputError(false);
                    }
                }}
                inputError={inputError}
                inputErrorMessage={inputErrorMessage}
                leftActionLabel="Cancel"
                handleLeftAction={() => {
                    setCreateDialogVisible(false);
                    setBoardName("");
                    setInputError(false);
                }}
                rightActionLabel="Create"
                handleRightAction={handleBoardCreation}
            >
            </BasicDialog>

        </ResponsiveScreen>
    )
};

const styles = StyleSheet.create({
    contentContainer: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center"
    },
    emptyContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },
    emptyText: {
        fontSize: 16,
    },
    listItem: {

    }
})

export default BoardManagement;
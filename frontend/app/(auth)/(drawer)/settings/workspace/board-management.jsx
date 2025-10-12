// Author(s): Rhys Cleary

import { FlatList, Image, StyleSheet, View } from "react-native";
import Header from "../../../../../components/layout/Header";
import { useCallback, useEffect, useMemo, useState } from "react";
import { router, useFocusEffect } from "expo-router";
import BasicDialog from "../../../../../components/overlays/BasicDialog";
import ResponsiveScreen from "../../../../../components/layout/ResponsiveScreen";
import SearchBar from "../../../../../components/common/input/SearchBar";
import { apiGet, apiPost } from "../../../../../utils/api/apiClient";
import endpoints from "../../../../../utils/api/endpoints";
import { getWorkspaceId } from "../../../../../storage/workspaceStorage";
import { Avatar, Chip, List, Text } from "react-native-paper";
import { hasPermission } from "../../../../../utils/permissions";
import { getCurrentUser } from "aws-amplify/auth";
import CollapsibleList from "../../../../../components/layout/CollapsibleList";
import Divider from "../../../../../components/layout/Divider";
import PlaceholderListItem from "../../../../../components/skeleton/PlaceholderListItem";
import defaultThumbnail from "../../../../../assets/images/defaultThumbnail.jpeg";
import ErrorRetry from "../../../../../components/common/errors/ErrorRetry";

const AMOUNT_PLACEHOLDERS = 5;

const BoardManagement = () => {
    const [loading, setLoading] = useState(true);
    const [boards, setBoards] = useState([]);
    const [workspaceId, setWorkspaceId] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [createDialogVisible, setCreateDialogVisible] = useState(false);
    const [boardName, setBoardName] = useState("");
    const [inputError, setInputError] = useState(false);
    const [inputErrorMessage, setInputErrorMessage] = useState("");
    const [currentUserId, setCurrentUserId] = useState(null);
    const [error, setError] = useState(false);
    const [usersMap, setUsersMap] = useState({});
    const [usersLoading, setUsersLoading] = useState(true);
    const [failedImages, setFailedImages] = useState({});

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

            // get the current users id
            try {
                const { userId } = await getCurrentUser();
                setCurrentUserId(userId);
            } catch (error) {
                console.warn("Failed to get current users id:", error);
            }

            if (id) {
                setLoading(true);
                setUsersLoading(true);
                await Promise.all([fetchBoards(id), fetchWorkspaceUsers(id)]);
                setLoading(false);
                setUsersLoading(false);
            }
        };
        init();
    }, []);

    useFocusEffect(
        useCallback(() => {
            const refetchBoards = async () => {
                if (workspaceId) {
                    setLoading(true);
                    await Promise.all([fetchBoards(workspaceId), fetchWorkspaceUsers(workspaceId)]);
                    setLoading(false);
                }
            };

            refetchBoards();
        }, [workspaceId])
    );

    const fetchBoards = useCallback(async (id) => {
        if (!id) return;
        setError(false);

        try {
            const response = await apiGet(
                endpoints.workspace.boards.getBoards(id)
            );
            console.log(response.data)

            if (response.status !== 200) {
                setError(true);
                return;
            }

            const boards = response.data || [];
            setBoards(Array.isArray(boards) ? boards.filter(Boolean) : []);
        } catch (error) {
            console.error("Error fetching boards:", error);
            setError(true);
        }
    }, []);

    const fetchWorkspaceUsers = async (workspaceId) => {
        try {
            const response = await apiGet(endpoints.workspace.users.getUsers(workspaceId));
      
            if (response.status === 200 && Array.isArray(response.data)) {
                const map = {};
                response.data.forEach(user => {
                    map[user.userId] = { 
                        name: user.given_name + " " + user.family_name, 
                        avatarUrl: user.avatarUrl 
                    };
                });
                setUsersMap(map);
            }
        } catch (error) {
            console.error("Failed to fetch users:", error);
        }
    }
    
    const boardsWithUserInfo = useMemo(() => {
        return boards.map(b => ({
            ...b,
            createdByName: b.createdBy === currentUserId ? "You" : usersMap[b.createdBy]?.name || "System",
            createdByAvatarUrl: usersMap[b.createdBy]?.picture,
            thumbnailUrl: b.thumbnailUrl || null,
        }))
    }, [boards, usersMap, currentUserId]);

    const filteredBoards = useMemo(() => {
        const query = searchQuery.toLowerCase();
        return (boardsWithUserInfo || []).filter((board) =>
            board?.name?.toLowerCase().includes(query)
        );
    }, [boardsWithUserInfo, searchQuery]);

    const usersBoards = filteredBoards.filter(b => b.createdBy === currentUserId);
    const othersBoards = filteredBoards.filter(b => b.createdBy !== currentUserId);
    
    const hasYou = usersBoards.length > 0;
    const hasOthers = othersBoards.length > 0;


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


    const renderBoardItem = ({item}) => {
        const isYou = item.createdBy === currentUserId;
        const hasError = failedImages[item.boardId];
        
        return (
            <List.Item
                title={item.name}
                description={`Created by ${item.createdByName}`}
                left={() => 
                    !isYou ? ( 
                        item.createdByAvatarUrl 
                            ? <Avatar.Image size={32} source={{ uri: item.createdByAvatarUrl }} />
                            : <Avatar.Icon size={32} icon="account-circle" />
                    ) : null
                }
                right={() => (
                    <Image
                        source={
                            !item.thumbnailUrl || hasError
                                ? defaultThumbnail  
                                : { uri: item.thumbnailUrl } 
                        }
                        style={{ width: 38, height: 38 }}
                        onError={() => setFailedImages((prev) => ({ ...prev, [item.boardId]: true }))}
                    />
                )}
                onPress={() => {
                    // navigate to board settings
                }}
                style={styles.listItem}
            />
        );
    };

    const renderPlaceholderList = () =>
        Array.from({ length: AMOUNT_PLACEHOLDERS }).map((_, index) => (
            <PlaceholderListItem key={index} />
        ));

    const isLoading = loading || usersLoading;
    
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
                {isLoading ? (
                    <>
                        <CollapsibleList
                            items={[
                                {
                                    key: "loadingUsersBoards",
                                    title: "Created by You",
                                    defaultExpanded: true,
                                    content: renderPlaceholderList(),
                                },
                            ]}
                        />
                        <Divider thickness={0.5} style={{ marginVertical: 20 }} />
                        <CollapsibleList
                            items={[
                                {
                                    key: "loadingOthersBoards",
                                    title: "Created by Others",
                                    defaultExpanded: false,
                                    content: renderPlaceholderList(),
                                }
                            ]}
                        />
                    </>
                ) : (
                    <>
                        {/* If an error has occurred display chip to retry */}
                        {error ? (
                            <ErrorRetry
                                message="An error occurred loading boards."
                                onRetry={async () => {
                                    setLoading(true);
                                    await fetchBoards(workspaceId);
                                    setLoading(false);
                                }}
                            />
                        ) : !hasYou && !hasOthers ? (
                            <View style={styles.emptyContainer}>
                                <Text style={styles.emptyText}>No boards created.</Text>
                            </View>
                        ) : (
                            <>
                                {hasYou && (
                                    <CollapsibleList
                                        items={[
                                            {
                                                key: "usersBoards",
                                                title: "Created by You",
                                                defaultExpanded: true,
                                                content: (
                                                    <FlatList
                                                        data={usersBoards}
                                                        renderItem={renderBoardItem}
                                                        keyExtractor={(item, index) =>
                                                            item?.boardId?.toString() ?? index.toString()
                                                        }
                                                        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
                                                        ListFooterComponent={<View style={{ height: 40 }} />}
                                                    />
                                                ),
                                            },
                                        ]}
                                    />
                                )}

                                {/* Divider between lists */}
                                {hasYou && hasOthers && (
                                    <Divider thickness={0.5} style={{ marginVertical: 20 }} />
                                )}
                                
                                {/* Created by Others */}
                                {hasOthers && (
                                    <CollapsibleList
                                        items={[
                                            {
                                                key: "othersBoards",
                                                title: "Created by Others",
                                                defaultExpanded: false,
                                                content: (
                                                    <FlatList
                                                        data={othersBoards}
                                                        renderItem={renderBoardItem}
                                                        keyExtractor={(item, index) =>
                                                            item?.boardId?.toString() ?? index.toString()
                                                        }
                                                        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
                                                        ListFooterComponent={<View style={{ height: 40 }} />}
                                                    />
                                                ), 
                                            },
                                        ]}
                                    />
                                )}
                            </>
                        )}
                    </>
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
            />

        </ResponsiveScreen>
    )

}

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
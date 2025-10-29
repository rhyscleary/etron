import React, { useState, useEffect, useCallback } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { Text, Card, FAB, Menu, IconButton, Chip, useTheme } from 'react-native-paper';
import { router } from 'expo-router';
import Header from '../../../../components/layout/Header';
import BoardService from '../../../../services/BoardService';
import ResponsiveScreen from '../../../../components/layout/ResponsiveScreen';
import SearchBar from '../../../../components/common/input/SearchBar';
import BasicButton from '../../../../components/common/buttons/BasicButton';

const formatTimeAgo = (dateString) => {
    if (!dateString) return 'Never';
    
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days} day${days > 1 ? 's' : ''} ago`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months} month${months > 1 ? 's' : ''} ago`;
    const years = Math.floor(months / 12);
    return `${years} year${years > 1 ? 's' : ''} ago`;
};

const BoardsManagement = () => {
    const theme = useTheme();
    const [boards, setBoards] = useState([]);
    const [filteredBoards, setFilteredBoards] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [activeBoardId, setActiveBoardId] = useState(null);
    const [menuVisible, setMenuVisible] = useState({});

    // Load boards
    const loadBoards = useCallback(async () => {
        try {
            setLoading(true);
            const [allBoards, activeId] = await Promise.all([
                BoardService.getAllBoards(),
                BoardService.getActiveDashboardId()
            ]);
            setBoards(allBoards);
            setFilteredBoards(allBoards);
            setActiveBoardId(activeId);
        } catch (error) {
            console.error('Error loading boards:', error);
            Alert.alert('Error', 'Failed to load boards');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadBoards();
    }, [loadBoards]);

    // Search/filter boards
    useEffect(() => {
        if (!searchQuery.trim()) {
            setFilteredBoards(boards);
        } else {
            const query = searchQuery.toLowerCase();
            const filtered = boards.filter(board =>
                board.name?.toLowerCase().includes(query) ||
                board.description?.toLowerCase().includes(query)
            );
            setFilteredBoards(filtered);
        }
    }, [searchQuery, boards]);

    const handleCreateBoard = () => {
        router.push('/boards/create');
    };

    const handleViewBoard = (boardId) => {
        router.push(`/boards/${boardId}`);
    };

    const handleEditBoard = (boardId) => {
        router.push(`/boards/${boardId}/edit`);
    };

    const handleDuplicateBoard = async (board) => {
        try {
            const duplicated = await BoardService.duplicateBoard(board.id);
            if (duplicated) {
                Alert.alert('Success', `Board "${board.name}" duplicated`);
                loadBoards();
            } else {
                Alert.alert('Error', 'Failed to duplicate board');
            }
        } catch (error) {
            console.error('Error duplicating board:', error);
            Alert.alert('Error', 'Failed to duplicate board');
        }
    };

    const handleDeleteBoard = (board) => {
        Alert.alert(
            'Delete Board',
            `Are you sure you want to delete "${board.name}"? This action cannot be undone.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const success = await BoardService.deleteBoard(board.id);
                            if (success) {
                                Alert.alert('Success', 'Board deleted');
                                loadBoards();
                            } else {
                                Alert.alert('Error', 'Failed to delete board');
                            }
                        } catch (error) {
                            console.error('Error deleting board:', error);
                            Alert.alert('Error', 'Failed to delete board');
                        }
                    }
                }
            ]
        );
    };

    const handleSetAsActive = async (board) => {
        try {
            const success = await BoardService.setAsActiveDashboard(board.id);
            if (success) {
                setActiveBoardId(board.id);
                Alert.alert('Success', `"${board.name}" is now your dashboard`);
            } else {
                Alert.alert('Error', 'Failed to set as dashboard');
            }
        } catch (error) {
            console.error('Error setting active board:', error);
            Alert.alert('Error', 'Failed to set as dashboard');
        }
    };

    const handleShareBoard = (board) => {
        router.push(`/boards/${board.id}/share`);
    };

    const toggleMenu = (boardId) => {
        setMenuVisible(prev => ({ ...prev, [boardId]: !prev[boardId] }));
    };

    const renderBoardCard = (board) => {
        const isActive = board.id === activeBoardId;
        const itemCount = board.items?.length || 0;
        const lastUpdated = formatTimeAgo(board.metadata?.updatedAt);

        return (
            <Card
                key={board.id}
                style={[
                    styles.boardCard,
                    isActive && { borderColor: theme.colors.primary, borderWidth: 2 }
                ]}
                onPress={() => handleViewBoard(board.id)}
            >
                <Card.Content>
                    <View style={styles.cardHeader}>
                        <View style={styles.cardTitle}>
                            <Text variant="titleMedium" style={styles.boardName}>
                                {board.name}
                            </Text>
                            {isActive && (
                                <Chip
                                    mode="flat"
                                    compact
                                    style={styles.activeChip}
                                    textStyle={{ fontSize: 10 }}
                                >
                                    Dashboard
                                </Chip>
                            )}
                        </View>
                        <Menu
                            visible={menuVisible[board.id]}
                            onDismiss={() => toggleMenu(board.id)}
                            anchor={
                                <IconButton
                                    icon="dots-vertical"
                                    size={20}
                                    onPress={() => toggleMenu(board.id)}
                                />
                            }
                        >
                            <Menu.Item
                                leadingIcon="eye"
                                onPress={() => {
                                    toggleMenu(board.id);
                                    handleViewBoard(board.id);
                                }}
                                title="View"
                            />
                            <Menu.Item
                                leadingIcon="pencil"
                                onPress={() => {
                                    toggleMenu(board.id);
                                    handleEditBoard(board.id);
                                }}
                                title="Edit"
                            />
                            {!isActive && (
                                <Menu.Item
                                    leadingIcon="view-dashboard"
                                    onPress={() => {
                                        toggleMenu(board.id);
                                        handleSetAsActive(board);
                                    }}
                                    title="Set as Dashboard"
                                />
                            )}
                            <Menu.Item
                                leadingIcon="content-copy"
                                onPress={() => {
                                    toggleMenu(board.id);
                                    handleDuplicateBoard(board);
                                }}
                                title="Duplicate"
                            />
                            <Menu.Item
                                leadingIcon="share-variant"
                                onPress={() => {
                                    toggleMenu(board.id);
                                    handleShareBoard(board);
                                }}
                                title="Share"
                            />
                            <Menu.Item
                                leadingIcon="delete"
                                onPress={() => {
                                    toggleMenu(board.id);
                                    handleDeleteBoard(board);
                                }}
                                title="Delete"
                                titleStyle={{ color: theme.colors.error }}
                            />
                        </Menu>
                    </View>

                    {board.description ? (
                        <Text
                            variant="bodyMedium"
                            style={styles.boardDescription}
                            numberOfLines={2}
                        >
                            {board.description}
                        </Text>
                    ) : null}

                    <View style={styles.boardMeta}>
                        <View style={styles.metaItem}>
                            <IconButton icon="grid" size={16} style={styles.metaIcon} />
                            <Text variant="bodySmall">{itemCount} items</Text>
                        </View>
                        <View style={styles.metaItem}>
                            <IconButton icon="clock-outline" size={16} style={styles.metaIcon} />
                            <Text variant="bodySmall">{lastUpdated}</Text>
                        </View>
                    </View>
                </Card.Content>
            </Card>
        );
    };

    return (
        <ResponsiveScreen
            scroll={false}
            padded={false}
            center={false}
            tapToDismissKeyboard={false}
            header={(
                <Header
                    title="Boards"
                    showMenu
                    showPlus
                    onRightIconPress={handleCreateBoard}
                />
            )}
        >
            <View style={styles.container}>
                <SearchBar
                    placeholder="Search boards..."
                    value={searchQuery}
                    onSearch={setSearchQuery}
                    containerStyle={styles.searchBarContainer}
                    searchbarStyle={styles.searchBar}
                />

                <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                    {loading ? (
                        <View style={styles.emptyState}>
                            <Text>Loading boards...</Text>
                        </View>
                    ) : filteredBoards.length === 0 ? (
                        <View style={styles.emptyState}>
                            <IconButton icon="view-grid-plus-outline" size={64} />
                            <Text variant="titleMedium" style={styles.emptyTitle}>
                                {searchQuery ? 'No boards found' : 'No boards yet'}
                            </Text>
                            <Text variant="bodyMedium" style={styles.emptyDescription}>
                                {searchQuery
                                    ? 'Try a different search term'
                                    : 'Create your first board to get started'}
                            </Text>
                            {!searchQuery && (
                                <BasicButton
                                    label="Create Board"
                                    onPress={handleCreateBoard}
                                    style={styles.createButton}
                                />
                            )}
                        </View>
                    ) : (
                        <View style={styles.boardsList}>
                            {filteredBoards.map(renderBoardCard)}
                        </View>
                    )}
                </ScrollView>
            </View>

            <FAB
                icon="plus"
                style={styles.fab}
                onPress={handleCreateBoard}
                label="New Board"
            />
        </ResponsiveScreen>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16
    },
    searchBarContainer: {
        marginHorizontal: 0,
        marginBottom: 16
    },
    searchBar: {
        marginBottom: 0
    },
    scrollView: {
        flex: 1
    },
    boardsList: {
        paddingBottom: 80
    },
    boardCard: {
        marginBottom: 12
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8
    },
    cardTitle: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8
    },
    boardName: {
        flex: 1
    },
    activeChip: {
        height: 24
    },
    boardDescription: {
        opacity: 0.7,
        marginBottom: 12
    },
    boardMeta: {
        flexDirection: 'row',
        gap: 16,
        marginTop: 8
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4
    },
    metaIcon: {
        margin: 0
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 64,
        paddingHorizontal: 32
    },
    emptyTitle: {
        marginTop: 16,
        marginBottom: 8,
        textAlign: 'center'
    },
    emptyDescription: {
        opacity: 0.7,
        textAlign: 'center',
        marginBottom: 24
    },
    createButton: {
        marginTop: 8
    },
    fab: {
        position: 'absolute',
        right: 16,
        bottom: 16
    }
});

export default BoardsManagement;

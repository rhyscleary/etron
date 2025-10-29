import React, { useState, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Chip, IconButton, Menu, Text, useTheme } from 'react-native-paper';

const BoardCard = ({
    board,
    isActive,
    itemCount,
    lastUpdated,
    onView,
    onEdit,
    onSetAsDashboard,
    onDuplicate,
    onShare,
    onDelete,
    style
}) => {
    const theme = useTheme();
    const [menuVisible, setMenuVisible] = useState(false);

    const cardStyle = useMemo(() => (
        [
            styles.card,
            style,
            isActive && { borderColor: theme.colors.primary, borderWidth: 2 }
        ]
    ), [isActive, style, theme.colors.primary]);

    const handleToggleMenu = () => setMenuVisible((prev) => !prev);
    const handleDismissMenu = () => setMenuVisible(false);

    const handleMenuAction = (callback) => () => {
        handleDismissMenu();
        callback?.(board);
    };

    return (
        <Card
            style={cardStyle}
            onPress={() => onView?.(board.id)}
        >
            <Card.Content>
                <View style={styles.headerRow}>
                    <View style={styles.titleRow}>
                        <Text variant="titleMedium" style={styles.title}>
                            {board.name}
                        </Text>
                        {isActive && (
                            <Chip
                                mode="flat"
                                compact
                                style={styles.activeChip}
                                textStyle={styles.activeChipText}
                            >
                                Dashboard
                            </Chip>
                        )}
                    </View>
                    <Menu
                        visible={menuVisible}
                        onDismiss={handleDismissMenu}
                        anchor={
                            <IconButton
                                icon="dots-vertical"
                                size={20}
                                onPress={handleToggleMenu}
                            />
                        }
                    >
                        <Menu.Item
                            leadingIcon="eye"
                            onPress={handleMenuAction(() => onView?.(board.id))}
                            title="View"
                        />
                        <Menu.Item
                            leadingIcon="pencil"
                            onPress={handleMenuAction(() => onEdit?.(board.id))}
                            title="Edit"
                        />
                        {!isActive && (
                            <Menu.Item
                                leadingIcon="view-dashboard"
                                onPress={handleMenuAction(onSetAsDashboard)}
                                title="Set as Dashboard"
                            />
                        )}
                        <Menu.Item
                            leadingIcon="content-copy"
                            onPress={handleMenuAction(onDuplicate)}
                            title="Duplicate"
                        />
                        <Menu.Item
                            leadingIcon="share-variant"
                            onPress={handleMenuAction(onShare)}
                            title="Share"
                        />
                        <Menu.Item
                            leadingIcon="delete"
                            onPress={handleMenuAction(onDelete)}
                            title="Delete"
                            titleStyle={{ color: theme.colors.error }}
                        />
                    </Menu>
                </View>

                {board.description ? (
                    <Text
                        variant="bodyMedium"
                        style={styles.description}
                        numberOfLines={2}
                    >
                        {board.description}
                    </Text>
                ) : null}

                <View style={styles.metaRow}>
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

const styles = StyleSheet.create({
    card: {
        marginBottom: 12
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start'
    },
    titleRow: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center'
    },
    title: {
        flex: 1
    },
    activeChip: {
        height: 24,
        marginLeft: 8
    },
    activeChipText: {
        fontSize: 10,
        lineHeight: 10
    },
    description: {
        opacity: 0.7,
        marginTop: 8,
        marginBottom: 12
    },
    metaRow: {
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
    }
});

export default React.memo(BoardCard);

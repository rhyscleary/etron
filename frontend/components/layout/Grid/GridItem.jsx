import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { View, StyleSheet, PanResponder } from 'react-native';
import { useTheme } from 'react-native-paper';

const GridItem = ({
    id,
    position,
    isDraggable = true,
    isDragging = false,
    isResizing = false,
    resizeEnabled = false,
    isResizeTarget = false,
    onItemLongPress,
    onDragStart,
    onDragMove,
    onDragEnd,
    onResizeStart,
    onResizeMove,
    onResizeEnd,
    content,
    style
}) => {
    const theme = useTheme();
    const [isPressed, setIsPressed] = useState(false);
    const positionRef = useRef(position);

    const MOVE_ACTIVATION_DISTANCE = 6;
    const LONG_PRESS_DURATION = 450;

    const longPressTimeoutRef = useRef(null);
    const longPressTriggeredRef = useRef(false);

    useEffect(() => {
        positionRef.current = position;
    }, [position]);

    useEffect(() => () => {
        if (longPressTimeoutRef.current) {
            clearTimeout(longPressTimeoutRef.current);
            longPressTimeoutRef.current = null;
        }
    }, []);

    const clearLongPressTimeout = useCallback(() => {
        if (longPressTimeoutRef.current) {
            clearTimeout(longPressTimeoutRef.current);
            longPressTimeoutRef.current = null;
        }
    }, []);

    const startLongPressTimer = useCallback(() => {
        if (!onItemLongPress) return;
        clearLongPressTimeout();
        longPressTriggeredRef.current = false;
        longPressTimeoutRef.current = setTimeout(() => {
            longPressTimeoutRef.current = null;
            longPressTriggeredRef.current = true;
            onItemLongPress?.(id);
        }, LONG_PRESS_DURATION);
    }, [clearLongPressTimeout, id, onItemLongPress]);

    const panResponder = useMemo(() => PanResponder.create({
        onStartShouldSetPanResponderCapture: () => {
            if (onItemLongPress) {
                startLongPressTimer();
            }
            return false;
        },
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (_, gestureState) => {
            const movedFarEnough =
                Math.abs(gestureState.dx) > MOVE_ACTIVATION_DISTANCE ||
                Math.abs(gestureState.dy) > MOVE_ACTIVATION_DISTANCE;

            if (movedFarEnough) {
                clearLongPressTimeout();
            }

            if (!isDraggable) return false;
            if (longPressTriggeredRef.current) return false;

            return movedFarEnough;
        },

        onPanResponderGrant: () => {
            clearLongPressTimeout();
            if (!isDraggable || longPressTriggeredRef.current) return;
            if (!isDraggable) return;
            setIsPressed(true);
            onDragStart?.(id, positionRef.current);
        },

        onPanResponderMove: (_, gestureState) => {
            if (!isDraggable || longPressTriggeredRef.current) return;
            onDragMove?.(id, gestureState.dx, gestureState.dy);
        },

        onPanResponderTerminationRequest: () => false,

        onPanResponderRelease: () => {
            clearLongPressTimeout();
            if (longPressTriggeredRef.current) {
                longPressTriggeredRef.current = false;
                return;
            }
            if (!isDraggable) return;
            setIsPressed(false);
            onDragEnd?.(id);
        },

        onPanResponderTerminate: () => {
            clearLongPressTimeout();
            if (longPressTriggeredRef.current) {
                longPressTriggeredRef.current = false;
                return;
            }
            if (!isDraggable) return;
            setIsPressed(false);
            onDragEnd?.(id);
        }
    }), [clearLongPressTimeout, id, isDraggable, onDragEnd, onDragMove, onDragStart, onItemLongPress, startLongPressTimer]);

    const resizePanResponders = useMemo(() => {
        if (!resizeEnabled) {
            return null;
        }

        const createResponder = (direction) => PanResponder.create({
            onStartShouldSetPanResponder: () => resizeEnabled,
            onMoveShouldSetPanResponder: () => resizeEnabled,
            onPanResponderGrant: () => {
                onResizeStart?.(id, direction, positionRef.current);
            },
            onPanResponderMove: (_, gestureState) => {
                onResizeMove?.(id, direction, gestureState.dx, gestureState.dy);
            },
            onPanResponderTerminationRequest: () => false,
            onPanResponderRelease: () => {
                onResizeEnd?.(id, direction);
            },
            onPanResponderTerminate: () => {
                onResizeEnd?.(id, direction);
            }
        });

        return {
            e: createResponder('e'),
            s: createResponder('s'),
            se: createResponder('se')
        };
    }, [resizeEnabled, id, onResizeStart, onResizeMove, onResizeEnd]);

    const isActive = isDragging || isPressed || isResizing || isResizeTarget;

    return (
        <View
            {...(isDraggable ? panResponder.panHandlers : {})}
            style={[
                styles.item,
                {
                    left: position.x,
                    top: position.y,
                    width: position.width,
                    height: position.height,
                    backgroundColor: theme.colors.surface,
                    borderColor: isResizeTarget ? 'rgba(99, 102, 241, 0.6)' : theme.colors.outline,
                    borderWidth: isResizeTarget ? 2 : 1,
                    elevation: isActive ? 8 : 2,
                    shadowOpacity: isActive ? 0.3 : 0.1,
                    zIndex: isActive ? 100 : 1
                },
                style
            ]}
        >
            <View style={styles.content}>
                {content}
            </View>
            {resizeEnabled && resizePanResponders && (
                <View pointerEvents="box-none" style={styles.resizeOverlay}>
                    <View
                        {...resizePanResponders.e.panHandlers}
                        style={[styles.resizeHandle, styles.handleEast]}
                    />
                    <View
                        {...resizePanResponders.s.panHandlers}
                        style={[styles.resizeHandle, styles.handleSouth]}
                    />
                    <View
                        {...resizePanResponders.se.panHandlers}
                        style={[styles.resizeHandle, styles.handleCorner]}
                    />
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    item: {
        position: 'absolute',
        borderRadius: 8,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 4
    },
    content: {
        flex: 1
    },
    resizeOverlay: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 20,
        pointerEvents: 'box-none'
    },
    resizeHandle: {
        position: 'absolute',
        backgroundColor: 'rgba(99, 102, 241, 0.25)',
        borderColor: 'rgba(99, 102, 241, 0.45)',
        borderWidth: 1,
        borderRadius: 6
    },
    handleEast: {
        width: 12,
        right: -6,
        top: '25%',
        bottom: '25%'
    },
    handleSouth: {
        height: 12,
        bottom: -6,
        left: '25%',
        right: '25%'
    },
    handleCorner: {
        width: 18,
        height: 18,
        right: -9,
        bottom: -9
    }
});

export default GridItem;

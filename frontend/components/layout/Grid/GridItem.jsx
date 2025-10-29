import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, StyleSheet, PanResponder } from 'react-native';
import { useTheme } from 'react-native-paper';

const GridItem = ({
    id,
    position,
    isDraggable = true,
    isDragging = false,
    onDragStart,
    onDragMove,
    onDragEnd,
    content,
    style
}) => {
    const theme = useTheme();
    const [isPressed, setIsPressed] = useState(false);
    const positionRef = useRef(position);

    useEffect(() => {
        positionRef.current = position;
    }, [position]);

    const panResponder = useMemo(() => PanResponder.create({
        onStartShouldSetPanResponder: () => isDraggable,
        onMoveShouldSetPanResponder: () => isDraggable,

        onPanResponderGrant: () => {
            setIsPressed(true);
            onDragStart?.(id, positionRef.current);
        },

        onPanResponderMove: (_, gestureState) => {
            onDragMove?.(id, gestureState.dx, gestureState.dy);
        },

        onPanResponderTerminationRequest: () => false,

        onPanResponderRelease: () => {
            setIsPressed(false);
            onDragEnd?.(id);
        },

        onPanResponderTerminate: () => {
            setIsPressed(false);
            onDragEnd?.(id);
        }
    }), [id, isDraggable, onDragStart, onDragMove, onDragEnd]);

    const isActive = isDragging || isPressed;

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
                    borderColor: theme.colors.outline,
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
        </View>
    );
};

const styles = StyleSheet.create({
    item: {
        position: 'absolute',
        borderRadius: 8,
        borderWidth: 1,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 4
    },
    content: {
        flex: 1
    }
});

export default GridItem;

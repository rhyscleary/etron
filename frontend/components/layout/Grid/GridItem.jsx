import React, { useRef, useState } from 'react';
import { View, StyleSheet, Animated, PanResponder } from 'react-native';
import { useTheme } from 'react-native-paper';

const GridItem = ({ id, position, isDraggable = true, isDragging = false, onDragStart, onDrag, onDragEnd, content, style }) => {
    const theme = useTheme();
    const pan = useRef(new Animated.ValueXY({ x: position.x, y: position.y })).current;
    const [isPressed, setIsPressed] = useState(false);

    React.useEffect(() => {
        if (!isDragging) {
            Animated.spring(pan, {
                toValue: { x: position.x, y: position.y },
                useNativeDriver: false,
                tension: 50,
                friction: 7
            }).start();
        }
    }, [position.x, position.y, isDragging]);

    const panResponder = React.useMemo(
        () => PanResponder.create({
            onStartShouldSetPanResponder: () => isDraggable,
            onMoveShouldSetPanResponder: () => isDraggable,
            
            onPanResponderGrant: () => {
                setIsPressed(true);
                onDragStart?.(id);
                pan.setOffset({ x: pan.x._value, y: pan.y._value });
                pan.setValue({ x: 0, y: 0 });
            },
            
            onPanResponderMove: (evt, gestureState) => {
                Animated.event(
                    [null, { dx: pan.x, dy: pan.y }],
                    { useNativeDriver: false }
                )(evt, gestureState);

                if (onDrag) {
                    const newX = pan.x._offset + gestureState.dx;
                    const newY = pan.y._offset + gestureState.dy;
                    onDrag(id, newX, newY);
                }
            },
            
            onPanResponderRelease: () => {
                setIsPressed(false);
                pan.flattenOffset();
                onDragEnd?.(id);
            }
        }),
        [isDraggable, id, onDragStart, onDrag, onDragEnd, pan]
    );

    return (
        <Animated.View
            {...(isDraggable ? panResponder.panHandlers : {})}
            style={[
                styles.item,
                {
                    width: position.width,
                    height: position.height,
                    transform: pan.getTranslateTransform(),
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.outline,
                    elevation: isPressed ? 8 : 2,
                    shadowOpacity: isPressed ? 0.3 : 0.1,
                    zIndex: isPressed ? 100 : 1
                },
                style
            ]}
        >
            <View style={styles.content}>
                {content}
            </View>
        </Animated.View>
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

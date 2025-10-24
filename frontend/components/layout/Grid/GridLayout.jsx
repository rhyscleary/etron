import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import GridItem from './GridItem';

const mapToLayoutItems = (items = []) =>
    items.map(item => ({
        id: item.id,
        x: item.x,
        y: item.y,
        w: item.w,
        h: item.h
    }));

const GridLayout = ({
    items = [],
    cols = 12,
    rowHeight = 100,
    margin = [10, 10],
    isDraggable = true,
    onLayoutChange,
    containerStyle,
    containerWidth
}) => {
    const [layout, setLayout] = useState(() => mapToLayoutItems(items));
    const [draggingId, setDraggingId] = useState(null);
    const prevItemsRef = useRef(items);
    const layoutRef = useRef(layout);

    useEffect(() => {
        layoutRef.current = layout;
    }, [layout]);

    useEffect(() => {
        if (draggingId) {
            prevItemsRef.current = items;
            return;
        }

        const prevItems = prevItemsRef.current;
        const prevMap = new Map(prevItems.map(item => [item.id, item]));
        let hasDifference = items.length !== prevItems.length;

        if (!hasDifference) {
            for (const item of items) {
                const prevItem = prevMap.get(item.id);
                if (!prevItem ||
                    prevItem.x !== item.x ||
                    prevItem.y !== item.y ||
                    prevItem.w !== item.w ||
                    prevItem.h !== item.h) {
                    hasDifference = true;
                    break;
                }
            }
        }

        if (hasDifference) {
            setLayout(mapToLayoutItems(items));
        }

        prevItemsRef.current = items;
    }, [items, draggingId]);

    const itemMap = useMemo(() => new Map(items.map(item => [item.id, item])), [items]);

    const screenWidth = Dimensions.get('window').width;
    const width = typeof containerWidth === 'number' ? containerWidth : screenWidth;

    const [marginX, marginY] = Array.isArray(margin) ? margin : [margin, margin];

    const colWidth = useMemo(() => {
        const availableWidth = width - marginX * Math.max(0, cols - 1);
        return cols > 0 ? Math.max(0, availableWidth / cols) : 0;
    }, [width, cols, marginX]);

    const getItemPosition = useCallback((item) => ({
        x: item.x * (colWidth + marginX),
        y: item.y * (rowHeight + marginY),
        width: item.w * colWidth + Math.max(0, item.w - 1) * marginX,
        height: item.h * rowHeight + Math.max(0, item.h - 1) * marginY
    }), [colWidth, rowHeight, marginX, marginY]);

    const getGridPosition = useCallback((x, y) => {
        const colUnit = colWidth + marginX;
        const rowUnit = rowHeight + marginY;

        if (colUnit <= 0 || rowUnit <= 0) {
            return { x: 0, y: 0 };
        }

        return {
            x: Math.max(0, Math.min(Math.round(x / colUnit), cols - 1)),
            y: Math.max(0, Math.round(y / rowUnit))
        };
    }, [colWidth, rowHeight, marginX, marginY, cols]);

    const hasCollision = useCallback((item, newX, newY, excludeId = null) => {
        return layout.some(layoutItem => {
            if (layoutItem.id === excludeId) return false;
            
            const itemRight = newX + item.w;
            const itemBottom = newY + item.h;
            const layoutRight = layoutItem.x + layoutItem.w;
            const layoutBottom = layoutItem.y + layoutItem.h;

            return !(newX >= layoutRight || itemRight <= layoutItem.x || 
                     newY >= layoutBottom || itemBottom <= layoutItem.y);
        });
    }, [layout]);

    const handleDrag = useCallback((id, x, y) => {
        const item = layoutRef.current.find(i => i.id === id);
        if (!item) return;

        const gridPos = getGridPosition(x, y);
        if (gridPos.x + item.w > cols) gridPos.x = cols - item.w;
        if (hasCollision(item, gridPos.x, gridPos.y, id)) return;

        setLayout(prevLayout =>
            prevLayout.map(i => i.id === id ? { ...i, x: gridPos.x, y: gridPos.y } : i)
        );
    }, [getGridPosition, hasCollision, cols]);

    const containerHeight = useMemo(() => {
        if (layout.length === 0) return rowHeight;
        const maxY = Math.max(...layout.map(item => item.y + item.h));
        return maxY * rowHeight + Math.max(0, maxY - 1) * marginY;
    }, [layout, rowHeight, marginY]);

    return (
        <View style={[styles.container, { height: containerHeight, width }, containerStyle]}>
            {layout.map(item => {
                const sourceItem = itemMap.get(item.id);
                if (!sourceItem) {
                    return null;
                }

                return (
                    <GridItem
                        key={item.id}
                        id={item.id}
                        position={getItemPosition(item)}
                        isDraggable={isDraggable}
                        isDragging={draggingId === item.id}
                        onDragStart={() => setDraggingId(item.id)}
                        onDrag={handleDrag}
                        onDragEnd={() => {
                            setDraggingId(null);
                            onLayoutChange?.(layoutRef.current);
                        }}
                        content={sourceItem.content}
                        style={sourceItem.style}
                    />
                );
            })}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'relative',
        backgroundColor: 'transparent'
    }
});

export default GridLayout;

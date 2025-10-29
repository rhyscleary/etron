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
    const [dragPreview, setDragPreview] = useState(null);
    const prevItemsRef = useRef(items);
    const layoutRef = useRef(layout);
    const dragPreviewRef = useRef(null);
    const dragStateRef = useRef(null);

    const updateLayoutState = useCallback((updater) => {
        setLayout(prevLayout => {
            const nextLayout = typeof updater === 'function' ? updater(prevLayout) : updater;
            layoutRef.current = nextLayout;
            return nextLayout;
        });
    }, []);

    useEffect(() => {
        dragPreviewRef.current = dragPreview;
    }, [dragPreview]);

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
            const mappedLayout = mapToLayoutItems(items);
            layoutRef.current = mappedLayout;
            setLayout(mappedLayout);
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

    const getGridPositionFromPixels = useCallback((pixelX, pixelY) => {
        const colUnit = colWidth + marginX;
        const rowUnit = rowHeight + marginY;

        if (colUnit <= 0 || rowUnit <= 0) {
            return {
                rawX: 0,
                rawY: 0,
                snappedX: 0,
                snappedY: 0
            };
        }

        const rawX = pixelX / colUnit;
        const rawY = pixelY / rowUnit;

        return {
            rawX,
            rawY,
            snappedX: Math.round(rawX),
            snappedY: Math.round(rawY)
        };
    }, [colWidth, marginX, rowHeight, marginY]);

    const hasCollision = useCallback((item, newX, newY, excludeId = null) => {
        const currentLayout = layoutRef.current;

        return currentLayout.some(layoutItem => {
            if (layoutItem.id === excludeId) return false;
            
            const itemRight = newX + item.w;
            const itemBottom = newY + item.h;
            const layoutRight = layoutItem.x + layoutItem.w;
            const layoutBottom = layoutItem.y + layoutItem.h;

            return !(newX >= layoutRight || itemRight <= layoutItem.x || 
                     newY >= layoutBottom || itemBottom <= layoutItem.y);
        });
    }, []);

    const handleDragStart = useCallback((id, position) => {
        const item = layoutRef.current.find(i => i.id === id);
        if (!item) return;

        setDraggingId(id);
        dragStateRef.current = {
            id,
            item,
            originPx: { x: position.x, y: position.y }
        };
        const initialPreview = { id, x: item.x, y: item.y, snappedX: item.x, snappedY: item.y };
        dragPreviewRef.current = initialPreview;
        setDragPreview(initialPreview);
    }, []);

    const handleDragMove = useCallback((id, dx, dy) => {
        const dragState = dragStateRef.current;
        if (!dragState || dragState.id !== id) return;

        const { item, originPx } = dragState;
        const pixelX = originPx.x + dx;
        const pixelY = originPx.y + dy;

        const gridPos = getGridPositionFromPixels(pixelX, pixelY);
    const clampedRawX = Math.max(0, Math.min(gridPos.rawX, cols - item.w));
    const clampedRawY = Math.max(0, gridPos.rawY);
    const snappedX = Math.max(0, Math.min(Math.round(clampedRawX), cols - item.w));
    const snappedY = Math.max(0, Math.round(clampedRawY));

        const currentPreview = dragPreviewRef.current;
        if (
            currentPreview &&
            currentPreview.id === id &&
            Math.abs(currentPreview.x - clampedRawX) < 0.01 &&
            Math.abs(currentPreview.y - clampedRawY) < 0.01
        ) {
            return;
        }

        const nextPreview = { id, x: clampedRawX, y: clampedRawY, snappedX, snappedY };
        dragPreviewRef.current = nextPreview;

        setDragPreview(prev => {
            if (
                prev &&
                prev.id === id &&
                Math.abs(prev.x - clampedRawX) < 0.01 &&
                Math.abs(prev.y - clampedRawY) < 0.01
            ) {
                return prev;
            }
            return nextPreview;
        });
    }, [cols, getGridPositionFromPixels]);

    const handleDragEnd = useCallback((id) => {
        const dragState = dragStateRef.current;
        const preview = dragPreviewRef.current;

        dragStateRef.current = null;
        setDraggingId(null);

        if (!dragState) {
            dragPreviewRef.current = null;
            setDragPreview(null);
            return;
        }

        if (!preview || preview.id !== id) {
            dragPreviewRef.current = null;
            setDragPreview(null);
            return;
        }

        const { item } = dragState;

        const targetX = Math.max(0, Math.min(Math.round(preview.snappedX ?? preview.x), cols - item.w));
        const targetY = Math.max(0, Math.round(preview.snappedY ?? preview.y));

        if (hasCollision(item, targetX, targetY, id)) {
            dragPreviewRef.current = null;
            setDragPreview(null);
            return;
        }

        if (targetX === item.x && targetY === item.y) {
            dragPreviewRef.current = null;
            setDragPreview(null);
            return;
        }

        updateLayoutState(prevLayout => prevLayout.map(layoutItem =>
            layoutItem.id === id ? { ...layoutItem, x: targetX, y: targetY } : layoutItem
        ));

        dragPreviewRef.current = null;
        setDragPreview(null);
        setTimeout(() => {
            onLayoutChange?.(layoutRef.current);
        }, 0);
    }, [hasCollision, onLayoutChange, updateLayoutState]);

    const previewHighlightPosition = useMemo(() => {
        if (!dragPreview) return null;

        const layoutItem = layout.find(item => item.id === dragPreview.id);
        if (!layoutItem) return null;

        const clampedX = Math.max(0, Math.min((dragPreview.snappedX ?? Math.round(dragPreview.x)), cols - layoutItem.w));
        const clampedY = Math.max(0, dragPreview.snappedY ?? Math.round(dragPreview.y));

        return getItemPosition({ ...layoutItem, x: clampedX, y: clampedY });
    }, [dragPreview, layout, cols, getItemPosition]);

    const containerHeight = useMemo(() => {
        const effectiveLayout = dragPreview
            ? layout.map(item => item.id === dragPreview.id
                ? { ...item, y: dragPreview.y }
                : item)
            : layout;

        if (effectiveLayout.length === 0) return rowHeight;

        const maxY = Math.max(...effectiveLayout.map(item => item.y + item.h));
        const normalizedMaxY = Math.ceil(maxY);
        return normalizedMaxY * rowHeight + Math.max(0, normalizedMaxY - 1) * marginY;
    }, [layout, dragPreview, rowHeight, marginY]);

    return (
        <View style={[styles.container, { height: containerHeight, width }, containerStyle]}>
            {previewHighlightPosition && (
                <View
                    pointerEvents="none"
                    style={[
                        styles.snapHighlight,
                        {
                            left: previewHighlightPosition.x,
                            top: previewHighlightPosition.y,
                            width: previewHighlightPosition.width,
                            height: previewHighlightPosition.height
                        }
                    ]}
                />
            )}
            {layout.map(item => {
                const sourceItem = itemMap.get(item.id);
                if (!sourceItem) {
                    return null;
                }

                const preview = dragPreview && dragPreview.id === item.id ? dragPreview : null;
                const displayItem = preview
                    ? { ...item, x: preview.x, y: preview.y }
                    : item;
                const position = getItemPosition(displayItem);

                return (
                    <GridItem
                        key={item.id}
                        id={item.id}
                        position={position}
                        isDraggable={isDraggable}
                        isDragging={draggingId === item.id}
                        onDragStart={handleDragStart}
                        onDragMove={handleDragMove}
                        onDragEnd={handleDragEnd}
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
    },
    snapHighlight: {
        position: 'absolute',
        borderRadius: 12,
        backgroundColor: 'rgba(79, 70, 229, 0.08)',
        borderWidth: 1,
        borderColor: 'rgba(79, 70, 229, 0.14)'
    }
});

export default GridLayout;

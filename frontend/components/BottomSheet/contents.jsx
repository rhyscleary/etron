import React, { useMemo, useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme, List, Button } from 'react-native-paper';
import { BottomSheetVirtualizedList } from '@gorhom/bottom-sheet';
import SheetHeader from './header';

const Contents = ({
  data,
  renderItem,
  keyExtractor,
  getItem,
  getItemCount,
  headerComponent,
  title,
  headerActionLabel,
  onHeaderActionPress,
  // header customisation
  showClose = true,
  onClose,
  headerChildren,
  onItemPress,
  itemTitleExtractor,
  theme,
  // empty state
  emptyComponent,
  extraBottomPadding = 0,
  closeIcon,
}) => {
  const effectiveKeyExtractor = useCallback(
    keyExtractor || ((item, index) => (item?.id?.toString?.() ?? String(index))),
    [keyExtractor]
  );
  const effectiveGetItemCount = useCallback(
    getItemCount || ((arr) => arr?.length ?? 0),
    [getItemCount]
  );
  const effectiveGetItem = useCallback(
    getItem || ((arr, index) => arr[index]),
    [getItem]
  );

  const Header = useMemo(() => {
    if (headerComponent) return headerComponent;
    if (!title && !headerActionLabel && !showClose && !headerChildren) return undefined;
    return () => (
      <SheetHeader
        title={title}
        actionLabel={headerActionLabel}
        onActionPress={onHeaderActionPress}
        showClose={showClose}
        onClose={onClose}
        closeIcon={closeIcon}
      >
        {headerChildren}
      </SheetHeader>
    );
  }, [headerComponent, title, headerActionLabel, onHeaderActionPress, showClose, onClose, headerChildren, closeIcon]);

  const defaultRenderItem = useCallback(
    ({ item, index }) => {
      const titleText = itemTitleExtractor
        ? itemTitleExtractor(item, index)
        : typeof item === 'string' || typeof item === 'number'
        ? String(item)
        : JSON.stringify(item);
      return (
        <View
          style={[
            styles.listCard,
            { backgroundColor: theme.colors.buttonBackground },
          ]}
        >
          <List.Item
            title={titleText}
            onPress={onItemPress ? () => onItemPress(item, index) : undefined}
            style={styles.listItem}
          />
        </View>
      );
    },
    [itemTitleExtractor, onItemPress, theme.colors.buttonBackground]
  );

  return (
    <BottomSheetVirtualizedList
      data={data}
      keyExtractor={effectiveKeyExtractor}
      getItemCount={effectiveGetItemCount}
      getItem={effectiveGetItem}
      ListHeaderComponent={Header}
      ListEmptyComponent={emptyComponent}
      renderItem={renderItem || defaultRenderItem}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={[
        styles.contentContainer,
        // base + extra bottom padding
        { paddingBottom: (styles.contentContainer.paddingVertical || 0) + extraBottomPadding },
      ]}
    />
  );
};

const styles = StyleSheet.create({
  contentContainer: {
    paddingVertical: 2,
    paddingHorizontal: 12,
  },
  listCard: {
    borderRadius: 8,
    overflow: 'hidden',
    marginVertical: 6,
    marginHorizontal: 0,
    elevation: 1,
  },
  listItem: {
    paddingVertical: 6,
  },
});

export default React.memo(Contents);

import React, { useMemo, useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme, List, Button } from 'react-native-paper';
import { BottomSheetVirtualizedList } from '@gorhom/bottom-sheet';

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
  onItemPress,
  itemTitleExtractor,
  theme,
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
    if (!title && !headerActionLabel) return undefined;
    return () => (
      <View style={styles.headerRow}>
        {title ? (
          <List.Subheader style={styles.headerTitle}>
            {typeof title === 'string' ? title : title}
          </List.Subheader>
        ) : (
          <View />
        )}
        {headerActionLabel && typeof onHeaderActionPress === 'function' ? (
          <Button mode="text" compact onPress={onHeaderActionPress}>
            {headerActionLabel}
          </Button>
        ) : null}
      </View>
    );
  }, [headerComponent, title, headerActionLabel, onHeaderActionPress]);

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
      renderItem={renderItem || defaultRenderItem}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={styles.contentContainer}
    />
  );
};

const styles = StyleSheet.create({
  contentContainer: {
    paddingVertical: 16,
    paddingHorizontal: 12,
  },
  headerRow: {
    paddingHorizontal: 12,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    paddingHorizontal: 0,
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

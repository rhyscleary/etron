import React, { useMemo, useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme, List } from 'react-native-paper';
import { BottomSheetVirtualizedList } from '@gorhom/bottom-sheet';

const CONTENT_VERTICAL_PADDING = 2;

const Contents = ({
  data,
  renderItem,
  keyExtractor,
  getItem,
  getItemCount,
  onItemPress,
  itemTitleExtractor,
  theme,
  // empty state
  emptyComponent,
  extraBottomPadding = 0,
  enableSearch = false,
  searchQuery = '',
}) => {
  const themeFromContext = useTheme();
  const resolvedTheme = theme ?? themeFromContext;
  const resolvedColors = resolvedTheme?.colors ?? {};
  const { buttonBackground, surfaceVariant, surface } = resolvedColors;

  const defaultKeyExtractor = useCallback((item, index) => (item?.id?.toString?.() ?? String(index)), []);
  const effectiveKeyExtractor = useMemo(
    () => keyExtractor ?? defaultKeyExtractor,
    [keyExtractor, defaultKeyExtractor]
  );

  const defaultGetItemCount = useCallback((arr) => arr?.length ?? 0, []);
  const effectiveGetItemCount = useMemo(
    () => getItemCount ?? defaultGetItemCount,
    [getItemCount, defaultGetItemCount]
  );

  const defaultGetItem = useCallback((arr, index) => arr[index], []);
  const effectiveGetItem = useMemo(
    () => getItem ?? defaultGetItem,
    [getItem, defaultGetItem]
  );

  const defaultItemBackgroundColor = useMemo(
    () => buttonBackground || surfaceVariant || surface || '#2c2c2c',
    [buttonBackground, surfaceVariant, surface]
  );

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
            { backgroundColor: defaultItemBackgroundColor },
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
    [itemTitleExtractor, onItemPress, defaultItemBackgroundColor]
  );

  const filteredData = useMemo(() => {
    if (!enableSearch) return data;
    if (!searchQuery.trim()) return data;
    const lowered = searchQuery.toLowerCase();
    const count = effectiveGetItemCount(data);
    const results = [];
    for (let i = 0; i < count; i++) {
      const item = effectiveGetItem(data, i);
      let titleText;
      if (itemTitleExtractor) {
        titleText = itemTitleExtractor(item, i);
      } else if (typeof item === 'string' || typeof item === 'number') {
        titleText = String(item);
      } else if (item?.label) {
        titleText = item.label;
      } else {
        try { titleText = JSON.stringify(item); } catch { titleText = ''; }
      }
      if (titleText?.toLowerCase?.().includes(lowered)) {
        results.push(item);
      }
    }
    return results;
  }, [enableSearch, searchQuery, data, effectiveGetItemCount, effectiveGetItem, itemTitleExtractor]);

  const contentPaddingBottom = useMemo(
    () => CONTENT_VERTICAL_PADDING + (Number.isFinite(extraBottomPadding) ? extraBottomPadding : 0),
    [extraBottomPadding]
  );

  const contentContainerStyle = useMemo(
    () => [styles.contentContainer, { paddingBottom: contentPaddingBottom }],
    [contentPaddingBottom]
  );

  return (
    <BottomSheetVirtualizedList
      style={styles.wrapper}
      data={filteredData}
      keyExtractor={effectiveKeyExtractor}
      getItemCount={effectiveGetItemCount}
      getItem={effectiveGetItem}
      ListEmptyComponent={emptyComponent}
      renderItem={renderItem || defaultRenderItem}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={contentContainerStyle}
    />
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  contentContainer: {
    paddingVertical: CONTENT_VERTICAL_PADDING,
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

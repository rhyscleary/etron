import React, { useMemo, useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme, List } from 'react-native-paper';
import { BottomSheetFlatList } from '@gorhom/bottom-sheet';

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
  textColor,
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

  const defaultKeyExtractor = useCallback((item, index) => 
    item?.id?.toString?.() ?? String(index), []);
  
  const defaultGetItemCount = useCallback((arr) => arr?.length ?? 0, []);
  
  const defaultGetItem = useCallback((arr, index) => arr[index], []);

  const effectiveKeyExtractor = keyExtractor || defaultKeyExtractor;
  const effectiveGetItemCount = getItemCount || defaultGetItemCount;
  const effectiveGetItem = getItem || defaultGetItem;

  const defaultItemBackgroundColor = 
    buttonBackground || surfaceVariant || surface || '#2c2c2c';

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
            titleStyle={textColor ? { color: textColor } : undefined}
          />
        </View>
      );
    },
    [itemTitleExtractor, onItemPress, defaultItemBackgroundColor, textColor]
  );

  const extractTitle = useCallback((item, index) => {
    if (itemTitleExtractor) return itemTitleExtractor(item, index);
    if (typeof item === 'string' || typeof item === 'number') return String(item);
    try { return JSON.stringify(item); } catch { return ''; }
  }, [itemTitleExtractor]);

  const filteredData = useMemo(() => {
    if (!enableSearch || !searchQuery.trim()) return data;
    
    const lowered = searchQuery.toLowerCase();
    const count = effectiveGetItemCount(data);
    const results = [];
    
    for (let i = 0; i < count; i++) {
      const item = effectiveGetItem(data, i);
      const titleText = extractTitle(item, i);
      if (titleText?.toLowerCase?.().includes(lowered)) {
        results.push(item);
      }
    }
    return results;
  }, [enableSearch, searchQuery, data, effectiveGetItemCount, effectiveGetItem, extractTitle]);

  const contentPaddingBottom = CONTENT_VERTICAL_PADDING + (Number.isFinite(extraBottomPadding) ? extraBottomPadding : 0);

  const contentContainerStyle = useMemo(
    () => [styles.contentContainer, { paddingBottom: contentPaddingBottom }],
    [contentPaddingBottom]
  );

  return (
    <BottomSheetFlatList
      style={styles.wrapper}
      data={filteredData}
      keyExtractor={effectiveKeyExtractor}
      ListEmptyComponent={emptyComponent}
      renderItem={renderItem || defaultRenderItem}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
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

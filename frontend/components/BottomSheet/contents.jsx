import React, { useMemo, useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme, List } from 'react-native-paper';
import { BottomSheetVirtualizedList } from '@gorhom/bottom-sheet';
import SheetHeader, { SHEET_HEADER_DISPLAY_NAME } from './header';
import ContentsSearchBar from './contents-search-bar';

const CONTENT_VERTICAL_PADDING = 2;

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
  enableSearch = false,
  searchPlaceholder = 'Search',
  onSearchFocus,
  onSearchBlur,
}) => {
  const [query, setQuery] = useState('');
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
    if (!query.trim()) return data;
    const lowered = query.toLowerCase();
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
  }, [enableSearch, query, data, effectiveGetItemCount, effectiveGetItem, itemTitleExtractor]);

  const headerContent = useMemo(() => {
    if (headerComponent) {
      return headerComponent;
    }

    if (!title && !headerActionLabel && !showClose && !headerChildren) return null;

    return (
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
  }, [headerComponent, title, headerActionLabel, onHeaderActionPress, showClose, onClose, closeIcon, headerChildren]);

  const listHeaderComponent = useMemo(() => {
    if (!headerContent && !enableSearch) return null;
    return (
      <View pointerEvents="box-none" style={styles.headerWrapper}>
        {headerContent}
        {enableSearch && (
          <View style={styles.searchWrapper}>
            <ContentsSearchBar
              value={query}
              onChangeText={setQuery}
              placeholder={searchPlaceholder}
              onFocus={onSearchFocus}
              onBlur={onSearchBlur}
            />
          </View>
        )}
      </View>
    );
  }, [headerContent, enableSearch, query, searchPlaceholder, onSearchFocus, onSearchBlur]);

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
      ListHeaderComponent={listHeaderComponent}
    />
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  headerWrapper: {
    paddingHorizontal: 12,
    paddingTop: 4,
  },
  searchWrapper: {
    marginTop: 4,
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

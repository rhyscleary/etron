import React, { useMemo, useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme, List, Button } from 'react-native-paper';
import { BottomSheetVirtualizedList } from '@gorhom/bottom-sheet';
import SheetHeader from './header';
import ContentsSearchBar from './contents-search-bar';

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
  // local search state
  const [query, setQuery] = useState('');
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

  const HeaderElement = useMemo(() => {
    if (headerComponent) return headerComponent;
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

  // filter logic
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

  return (
    <View style={styles.wrapper}>
      {HeaderElement}
      {enableSearch && (
        <ContentsSearchBar
          value={query}
          onChangeText={setQuery}
          placeholder={searchPlaceholder}
          onFocus={onSearchFocus}
          onBlur={onSearchBlur}
        />
      )}
      <BottomSheetVirtualizedList
        data={filteredData}
        keyExtractor={effectiveKeyExtractor}
        getItemCount={(arr) => effectiveGetItemCount(arr)}
        getItem={(arr, index) => effectiveGetItem(arr, index)}
        ListEmptyComponent={emptyComponent}
        renderItem={renderItem || defaultRenderItem}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.contentContainer,
          { paddingBottom: (styles.contentContainer.paddingVertical || 0) + extraBottomPadding },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
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

import React, { useMemo, useCallback, useState, useRef, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme, List } from 'react-native-paper';
import { BottomSheetVirtualizedList } from '@gorhom/bottom-sheet';
import SheetHeader, { SHEET_HEADER_DISPLAY_NAME } from './header';
import ContentsSearchBar, { CONTENTS_SEARCH_BAR_BOTTOM_MARGIN } from './contents-search-bar';

const CONTENT_VERTICAL_PADDING = 2;

const resolveVerticalMargins = (styleInput, fallbackBottom = 0) => {
  const flattened = StyleSheet.flatten(styleInput);
  if (!flattened) return fallbackBottom;
  const base = Number.isFinite(flattened.margin) ? flattened.margin : undefined;
  const vertical = Number.isFinite(flattened.marginVertical) ? flattened.marginVertical : base;
  const top = Number.isFinite(flattened.marginTop) ? flattened.marginTop : vertical ?? base ?? 0;
  const bottom = Number.isFinite(flattened.marginBottom)
    ? flattened.marginBottom
    : vertical ?? base ?? fallbackBottom;
  const topValue = Number.isFinite(top) ? top : 0;
  const bottomValue = Number.isFinite(bottom) ? bottom : 0;
  return topValue + bottomValue;
};

const isSheetHeaderElement = (element) => {
  if (!React.isValidElement(element)) return false;
  const { type } = element;
  if (!type) return false;
  if (type === SheetHeader) return true;
  if (type?.displayName === SHEET_HEADER_DISPLAY_NAME) return true;
  if (type?.type === SheetHeader) return true;
  if (type?.type?.displayName === SHEET_HEADER_DISPLAY_NAME) return true;
  return false;
};

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
  onContentHeightChange,
}) => {
  // local search state
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

  const metricsRef = useRef({ header: 0, search: 0, list: 0 });
  const lastHeightRef = useRef(null);

  const emitHeight = useCallback(() => {
    if (typeof onContentHeightChange !== 'function') return;
    const { header, search, list } = metricsRef.current;
    // chrome = non-scrollable UI elements (header + search bar)
    // NOTE: Requirement: header height MUST be included in intrinsic content height used for snapping
    // so we always add it explicitly here.
    const chrome = (Number.isFinite(header) ? header : 0) + (Number.isFinite(search) ? search : 0);
    const padding = Number.isFinite(extraBottomPadding) ? extraBottomPadding : 0;
    const listPortion = Number.isFinite(list) ? list : 0;
    const total = chrome + listPortion + padding;
    if (!Number.isFinite(total) || total <= 0) return;
    if (lastHeightRef.current === total) return;
    lastHeightRef.current = total;
    onContentHeightChange(total);
  }, [onContentHeightChange, extraBottomPadding]);

  const updateMetric = useCallback((key, value) => {
    const normalized = Number.isFinite(value) ? Math.max(0, value) : 0;
    const previous = metricsRef.current[key];
    if (previous === normalized) return;
    metricsRef.current[key] = normalized;
    emitHeight();
  }, [emitHeight]);

  const handleHeaderHeightChange = useCallback((height) => {
    updateMetric('header', height);
  }, [updateMetric]);

  const headerContent = useMemo(() => {
    if (headerComponent) {
      if (React.isValidElement(headerComponent)) {
        if (isSheetHeaderElement(headerComponent)) {
          const originalOnHeightChange = headerComponent.props?.onHeightChange;
          return React.cloneElement(headerComponent, {
            onHeightChange: (height) => {
              updateMetric('header', height);
              if (typeof originalOnHeightChange === 'function') {
                originalOnHeightChange(height);
              }
            },
          });
        }
        const originalOnLayout = headerComponent.props?.onLayout;
        const elementStyle = headerComponent.props?.style;
        return React.cloneElement(headerComponent, {
          onLayout: (event) => {
            const height = event?.nativeEvent?.layout?.height ?? 0;
            const margins = resolveVerticalMargins(elementStyle, 0);
            updateMetric('header', height + margins);
            if (typeof originalOnLayout === 'function') {
              originalOnLayout(event);
            }
          },
        });
      }
      return (
        <View
          onLayout={(event) => {
            const height = event?.nativeEvent?.layout?.height ?? 0;
            updateMetric('header', height);
          }}
        >
          {headerComponent}
        </View>
      );
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
        onHeightChange={handleHeaderHeightChange}
      >
        {headerChildren}
      </SheetHeader>
    );
  }, [headerComponent, title, headerActionLabel, onHeaderActionPress, showClose, onClose, closeIcon, headerChildren, updateMetric, handleHeaderHeightChange]);

  const handleSearchLayout = useCallback((event) => {
    const height = event?.nativeEvent?.layout?.height ?? 0;
    const augmented = height + CONTENTS_SEARCH_BAR_BOTTOM_MARGIN;
    updateMetric('search', augmented);
  }, [updateMetric]);

  const handleContentSizeChange = useCallback((width, height) => {
    const safeHeight = typeof height === 'number' ? height : 0;
    updateMetric('list', safeHeight);
  }, [updateMetric]);

  useEffect(() => {
    if (lastHeightRef.current != null) {
      lastHeightRef.current = null;
      emitHeight();
    }
  }, [emitHeight, extraBottomPadding]);

  const hasHeader = Boolean(headerContent);

  useEffect(() => {
    if (!hasHeader) {
      updateMetric('header', 0);
    }
  }, [hasHeader, updateMetric]);

  // If header height arrives after list height (common on first paint), force re-emit
  useEffect(() => {
    const { header, list } = metricsRef.current;
    if (header > 0 && list > 0) {
      emitHeight();
    }
  }, [emitHeight, metricsRef.current.header]);

  useEffect(() => {
    if (!enableSearch) {
      updateMetric('search', 0);
    }
  }, [enableSearch, updateMetric]);

  const contentPaddingBottom = useMemo(
    () => CONTENT_VERTICAL_PADDING + (Number.isFinite(extraBottomPadding) ? extraBottomPadding : 0),
    [extraBottomPadding]
  );

  const contentContainerStyle = useMemo(
    () => [styles.contentContainer, { paddingBottom: contentPaddingBottom }],
    [contentPaddingBottom]
  );

  return (
    <View style={styles.wrapper}>
      <View pointerEvents="box-none">
        {headerContent}
        {enableSearch && (
          <View onLayout={handleSearchLayout}>
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
      <BottomSheetVirtualizedList
        data={filteredData}
        keyExtractor={effectiveKeyExtractor}
        getItemCount={effectiveGetItemCount}
        getItem={effectiveGetItem}
        ListEmptyComponent={emptyComponent}
        renderItem={renderItem || defaultRenderItem}
        onContentSizeChange={handleContentSizeChange}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={contentContainerStyle}
      />
    </View>
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

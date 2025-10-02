import React, { useCallback, useMemo, useRef, useEffect, useState } from 'react';
import { StyleSheet, View, Dimensions, Keyboard, Platform } from 'react-native';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Backdrop from './backdrop';
import Footer from './footer';
import Background from './background';
import Handle from './handle';
import Contents from './contents';
import SheetHeader from './header';

const MAX_INDEX_CAP = 1;
const DEFAULT_SNAP_POINTS = ['30%', '80%'];
const MIN_SHEET_HEIGHT = 240;

const deriveMaxSheetHeight = (topInset = 0, windowMetrics) => {
  const windowHeight = windowMetrics?.height ?? Dimensions.get('window').height;
  return Math.max(MIN_SHEET_HEIGHT, windowHeight - topInset);
};

const runWithDoubleRaf = (work) => {
  if (typeof work !== 'function') return;
  if (typeof requestAnimationFrame !== 'function') {
    work();
    return;
  }
  requestAnimationFrame(() => {
    requestAnimationFrame(work);
  });
};

const CustomBottomSheet = ({
  onChange,
  data = [1, 2, 3],
  renderItem,
  keyExtractor,
  getItem,
  getItemCount,
  snapPoints,
  initialIndex,
  // header
  title,
  headerComponent,
  headerActionLabel,
  onHeaderActionPress,
  showClose = true,
  onClose,
  headerChildren,
  // variants
  variant = 'standard', // 'standard' | 'compact'
  closeIcon = 'close',
  // handle appearance
  handleSolidBackground = false,
  // item interactions
  onItemPress,
  itemTitleExtractor,
  // empty state
  emptyComponent,
  // search
  enableSearch = false,
  searchPlaceholder,
  footerVariant = 'default', // 'default' | 'translucent' | 'minimal' | 'none'
  footerPlacement = 'right', // 'left' | 'center' | 'right'
  autoExpandOnSearchFocus = true,
  autoExpandOnKeyboardShow = true,
  // custom non-list content
  customContent,
  // granular snapping: provide a pixel step to create dense snap points so the sheet effectively
  // snaps near the exact released height instead of large preset jumps.
  granularSnapStep,
  // When true (default) cap the expanded height to intrinsic content height (no empty space above content)
  capToContentHeight = true,
  containerStyle: overrideContainerStyle,
  ...restProps
}) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const topInset = insets?.top ?? 0;
  const [searchActive, setSearchActive] = useState(false);
  // measured content height (intrinsic) used to cap max snap height
  const [contentHeight, setContentHeight] = useState(null);
  const [maxSheetHeight, setMaxSheetHeight] = useState(() => deriveMaxSheetHeight(topInset));
  // ref
  const bottomSheetRef = useRef(null);
  const currentIndexRef = useRef(null); // track latest known index

  const contentHeightRef = useRef(null);
  const lastAppliedInitialIndexRef = useRef(null);
  const lastIndexRef = useRef(0);
  const latestResolvedIndexRef = useRef(-1);

  const computeMaxSheetHeight = useCallback(
    (windowMetrics) => deriveMaxSheetHeight(topInset, windowMetrics),
    [topInset]
  );

  useEffect(() => {
    const next = computeMaxSheetHeight();
    setMaxSheetHeight((prev) => (prev === next ? prev : next));
    setContentHeight((prev) => {
      if (prev == null) return prev;
      const normalized = Math.min(prev, next);
      if (normalized === prev) return prev;
      contentHeightRef.current = normalized;
      return normalized;
    });
  }, [computeMaxSheetHeight]);

  useEffect(() => {
    const handler = ({ window }) => {
      const next = computeMaxSheetHeight(window);
      setMaxSheetHeight((prev) => (prev === next ? prev : next));
      setContentHeight((prev) => {
        if (prev == null) return prev;
        const normalized = Math.min(prev, next);
        if (normalized === prev) return prev;
        contentHeightRef.current = normalized;
        return normalized;
      });
    };

    const subscription = Dimensions.addEventListener('change', handler);
    return () => {
      if (subscription?.remove) {
        subscription.remove();
      } else if (Dimensions.removeEventListener) {
        Dimensions.removeEventListener('change', handler);
      }
    };
  }, [computeMaxSheetHeight]);

  const registerContentHeight = useCallback((height, options = {}) => {
    const { allowDecrease = false } = options;
    if (typeof height !== 'number' || !Number.isFinite(height) || height <= 0) return;
    const normalized = Math.min(Math.ceil(height), maxSheetHeight);

    const previousRecorded = contentHeightRef.current;
    if (!allowDecrease && previousRecorded != null && normalized < previousRecorded) {
      return;
    }
    if (previousRecorded != null && Math.abs(previousRecorded - normalized) <= 1) {
      return;
    }

    contentHeightRef.current = normalized;
    setContentHeight((prev) => {
      if (prev == null) return normalized;
      if (!allowDecrease && normalized < prev) return prev;
      if (Math.abs(prev - normalized) <= 1) return prev;
      return normalized;
    });
  }, [maxSheetHeight]);

  const normalizeSnapValue = useCallback((value) => {
    if (value == null) return null;
    if (typeof value === 'string' && value.endsWith('%')) {
      const numeric = parseFloat(value.slice(0, -1));
      if (!Number.isNaN(numeric)) {
        return Math.round(maxSheetHeight * (numeric / 100));
      }
    }
    if (typeof value === 'number') {
      if (value > 0 && value <= 1) {
        return Math.round(maxSheetHeight * value);
      }
      return Math.round(value);
    }
    return null;
  }, [maxSheetHeight]);

  const baseSnapPoints = useMemo(() => {
    const seeds = (snapPoints?.length ? snapPoints : DEFAULT_SNAP_POINTS).slice(0, 2);
    const parsed = seeds
      .map(normalizeSnapValue)
      .filter((v) => typeof v === 'number' && v > 0)
      .sort((a, b) => a - b);

    let collapsed = parsed[0] ?? Math.round(maxSheetHeight * 0.3);
    collapsed = Math.min(collapsed, Math.max(maxSheetHeight - 1, 1));
    collapsed = Math.max(collapsed, 1);

    const expandedCandidate = parsed.find((v) => v > collapsed) ?? parsed[1];
    const fallbackExpanded = Math.round(maxSheetHeight * 0.8);
    let expanded = expandedCandidate ?? fallbackExpanded;
    expanded = Math.max(expanded, collapsed + 1);
    expanded = Math.min(expanded, maxSheetHeight);

    return [collapsed, expanded];
  }, [snapPoints, normalizeSnapValue, maxSheetHeight]);

  const finalSnapPoints = useMemo(() => {
    if (!baseSnapPoints.length) return [];

    let [collapsed, baseExpanded] = baseSnapPoints;
    let expanded = baseExpanded;

    if (contentHeight != null) {
      const desiredRaw = Math.ceil(contentHeight);
      const desired = Number.isFinite(desiredRaw) && desiredRaw > 0
        ? Math.min(desiredRaw, maxSheetHeight)
        : null;

      if (desired != null) {
        if (capToContentHeight) {
          expanded = Math.min(baseExpanded, desired);
          collapsed = Math.min(collapsed, desired);
        } else {
          expanded = Math.max(expanded, desired);
        }
      }
    }

    collapsed = Math.max(1, Math.min(collapsed, maxSheetHeight));
    expanded = Math.max(collapsed, Math.min(expanded, maxSheetHeight));

    if (capToContentHeight && expanded < collapsed) {
      expanded = collapsed;
    }

    if (expanded <= collapsed) {
      return [collapsed].slice(0, MAX_INDEX_CAP + 1);
    }

    return [collapsed, expanded].slice(0, MAX_INDEX_CAP + 1);
  }, [baseSnapPoints, capToContentHeight, contentHeight, maxSheetHeight]);

  const lastIndex = Math.min(finalSnapPoints.length - 1, MAX_INDEX_CAP);

  useEffect(() => {
    lastIndexRef.current = lastIndex;
  }, [lastIndex]);

  const resolvedInitialIndex = useMemo(() => {
    if (lastIndex < 0) return -1;
    if (typeof initialIndex === 'number' && initialIndex >= 0) {
      return Math.min(initialIndex, lastIndex);
    }
    return lastIndex;
  }, [initialIndex, lastIndex]);

  useEffect(() => {
    currentIndexRef.current = resolvedInitialIndex;
  }, [resolvedInitialIndex]);

  useEffect(() => {
    latestResolvedIndexRef.current = resolvedInitialIndex;
  }, [resolvedInitialIndex]);

  useEffect(() => {
    if (!bottomSheetRef.current) return;
    if (resolvedInitialIndex < 0) return;
    if (lastAppliedInitialIndexRef.current === resolvedInitialIndex) return;
    lastAppliedInitialIndexRef.current = resolvedInitialIndex;
    if (resolvedInitialIndex <= 0) return;
    runWithDoubleRaf(() => {
      const maxIndex = lastIndexRef.current ?? 0;
      const latestResolved = latestResolvedIndexRef.current ?? resolvedInitialIndex;
      const targetIndex = Math.min(latestResolved, maxIndex);
      if (targetIndex > 0) {
        bottomSheetRef.current?.snapToIndex?.(targetIndex);
      }
    });
  }, [resolvedInitialIndex]);

  const handleSheetChanges = useCallback((index) => {
    if (index < 0) {
      currentIndexRef.current = index;
      onChange?.(index);
      return;
    }

    const safeIndex = Math.min(index, lastIndex);
    if (safeIndex !== index) {
      requestAnimationFrame(() => bottomSheetRef.current?.snapToIndex?.(safeIndex));
    }
    currentIndexRef.current = safeIndex;
    onChange?.(safeIndex);
  }, [lastIndex, onChange]);

  const handleClose = useCallback(() => {
    if (typeof onClose === 'function') return onClose();
    bottomSheetRef.current?.close?.();
  }, [onClose]);

  // utility to expand to max snap point only if not already there
  const expandToMax = useCallback(() => {
    if (lastIndex <= 0) return;
    bottomSheetRef.current?.snapToIndex?.(lastIndex);
  }, [lastIndex]);

  // If snap points shrink (e.g., we removed index 2 making index 1 max) and current index is now out of range, snap to new max.
  useEffect(() => {
    if (currentIndexRef.current == null) return;
    if (currentIndexRef.current > lastIndex) {
      const target = lastIndex;
      requestAnimationFrame(() => bottomSheetRef.current?.snapToIndex?.(target));
      currentIndexRef.current = target;
    }
  }, [lastIndex]);

  const renderHandle = useCallback(
    (handleProps) => (
      <Handle
        {...handleProps}
        variant={variant}
        title={variant === 'compact' ? title : undefined}
        showClose={variant === 'compact' ? true : showClose}
        closeIcon={closeIcon}
        lastIndex={lastIndex}
        onClose={handleClose}
        useSolidBackground={handleSolidBackground}
      />
    ),
    [variant, title, showClose, closeIcon, lastIndex, handleClose, handleSolidBackground]
  );

  const handleBackdropPress = useCallback(() => {
    if (searchActive) {
      Keyboard.dismiss();
      setSearchActive(false);
      return;
    }
    bottomSheetRef.current?.snapToIndex?.(0);
  }, [searchActive]);

  const renderBackdrop = useCallback(
    (backdropProps) => (
      <Backdrop
        animatedIndex={backdropProps.animatedIndex}
        style={backdropProps.style}
        onPress={handleBackdropPress}
      />
    ),
    [handleBackdropPress]
  );

  const renderFooter = useCallback(
    (footerProps) => (
      <Footer
        {...footerProps}
        lastIndex={lastIndex}
        variant={footerVariant}
        placement={footerPlacement}
      />
    ),
    [lastIndex, footerVariant, footerPlacement]
  );

  const renderBackground = useCallback(
    (backgroundProps) => <Background {...backgroundProps} />,
    []
  );

  const scheduleExpand = useCallback(() => {
    if (Platform.OS === 'android') {
      runWithDoubleRaf(expandToMax);
    } else {
      expandToMax();
    }
  }, [expandToMax]);

  // search bar visible when expanding on focus
  const handleSearchFocus = useCallback(() => {
    setSearchActive(true);
    if (!autoExpandOnSearchFocus) return;
    scheduleExpand();
  }, [autoExpandOnSearchFocus, scheduleExpand]);

  const handleSearchBlur = useCallback(() => {
    setSearchActive(false);
  }, []);

  // keyboard show listener
  useEffect(() => {
    if (!autoExpandOnKeyboardShow) return;
    const showEvents = Platform.select({
      ios: ['keyboardWillShow', 'keyboardDidShow'],
      default: ['keyboardDidShow']
    });
    const subs = showEvents.map(evt => Keyboard.addListener(evt, () => {
      if (!searchActive) return;
      scheduleExpand();
    }));
    return () => subs.forEach(s => s.remove());
  }, [autoExpandOnKeyboardShow, scheduleExpand, searchActive]);

  // In compact variant title is rendered in handle
  const includeHeader = variant === 'standard';

  const headerCloseHandler = useCallback(() => {
    handleClose();
  }, [handleClose]);

  const bottomInset = insets?.bottom ?? 0;
  const bottomPadding = bottomInset + 8;

  const footerComponentProp = footerVariant === 'none' ? undefined : renderFooter;

  const handleCustomContentLayout = useCallback((event) => {
    const h = event?.nativeEvent?.layout?.height;
    if (typeof h === 'number') {
      registerContentHeight(h);
    }
  }, [registerContentHeight]);

  const handleListContainerLayout = useCallback((event) => {
    const h = event?.nativeEvent?.layout?.height;
    if (typeof h === 'number') {
      registerContentHeight(h);
    }
  }, [registerContentHeight]);

  const handleMeasuredContentHeight = useCallback((height) => {
    registerContentHeight(height, { allowDecrease: true });
  }, [registerContentHeight]);

  // Prepare capped snap points for prop (defensive slice)
  const providedSnapPoints = useMemo(() => {
    if (!finalSnapPoints.length) {
      return [Math.round(maxSheetHeight * 0.3)];
    }
    return finalSnapPoints.slice(0, MAX_INDEX_CAP + 1);
  }, [finalSnapPoints, maxSheetHeight]);

  const dynamicContentCap = useMemo(() => {
    if (!providedSnapPoints.length) return maxSheetHeight;
    const candidate = providedSnapPoints[Math.min(providedSnapPoints.length - 1, MAX_INDEX_CAP)];
    return typeof candidate === 'number' ? candidate : maxSheetHeight;
  }, [providedSnapPoints, maxSheetHeight]);

  const combinedContainerStyle = useMemo(() => {
    const shadowColor = theme.colors?.shadow || '#000';
    const base = [styles.shadows, { shadowColor }];
    if (!overrideContainerStyle) return base;
    return [...base, overrideContainerStyle];
  }, [theme.colors?.shadow, overrideContainerStyle]);

  return (
    <BottomSheet
      ref={bottomSheetRef}
      onChange={handleSheetChanges}
      index={resolvedInitialIndex}
      snapPoints={providedSnapPoints}
      enableOverDrag={false}
      overDragResistanceFactor={1000} // extra guard: very high resistance to upward overdrag
      maxDynamicContentSize={dynamicContentCap}
      // Provide topInset so library's internal max height matches our computed stableMaxHeight
      topInset={topInset}
      // Extra runtime guard: if animation tries to target > max index, redirect to max
      onAnimate={(fromIndex, toIndex) => {
        if (toIndex > lastIndex) {
          // Silently clamp any attempt to exceed max index (no logging to avoid confusion)
          requestAnimationFrame(() => bottomSheetRef.current?.snapToIndex?.(lastIndex));
        }
      }}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      enablePanDownToClose
      handleComponent={renderHandle}
      backdropComponent={renderBackdrop}
      footerComponent={footerComponentProp}
      backgroundComponent={renderBackground}
      containerStyle={combinedContainerStyle}
      {...restProps}
    >
      {customContent ? (
        <BottomSheetView
          style={{ flex: 1, paddingHorizontal: 16, paddingBottom: bottomPadding, paddingTop: includeHeader ? 0 : 12 }}
          onLayout={handleCustomContentLayout}
        >
          {includeHeader && (
            headerComponent ? (
              headerComponent
            ) : (
              <SheetHeader
                title={title}
                actionLabel={headerActionLabel}
                onActionPress={onHeaderActionPress}
                showClose={showClose}
                onClose={headerCloseHandler}
                closeIcon={closeIcon}
              >
                {headerChildren}
              </SheetHeader>
            )
          )}
          {customContent}
        </BottomSheetView>
      ) : (
        <View
          style={{ flex: 1 }}
          onLayout={handleListContainerLayout}
        >
          <Contents
            data={data}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            getItem={getItem}
            getItemCount={getItemCount}
            headerComponent={includeHeader ? headerComponent : undefined}
            title={includeHeader ? title : undefined}
            headerActionLabel={includeHeader ? headerActionLabel : undefined}
            onHeaderActionPress={includeHeader ? onHeaderActionPress : undefined}
            showClose={includeHeader ? showClose : false}
            onClose={headerCloseHandler}
            headerChildren={includeHeader ? headerChildren : undefined}
            onItemPress={onItemPress}
            itemTitleExtractor={itemTitleExtractor}
            theme={theme}
            emptyComponent={emptyComponent}
            extraBottomPadding={bottomPadding}
            closeIcon={includeHeader ? closeIcon : undefined}
            enableSearch={enableSearch}
            searchPlaceholder={searchPlaceholder}
            onSearchFocus={handleSearchFocus}
            onSearchBlur={handleSearchBlur}
            onContentHeightChange={handleMeasuredContentHeight}
          />
        </View>
      )}
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  shadows: {
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 12,
  },
});

export default CustomBottomSheet;
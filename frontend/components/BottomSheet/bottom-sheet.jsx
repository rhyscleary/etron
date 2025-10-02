import React, { useCallback, useMemo, useRef, useEffect, useState, useImperativeHandle } from 'react';
import { StyleSheet, Dimensions, Keyboard, Platform } from 'react-native';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Backdrop from './backdrop';
import Footer from './footer';
import Background from './background';
import Handle from './handle';
import Contents from './contents';
import SheetHeader from './header';

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

const CustomBottomSheetInner = (props, ref) => {
  const {
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
    containerStyle: overrideContainerStyle,
    enableDynamicSizing: enableDynamicSizingProp,
    maxDynamicContentSize: maxDynamicContentSizeProp,
    ...restProps
  } = props;

  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const topInset = insets?.top ?? 0;
  const [searchActive, setSearchActive] = useState(false);
  const [maxSheetHeight, setMaxSheetHeight] = useState(() => deriveMaxSheetHeight(topInset));
  // ref
  const bottomSheetRef = useRef(null);
  const currentIndexRef = useRef(null); // track latest known index

  const lastAppliedInitialIndexRef = useRef(null);

  const computeMaxSheetHeight = useCallback(
    (windowMetrics) => deriveMaxSheetHeight(topInset, windowMetrics),
    [topInset]
  );

  useEffect(() => {
    const next = computeMaxSheetHeight();
    setMaxSheetHeight((prev) => (prev === next ? prev : next));
  }, [computeMaxSheetHeight]);

  useEffect(() => {
    const handler = ({ window }) => {
      const next = computeMaxSheetHeight(window);
      setMaxSheetHeight((prev) => (prev === next ? prev : next));
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
  const resolvedSnapPoints = useMemo(() => {
    if (Array.isArray(snapPoints) && snapPoints.length) {
      return snapPoints;
    }
    return DEFAULT_SNAP_POINTS;
  }, [snapPoints]);

  const [visibleSnapPointsCount, setVisibleSnapPointsCount] = useState(() => resolvedSnapPoints.length);

  const lastIndex = useMemo(() => Math.max(0, visibleSnapPointsCount - 1), [visibleSnapPointsCount]);

  const enableDynamicSizing = enableDynamicSizingProp ?? true;
  const maxDynamicContentSize = maxDynamicContentSizeProp ?? maxSheetHeight;

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

  const syncVisibleSnapPointsCount = useCallback(() => {
    const runtimeSnapPoints = bottomSheetRef.current?.snapPoints;
    if (Array.isArray(runtimeSnapPoints) && runtimeSnapPoints.length) {
      setVisibleSnapPointsCount((prev) => (prev === runtimeSnapPoints.length ? prev : runtimeSnapPoints.length));
      return runtimeSnapPoints.length;
    }
    return visibleSnapPointsCount;
  }, [visibleSnapPointsCount]);

  useEffect(() => {
    setVisibleSnapPointsCount(resolvedSnapPoints.length);
  }, [resolvedSnapPoints]);

  useEffect(() => {
    if (!bottomSheetRef.current) return;
    if (resolvedInitialIndex < 0) return;
    if (lastAppliedInitialIndexRef.current === resolvedInitialIndex) return;
    lastAppliedInitialIndexRef.current = resolvedInitialIndex;
    runWithDoubleRaf(() => {
      bottomSheetRef.current?.snapToIndex?.(resolvedInitialIndex);
      syncVisibleSnapPointsCount();
    });
  }, [resolvedInitialIndex, syncVisibleSnapPointsCount]);

  useImperativeHandle(ref, () => ({
    expand: () => bottomSheetRef.current?.expand?.(),
    collapse: () => bottomSheetRef.current?.collapse?.(),
    close: () => bottomSheetRef.current?.close?.(),
    forceClose: () => bottomSheetRef.current?.forceClose?.(),
    snapToIndex: (index) => {
      if (typeof index !== 'number') return;
      const maxIndex = Math.max(0, (bottomSheetRef.current?.snapPoints?.length ?? lastIndex + 1) - 1);
      const target = Math.max(0, Math.min(index, maxIndex));
      bottomSheetRef.current?.snapToIndex?.(target);
    },
    snapToPosition: (position) => {
      if (position == null) return;
      bottomSheetRef.current?.snapToPosition?.(position);
    },
    getCurrentIndex: () => currentIndexRef.current ?? resolvedInitialIndex,
  }), [lastIndex, resolvedInitialIndex]);

  const handleSheetChanges = useCallback((index) => {
    currentIndexRef.current = index;
    syncVisibleSnapPointsCount();
    onChange?.(index);
  }, [onChange, syncVisibleSnapPointsCount]);

  const handleClose = useCallback(() => {
    if (typeof onClose === 'function') return onClose();
    bottomSheetRef.current?.close?.();
  }, [onClose]);

  // utility to expand to max snap point only if not already there
  const expandToMax = useCallback(() => {
    bottomSheetRef.current?.expand?.();
  }, []);

  // If snap points shrink (e.g., we removed index 2 making index 1 max) and current index is now out of range, snap to new max.
  useEffect(() => {
    if (currentIndexRef.current == null) return;
    const maxIndex = Math.max(0, (bottomSheetRef.current?.snapPoints?.length ?? visibleSnapPointsCount) - 1);
    if (currentIndexRef.current > maxIndex) {
      const target = maxIndex;
      requestAnimationFrame(() => bottomSheetRef.current?.snapToIndex?.(target));
      currentIndexRef.current = target;
    }
  }, [visibleSnapPointsCount]);

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

  const bottomSheetSnapPoints = resolvedSnapPoints;

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
      snapPoints={bottomSheetSnapPoints}
      enableOverDrag={false}
      overDragResistanceFactor={1000} // extra guard: very high resistance to upward overdrag
      // Provide topInset so library's internal max height matches our computed stableMaxHeight
      topInset={topInset}
      enableDynamicSizing={enableDynamicSizing}
      maxDynamicContentSize={maxDynamicContentSize}
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
        />
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

const ForwardedCustomBottomSheet = React.forwardRef(CustomBottomSheetInner);

ForwardedCustomBottomSheet.displayName = 'CustomBottomSheet';

export default React.memo(ForwardedCustomBottomSheet);
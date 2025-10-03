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

const DEFAULT_COLLAPSED_SNAP_POINT = '30%';
const MAX_HEIGHT_PERCENT = 80;

const calculateMaxSheetHeight = (windowHeight, topInset = 0) => {
  const availableHeight = windowHeight - topInset;
  return Math.floor(availableHeight * (MAX_HEIGHT_PERCENT / 100));
};

const CustomBottomSheetInner = (props, ref) => {
  const {
    onChange,
    data = [1, 2, 3],
    renderItem,
    keyExtractor,
    getItem,
    getItemCount,
    snapPoints: customSnapPoints,
    initialIndex: customInitialIndex,
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
    enableDynamicSizing: enableDynamicSizingProp = true,
    maxDynamicContentSize: maxDynamicContentSizeProp,
    ...restProps
  } = props;

  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const topInset = insets?.top ?? 0;
  const [searchActive, setSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // refs
  const bottomSheetRef = useRef(null);
  const currentIndexRef = useRef(null);

  // calculate max sheet height (80% of available height)
  const maxSheetHeight = useMemo(() => {
    const windowHeight = Dimensions.get('window').height;
    return calculateMaxSheetHeight(windowHeight, topInset);
  }, [topInset]);

  // update max height on dimension changes
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      // dont need to trigger re-render
    });
    return () => subscription?.remove();
  }, [topInset]);

  // determine if using dynamic sizing
  const enableDynamicSizing = enableDynamicSizingProp;

  // calculate snap points based on dynamic sizing mode
  const snapPoints = useMemo(() => {
    if (enableDynamicSizing) {
      // when dynamic sizing enabled, only provide collapsed snap point
      // library adds second snap point for content height
      const collapsedPoint = Array.isArray(customSnapPoints) && customSnapPoints.length > 0
        ? customSnapPoints[0]
        : DEFAULT_COLLAPSED_SNAP_POINT;
      return [collapsedPoint];
    }
    
    // when dynamic sizing is disabled, use all provided snap points or defaults
    return Array.isArray(customSnapPoints) && customSnapPoints.length > 0
      ? customSnapPoints
      : [DEFAULT_COLLAPSED_SNAP_POINT, '80%'];
  }, [enableDynamicSizing, customSnapPoints]);

  // calculate initial index based on dynamic sizing mode
  const initialIndex = useMemo(() => {
    if (enableDynamicSizing) {
      if (customInitialIndex === 0) return 0;
      return 1;
    }
    
    // without dynamic sizing, use custom index or default to last snap point
    if (typeof customInitialIndex === 'number' && customInitialIndex >= 0) {
      return Math.min(customInitialIndex, snapPoints.length - 1);
    }
    return snapPoints.length - 1;
  }, [enableDynamicSizing, customInitialIndex, snapPoints.length]);

  const maxDynamicContentSize = useMemo(() => {
    if (typeof maxDynamicContentSizeProp === 'number') {
      return Math.min(maxDynamicContentSizeProp, maxSheetHeight);
    }
    return maxSheetHeight;
  }, [maxDynamicContentSizeProp, maxSheetHeight]);

  // track current index
  useEffect(() => {
    currentIndexRef.current = initialIndex;
  }, [initialIndex]);

  // imperative handle for ref methods
  useImperativeHandle(ref, () => ({
    expand: () => {
      // expand to the highest available snap point
      const maxIndex = enableDynamicSizing ? 1 : snapPoints.length - 1;
      bottomSheetRef.current?.snapToIndex?.(maxIndex);
    },
    collapse: () => {
      // collapse to the first snap point
      bottomSheetRef.current?.snapToIndex?.(0);
    },
    close: () => bottomSheetRef.current?.close?.(),
    forceClose: () => bottomSheetRef.current?.forceClose?.(),
    snapToIndex: (index) => {
      if (typeof index !== 'number') return;
      const maxIndex = enableDynamicSizing ? 1 : snapPoints.length - 1;
      const targetIndex = Math.max(0, Math.min(index, maxIndex));
      bottomSheetRef.current?.snapToIndex?.(targetIndex);
    },
    snapToPosition: (position) => {
      bottomSheetRef.current?.snapToPosition?.(position);
    },
    getCurrentIndex: () => currentIndexRef.current ?? initialIndex,
  }), [enableDynamicSizing, initialIndex, snapPoints.length]);

  const handleSheetChanges = useCallback((index) => {
    currentIndexRef.current = index;
    onChange?.(index);
  }, [onChange]);

  const handleClose = useCallback(() => {
    if (typeof onClose === 'function') return onClose();
    bottomSheetRef.current?.close?.();
  }, [onClose]);

  // expand to maximum snap point
  const expandToMax = useCallback(() => {
    const maxIndex = enableDynamicSizing ? 1 : snapPoints.length - 1;
    bottomSheetRef.current?.snapToIndex?.(maxIndex);
  }, [enableDynamicSizing, snapPoints.length]);

  // last index for components that need it
  const lastIndex = useMemo(() => {
    return enableDynamicSizing ? 1 : snapPoints.length - 1;
  }, [enableDynamicSizing, snapPoints.length]);


  const renderHandle = useCallback(
    (handleProps) => {
      return (
        <Handle
          {...handleProps}
          variant={variant}
          title={variant === 'compact' ? title : (variant === 'standard' ? title : undefined)}
          showClose={showClose}
          closeIcon={closeIcon}
          lastIndex={lastIndex}
          onClose={handleClose}
          useSolidBackground={handleSolidBackground}
          headerComponent={variant === 'standard' ? headerComponent : undefined}
          headerActionLabel={variant === 'standard' ? headerActionLabel : undefined}
          onHeaderActionPress={variant === 'standard' ? onHeaderActionPress : undefined}
          headerChildren={variant === 'standard' ? headerChildren : undefined}
          enableSearch={variant === 'standard' ? enableSearch : false}
          searchPlaceholder={searchPlaceholder}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onSearchFocus={handleSearchFocus}
          onSearchBlur={handleSearchBlur}
        />
      );
    },
    [closeIcon, handleClose, handleSolidBackground, lastIndex, showClose, title, variant, headerComponent, headerActionLabel, onHeaderActionPress, headerChildren, enableSearch, searchPlaceholder, searchQuery, handleSearchFocus, handleSearchBlur]
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
    (footerProps) => {
      return (
        <Footer
          {...footerProps}
          lastIndex={lastIndex}
          variant={footerVariant}
          placement={footerPlacement}
        />
      );
    },
    [footerPlacement, footerVariant, lastIndex]
  );

  const renderBackground = useCallback(
    (backgroundProps) => <Background {...backgroundProps} />,
    []
  );

  const scheduleExpand = useCallback(() => {
    if (Platform.OS === 'android') {
      requestAnimationFrame(() => {
        requestAnimationFrame(expandToMax);
      });
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
      index={initialIndex}
      snapPoints={snapPoints}
      enableOverDrag={false}
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
          style={{ flex: 1, paddingHorizontal: 16, paddingBottom: bottomPadding, paddingTop: 12 }}
        >
          {customContent}
        </BottomSheetView>
      ) : (
        <Contents
          data={data}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          getItem={getItem}
          getItemCount={getItemCount}
          onItemPress={onItemPress}
          itemTitleExtractor={itemTitleExtractor}
          theme={theme}
          emptyComponent={emptyComponent}
          extraBottomPadding={bottomPadding}
          enableSearch={enableSearch}
          searchQuery={searchQuery}
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
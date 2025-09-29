import React, { useCallback, useMemo, useRef, useEffect, useState } from 'react';
import { StyleSheet, View, Dimensions, Keyboard, Platform } from 'react-native';
import BottomSheet from '@gorhom/bottom-sheet';
import { useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Backdrop from './backdrop';
import Footer from './footer';
import Background from './background';
import Handle from './handle';
import Contents from './contents';

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
  ...props
}) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [searchActive, setSearchActive] = useState(false);
  // ref 
  const bottomSheetRef = useRef(null);
  const windowHeight = Dimensions.get('window').height;
  const maxSheetHeight = Math.max(240, windowHeight - (insets?.top ?? 0) - (insets?.bottom ?? 0) - 12);
  const defaultSnapPoints = useMemo(() => [
    Math.round(maxSheetHeight * 0.30),
    Math.round(maxSheetHeight * 0.50),
    Math.round(maxSheetHeight * 0.70),
  ], [maxSheetHeight]);
  const effectiveSnapPoints = snapPoints ?? defaultSnapPoints;
  const effectiveInitialIndex = (() => {
    const last = Math.max(0, (effectiveSnapPoints?.length || 1) - 1);
    return typeof initialIndex === 'number' ? Math.min(initialIndex, last) : last; // open largest by default
  })();

  // callbacks
  const handleSheetChanges = useCallback((index) => {
    if (typeof onChange === 'function') onChange(index);
  }, [onChange]);

  // handle component integration
  const lastIndex = (effectiveSnapPoints?.length || 1) - 1; // used for footer sizing

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

  const renderBackdrop = useCallback(
    (backdropProps) => (
      <Backdrop
        animatedIndex={backdropProps.animatedIndex}
        style={backdropProps.style}
        onPress={() => {
          if (searchActive) {
            Keyboard.dismiss();
            setSearchActive(false);
          } else {
            bottomSheetRef.current?.snapToIndex?.(0);
          }
        }}
      />
    ),
    [searchActive]
  );

  const renderFooter = useCallback(
    (footerProps) => (
      <Footer
        {...footerProps}
        lastIndex={(effectiveSnapPoints?.length || 1) - 1}
        variant={footerVariant}
        placement={footerPlacement}
      />
    ),
    [effectiveSnapPoints?.length, footerVariant, footerPlacement]
  );

  const renderBackground = useCallback(
    (backgroundProps) => <Background {...backgroundProps} />,
    []
  );

  const handleClose = useCallback(() => {
    if (typeof onClose === 'function') return onClose();
    // default behaviour: close sheet
    bottomSheetRef.current?.close?.();
  }, [onClose]);

  // utility to expand to max snap point only if not already there
  const expandToMax = useCallback(() => {
    try {
      const last = (effectiveSnapPoints?.length || 1) - 1;
      if (last <= 0) return; // nothing to expand
      bottomSheetRef.current?.expand?.(); // built-in expand tries last index
      // fallback if expand not available
      bottomSheetRef.current?.snapToIndex?.(last);
    } catch (_) {}
  }, [effectiveSnapPoints]);

  // search bar visible when expanding on focus
  const handleSearchFocus = useCallback(() => {
    setSearchActive(true);
    if (!autoExpandOnSearchFocus) return;
    // for slower Android devices layout
    if (Platform.OS === 'android') {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          expandToMax();
        });
      });
    } else {
      expandToMax();
    }
  }, [autoExpandOnSearchFocus, expandToMax]);

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
      if (Platform.OS === 'android') {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            expandToMax();
          });
        });
      } else {
        expandToMax();
      }
    }));
    return () => subs.forEach(s => s.remove());
  }, [autoExpandOnKeyboardShow, expandToMax, searchActive]);

  // In compact variant title is rendered in handle
  const includeHeader = variant === 'standard';

  const headerCloseHandler = useCallback(() => {
    handleClose();
  }, [handleClose]);

  return (
    <BottomSheet
      ref={bottomSheetRef}
      onChange={handleSheetChanges}
      index={effectiveInitialIndex}
      snapPoints={effectiveSnapPoints}
      // keyboard interaction
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      enablePanDownToClose
      // dynamic sizing can conflict with explicit snap & keyboard behaviour
      // enableDynamicSizing
      handleComponent={renderHandle}
      backdropComponent={renderBackdrop}
      footerComponent={renderFooter}
      backgroundComponent={renderBackground}
      containerStyle={[styles.shadows, { shadowColor: theme.colors?.shadow || '#000' }]}
      {...props}
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
        extraBottomPadding={(insets?.bottom ?? 0) + 8}
        closeIcon={includeHeader ? closeIcon : undefined}
        enableSearch={enableSearch}
        searchPlaceholder={searchPlaceholder}
        onSearchFocus={handleSearchFocus}
        onSearchBlur={handleSearchBlur}
      />
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
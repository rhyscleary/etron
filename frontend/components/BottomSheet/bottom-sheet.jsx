import React, { useCallback, useMemo, useRef } from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
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
  // item interactions
  onItemPress,
  itemTitleExtractor,
  ...props
}) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
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
  const renderHandle = useCallback(
    (handleProps) => (
      <Handle
        {...handleProps}
        style={[{ backgroundColor: theme.colors.buttonBackground }]}
      />
    ),
    [theme.colors.buttonBackground]
  );

  const renderBackdrop = useCallback(
    (backdropProps) => (
      <Backdrop
        animatedIndex={backdropProps.animatedIndex}
        style={backdropProps.style}
        onPress={() => bottomSheetRef.current?.snapToIndex?.(0)}
      />
    ),
    []
  );

  const renderFooter = useCallback(
    (footerProps) => (
      <Footer
        {...footerProps}
        lastIndex={(effectiveSnapPoints?.length || 1) - 1}
      />
    ),
    [effectiveSnapPoints?.length]
  );

  const renderBackground = useCallback(
    (backgroundProps) => <Background {...backgroundProps} />,
    []
  );

  return (
      <BottomSheet
        ref={bottomSheetRef}
        onChange={handleSheetChanges}
        index={effectiveInitialIndex}
        snapPoints={effectiveSnapPoints}
        enablePanDownToClose
        enableDynamicSizing
        bottomInset={insets?.bottom ?? 0}
        handleComponent={renderHandle}
        backdropComponent={renderBackdrop}
        footerComponent={renderFooter}
        backgroundComponent={renderBackground}
        containerStyle={styles.shadows}
        {...props}
      >
        <Contents
          data={data}
          renderItem={renderItem}
            keyExtractor={keyExtractor}
            getItem={getItem}
            getItemCount={getItemCount}
            headerComponent={headerComponent}
            title={title}
            headerActionLabel={headerActionLabel}
            onHeaderActionPress={onHeaderActionPress}
            onItemPress={onItemPress}
            itemTitleExtractor={itemTitleExtractor}
            theme={theme}
        />
      </BottomSheet>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  shadows: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 12,
  },
});

export default CustomBottomSheet;
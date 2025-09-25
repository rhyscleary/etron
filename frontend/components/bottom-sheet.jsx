import React, { useCallback, useMemo, useRef } from 'react';
import { Text, StyleSheet, View, Dimensions } from 'react-native';
import BottomSheet, { BottomSheetVirtualizedList, BottomSheetBackdrop, BottomSheetHandle } from '@gorhom/bottom-sheet';
import { useTheme, List, Button } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const BasicBottomSheet = ({
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
    return typeof initialIndex === 'number' ? Math.min(initialIndex, last) : last; // open to largest by default
  })();

  // callbacks
  const handleSheetChanges = useCallback((index) => {
    console.log('handleSheetChanges', index);
    if (typeof onChange === 'function') onChange(index);
  }, [onChange]);

  const renderHandle = useCallback(() => (
    <BottomSheetHandle
      style={[styles.handleContainer, { backgroundColor: theme.colors.buttonBackground }]}
      indicatorStyle={[
        styles.handleIndicator,
        { backgroundColor: theme.colors.surface, opacity: 0.5 },
      ]}
    />
  ), [theme.colors.buttonBackground, theme.colors.buttonBackground]);

  const renderBackdrop = (backdropProps) => (
    <BottomSheetBackdrop
      {...backdropProps}
      appearsOnIndex={0}
      disappearsOnIndex={-1}
      opacity={0.5}
    />
  );

  const DefaultFooter = undefined;

  // renders
  return (
      <BottomSheet
        ref={bottomSheetRef}
        onChange={handleSheetChanges}
        index={effectiveInitialIndex}
        snapPoints={effectiveSnapPoints}
        enablePanDownToClose
        enableDynamicSizing={false}
        bottomInset={insets?.bottom ?? 0}
  handleComponent={renderHandle}
        backdropComponent={renderBackdrop}
        footerComponent={DefaultFooter}
        {...props}
      >
        <BottomSheetVirtualizedList
          data={data}
          keyExtractor={keyExtractor || ((item, index) => (item?.id?.toString?.() ?? String(index)))}
          getItemCount={getItemCount || ((arr) => arr?.length ?? 0)}
          getItem={getItem || ((arr, index) => arr[index])}
          ListHeaderComponent={
            headerComponent
              ? headerComponent
              : (title || headerActionLabel)
              ? () => (
                  <View style={styles.headerRow}>
                    {title ? (
                      <List.Subheader style={styles.headerTitle}>
                        {typeof title === 'string' ? title : title}
                      </List.Subheader>
                    ) : (
                      <View />
                    )}
                    {headerActionLabel && typeof onHeaderActionPress === 'function' ? (
                      <Button mode="text" compact onPress={onHeaderActionPress}>
                        {headerActionLabel}
                      </Button>
                    ) : null}
                  </View>
                )
              : undefined
          }
          renderItem={
            renderItem ||
            (({ item, index }) => {
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
            })
          }
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[styles.contentContainer, { backgroundColor: theme.colors.surface, color: theme.colors.text}]}
        />
      </BottomSheet>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingVertical: 16,
    paddingHorizontal: 12,
    height: '100%'
  },
  headerRow: {
    paddingHorizontal: 12,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    paddingHorizontal: 0,
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
  handleContainer: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  handleIndicator: {
    width: 36,
    height: 4,
    borderRadius: 2,
    opacity: 0.6,
  },
  footerContainer: {
    paddingVertical: 8,
  },
  footerText: {
    textAlign: 'center',
    opacity: 0.7,
  },
});

export default BasicBottomSheet;
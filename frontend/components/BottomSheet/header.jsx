import React, { useMemo, useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { Appbar, Button, useTheme } from 'react-native-paper';

export const SHEET_HEADER_BOTTOM_MARGIN = 10;
export const SHEET_HEADER_DISPLAY_NAME = 'SheetHeader';

const resolveVerticalMargins = (styleInput) => {
  const flattened = StyleSheet.flatten(styleInput);
  if (!flattened) return 0;
  const base = Number.isFinite(flattened.margin) ? flattened.margin : 0;
  const vertical = Number.isFinite(flattened.marginVertical) ? flattened.marginVertical : base;
  const top = Number.isFinite(flattened.marginTop) ? flattened.marginTop : vertical;
  const bottomValue = Number.isFinite(flattened.marginBottom)
    ? flattened.marginBottom
    : vertical || SHEET_HEADER_BOTTOM_MARGIN;
  return (Number.isFinite(top) ? top : 0) + (Number.isFinite(bottomValue) ? bottomValue : 0);
};

const SheetHeaderComponent = ({
  title,
  showClose = true,
  onClose,
  actionLabel,
  onActionPress,
  children,
  style,
  showDivider = true,
  dividerColor,
  closeIcon = 'close',
  onHeightChange,
  onLayout,
}) => {
  const theme = useTheme();

  const renderedTitle = useMemo(() => {
    if (!title) return null;
    if (typeof title === 'string') {
      return (
        <Appbar.Content
          title={title}
          titleStyle={styles.headerTitle}
          style={styles.appbarContent}
        />
      );
    }
    // custom node
    return title;
  }, [title]);

  const borderStyle = useMemo(() => {
    if (!showDivider) return null;
    const color = dividerColor || theme.colors?.outlineVariant || 'rgba(0,0,0,0.12)';
    return { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: color };
  }, [showDivider, dividerColor, theme.colors]);

  const combinedStyle = useMemo(() => [styles.headerRow, borderStyle, style], [borderStyle, style]);
  const verticalMargins = useMemo(() => resolveVerticalMargins(combinedStyle), [combinedStyle]);

  const handleLayout = useCallback((event) => {
    if (typeof onLayout === 'function') {
      onLayout(event);
    }
    if (typeof onHeightChange === 'function') {
      const height = event?.nativeEvent?.layout?.height ?? 0;
      onHeightChange(height + verticalMargins);
    }
  }, [onLayout, onHeightChange, verticalMargins]);

  return (
    <Appbar.Header
      statusBarHeight={0}
      elevated={false}
      style={combinedStyle}
      onLayout={handleLayout}
    >
      <View style={styles.leftGroup}>
        {renderedTitle}
        {children}
      </View>
      <View style={styles.rightGroup}>
        {actionLabel ? (
          <Button
            mode="text"
            compact
            onPress={onActionPress}
            style={styles.actionBtn}
          >
            {actionLabel}
          </Button>
        ) : null}
        {showClose ? (
          <Appbar.Action
            icon={closeIcon}
            accessibilityLabel={'Close'}
            onPress={onClose}
            rippleColor={theme.colors?.backdrop}
          />
        ) : null}
      </View>
    </Appbar.Header>
  );
};

SheetHeaderComponent.displayName = SHEET_HEADER_DISPLAY_NAME;

const styles = StyleSheet.create({
  headerRow: {
    paddingHorizontal: 12,
    paddingBottom: 4,
    backgroundColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SHEET_HEADER_BOTTOM_MARGIN,
  },
  headerTitle: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '900',
  },
  leftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
    flexGrow: 1,
  },
  rightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionBtn: {
    marginRight: 2,
    paddingHorizontal: 4,
  },
  appbarContent: {
    paddingHorizontal: 0,
    marginLeft: 0,
  },
  divider: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: StyleSheet.hairlineWidth,
  },
});

const MemoizedSheetHeader = React.memo(SheetHeaderComponent);
MemoizedSheetHeader.displayName = SHEET_HEADER_DISPLAY_NAME;

export default MemoizedSheetHeader;

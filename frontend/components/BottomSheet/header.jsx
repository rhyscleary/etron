import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Appbar, Button, useTheme } from 'react-native-paper';


const SheetHeader = ({
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

  return (
    <Appbar.Header
      statusBarHeight={0}
      elevated={false}
      style={[styles.headerRow, borderStyle, style]}
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

const styles = StyleSheet.create({
  headerRow: {
    paddingHorizontal: 12,
    paddingBottom: 4,
    backgroundColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
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

export default React.memo(SheetHeader);

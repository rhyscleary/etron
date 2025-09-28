import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { List, Button, IconButton, useTheme } from 'react-native-paper';


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
        <List.Subheader style={styles.headerTitle}>
          {title}
        </List.Subheader>
      );
    }
    return title; // assume custom node already styled
  }, [title]);

  const borderStyle = useMemo(() => {
    if (!showDivider) return null;
    const color = dividerColor || theme.colors?.outlineVariant || 'rgba(0,0,0,0.12)';
    return { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: color };
  }, [showDivider, dividerColor, theme.colors]);

  return (
    <View style={[styles.headerRow, borderStyle, style]}>      
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
          <IconButton
            icon={closeIcon}
            size={18}
            onPress={onClose}
            accessibilityLabel={'Close'}
            style={styles.closeBtn}
            rippleColor={theme.colors?.backdrop}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          />
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerRow: {
    paddingHorizontal: 16,
    paddingBottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
    marginBottom: 12,
  },
  headerTitle: {
    paddingHorizontal: 0,
    paddingRight: 12,
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
  closeBtn: {
    margin: 0,
    alignSelf: 'center',
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

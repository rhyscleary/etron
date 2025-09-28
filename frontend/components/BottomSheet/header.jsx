import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { List, Button, IconButton, useTheme } from 'react-native-paper';

/**
 * SheetHeader
 * A flexible header row for the bottom sheet.
 * Defaults: title on the left and a close button on the right.
 * Optional: action button (text) and any custom children injected between title and right actions.
 * Props:
 *  - title: string|ReactNode
 *  - showClose: boolean (default true)
 *  - onClose: function
 *  - actionLabel: string (renders a text button when provided)
 *  - onActionPress: function (paired with actionLabel)
 *  - children: custom nodes placed after the title (left section) but before right action/close buttons
 *  - style: style override for the container
 */
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
            icon="close"
            size={18}
            onPress={onClose}
            accessibilityLabel="Close"
            style={styles.closeBtn}
            // no containerColor to keep transparent/minimal
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
    // Reduced top padding to bring title closer to the sheet handle
    // Slightly tighter internal bottom padding; external spacing handled via marginBottom
    paddingBottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
    // Added margin below divider to create more breathing room before list content
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

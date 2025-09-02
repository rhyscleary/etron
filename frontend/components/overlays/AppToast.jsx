import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import ToastManager, { Toast as RNToast } from 'toastify-react-native';
import { useTheme } from 'react-native-paper';

export const ToastProvider = memo(function ToastProvider({
  position = 'top',
  duration = 3000,
  useModal = false,
  showCloseIcon = true,
  showProgressBar = true,
  width = '90%',
  topOffset = 56,
  bottomOffset = 56,
  iconFamily = 'MaterialIcons',
  icons, // optional: { success, error, info, warn, default }
  config, // optional custom components per type
  style,
  textStyle,
  themeMode, // override theme if needed: 'light' | 'dark'
}) {
  const paperTheme = useTheme();
  const isDark = themeMode ? themeMode === 'dark' : !!paperTheme.dark;

  // No cached theme usage; components read theme directly

  // build custom toast config, merge any provided config
  const mergedConfig = {
    ...(config || {}),
  persistent: (props) => <PersistentToast {...props} />,
  };

  return (
    <ToastManager
      theme={isDark ? 'dark' : 'light'}
      position={position}
      duration={duration}
      useModal={useModal}
      showCloseIcon={showCloseIcon}
      showProgressBar={showProgressBar}
  width={width}
  topOffset={topOffset}
  bottomOffset={bottomOffset}
  iconFamily={iconFamily}
  icons={icons}
      config={mergedConfig}
      style={{
        borderRadius: 12,
        elevation: 4,
        ...(style || {}),
      }}
      textStyle={{
        fontSize: 14,
        ...(textStyle || {}),
      }}
      // etc.
    />
  );
});

export const toast = {
  show: (options = {}) => {
    const type = options.type ?? 'default';
    const autoHide = options.autoHide ?? true;
  const backgroundColor = options.backgroundColor;
  const textColor = options.textColor;
    const iconColor = options.noIcon ? 'transparent' : options.iconColor; // hide left icon
    const iconSize = options.iconSize ?? 20;
    const isPersistent = !autoHide;
    const showCloseIcon = isPersistent ? false : options.showCloseIcon;
    const progressBarColor = isPersistent ? 'transparent' : options.progressBarColor;

    return RNToast.show({
      autoHide,
      visibilityTime: options.visibilityTime ?? options.duration ?? 3000,
      position: options.position ?? 'top',
      type,
      text1: options.title ?? options.text1 ?? '',
      text2: options.message ?? options.text2,
      iconFamily: options.iconFamily,
      iconColor,
      iconSize,
      backgroundColor,
      textColor,
      progressBarColor,
      theme: options.theme,
      useModal: options.useModal,
      showCloseIcon,
      closeIcon: options.closeIcon,
      closeIconFamily: options.closeIconFamily,
      closeIconSize: options.closeIconSize,
      closeIconColor: options.closeIconColor,
      onShow: options.onShow,
      onHide: options.onHide,
      onPress: options.onPress,
      // forward custom props to custom components
      props: options.props,
    });
  },

  // generic persistent toast
  // customizing type (error/success/info/warn/default) and position (top/bottom). Default no left icon and no auto-hide.
  persistent: (opts = {}) => {
    const {
      type = 'error',
      title,
      message,
      position = 'top',
      useModal = false,
      noIcon = true,
      visibilityTime,
    } = opts;
    
    return toast.show({
      type: 'persistent',
      title,
      message,
      autoHide: false,
      position,
      useModal,
      noIcon,
      visibilityTime,
      props: { variant: type },
    });
  },
  
  success: (message, opts = {}) =>
    toast.show({ type: 'success', message, position: opts.position ?? 'top', iconFamily: opts.iconFamily, useModal: opts.useModal, autoHide: opts.autoHide, visibilityTime: opts.visibilityTime }),
  error: (message, opts = {}) =>
    toast.show({ type: 'error', message, position: opts.position ?? 'top', iconFamily: opts.iconFamily, useModal: opts.useModal, autoHide: opts.autoHide, visibilityTime: opts.visibilityTime }),
  info: (message, opts = {}) =>
    toast.show({ type: 'info', message, position: opts.position ?? 'top', iconFamily: opts.iconFamily, useModal: opts.useModal, autoHide: opts.autoHide, visibilityTime: opts.visibilityTime }),
  warn: (message, opts = {}) =>
    toast.show({ type: 'warn', message, position: opts.position ?? 'top', iconFamily: opts.iconFamily, useModal: opts.useModal, autoHide: opts.autoHide, visibilityTime: opts.visibilityTime }),
  hide: () => RNToast.hide(),
};

// custom persistent toast
function PersistentToast(inProps) {
  const { text1, text2, props } = inProps;
  const theme = useTheme();
  const palette = {
    error: theme?.colors?.error ?? 'red',
    success: theme?.colors?.textGreen ?? 'green',
    info: theme?.colors?.primary ?? 'blue',
    warn: theme?.colors?.secondary ?? 'gold',
    default: theme?.colors?.buttonBackground ?? 'dimgray',
  };
  const variant = (props?.variant || 'error').toLowerCase();
  const background =
    variant === 'success' ? palette.success :
    variant === 'info' ? palette.info :
    variant === 'warn' || variant === 'warning' ? palette.warn :
    variant === 'default' ? palette.default :
    palette.error;
  const textColor = theme?.colors?.text ?? 'white';

  return (
    <View style={[styles.persistentContainer, { backgroundColor: background }]}>
      {!!text1 && <Text style={[styles.title, { color: textColor }]}>{text1}</Text>}
      {!!text2 && <Text style={[styles.message, { color: textColor }]}>{text2}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  persistentContainer: {
    width: 'auto',
    borderRadius: 12,
  paddingVertical: 8,
  paddingHorizontal: 12,
  alignItems: 'center',
  },
  title: {
  fontSize: 16,
    fontWeight: '600',
  textAlign: 'center',
  },
  message: {
  fontSize: 14,
  marginTop: 2,
  textAlign: 'center',
  },
});

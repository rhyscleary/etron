// Reusable toast wrapper for toastify-react-native
// Drop <ToastProvider /> near the app root once, then call toast.success/error/info/warn from any file.

import React, { memo } from 'react';
import ToastManager, { Toast as RNToast } from 'toastify-react-native';
import { useTheme } from 'react-native-paper';

// Provider component to mount once (e.g., in your RootLayout or App entry)
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
      config={config}
      style={{
        borderRadius: 12,
        elevation: 4,
        ...(style || {}),
      }}
      textStyle={{
        fontSize: 14,
        ...(textStyle || {}),
      }}
      // You can also set closeIcon defaults here if desired
      // closeIcon='close-outline'
      // closeIconFamily='Ionicons'
      // closeIconSize={22}
    />
  );
});

// Convenience helpers. Import { toast } to use.
export const toast = {
  show: (options = {}) => RNToast.show({
    autoHide: true,
    visibilityTime: options.visibilityTime ?? options.duration ?? 3000,
    position: options.position ?? 'top',
    type: options.type ?? 'default',
    text1: options.title ?? options.text1 ?? '',
    text2: options.message ?? options.text2,
    icon: options.icon,
    iconFamily: options.iconFamily,
    iconColor: options.iconColor,
    iconSize: options.iconSize,
    backgroundColor: options.backgroundColor,
    textColor: options.textColor,
    progressBarColor: options.progressBarColor,
    theme: options.theme,
    useModal: options.useModal,
    showCloseIcon: options.showCloseIcon,
    closeIcon: options.closeIcon,
    closeIconFamily: options.closeIconFamily,
    closeIconSize: options.closeIconSize,
    closeIconColor: options.closeIconColor,
    onShow: options.onShow,
    onHide: options.onHide,
    onPress: options.onPress,
  }),

  success: (message, opts = {}) => RNToast.success(
    message,
    opts.position ?? 'top',
    opts.icon,
    opts.iconFamily,
    opts.useModal
  ),
  error: (message, opts = {}) => RNToast.error(
    message,
    opts.position ?? 'top',
    opts.icon,
    opts.iconFamily,
    opts.useModal
  ),
  info: (message, opts = {}) => RNToast.info(
    message,
    opts.position ?? 'top',
    opts.icon,
    opts.iconFamily,
    opts.useModal
  ),
  warn: (message, opts = {}) => RNToast.warn(
    message,
    opts.position ?? 'top',
    opts.icon,
    opts.iconFamily,
    opts.useModal
  ),
  hide: () => RNToast.hide(),
};

// Suggested usage:
// 1) Mount provider once (e.g., in _layout.jsx or root):
//    <ToastProvider position="top" useModal={false} />
// 2) Use anywhere:
//    import { toast } from '../../components/overlays/AppToast';
//    toast.success('Saved!');
//    toast.error('Something went wrong');
//    toast.show({ type: 'success', title: 'Done', message: 'All set', position: 'bottom' });

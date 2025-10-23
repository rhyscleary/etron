// Author(s): Noah Bradley

import { Platform, View, StyleSheet, KeyboardAvoidingView, TouchableWithoutFeedback, Keyboard } from "react-native";
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import { useTheme } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ResponsiveScreen({
    children,
    scroll = true,  // Set if page is meant to be scrolled
    padded = true,
    center = true,
    header,
    footer,
    transparent = false,
    tapToDismissKeyboard = true,
}) {
    const contentStyles = [styles.content, padded && styles.padded, center && styles.centerGrow]
    const theme = useTheme();

    const safeBackground = transparent ? 'transparent' : theme.colors.background;

    const Inner = tapToDismissKeyboard ? (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
            <View style={contentStyles}>{children}</View>
        </TouchableWithoutFeedback>
    ) : (
        <View style={contentStyles}>{children}</View>
    )

    const Body = scroll ? (
        <KeyboardAwareScrollView
            enableOnAndroid
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            extraScrollHeight={20}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            enableAutomaticScroll
            extraHeight={Platform.OS === "android" ? 80 : 0}
        >
            {Inner}
        </KeyboardAwareScrollView>
    ) : (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior="padding"
        >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
                <View style={contentStyles}>{children}</View>
            </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
    )

    return (
        <SafeAreaView style={[styles.safe, { backgroundColor: safeBackground }]} edges={["left", "right"]}>
            {header ? (
                <View style={styles.header}>
                    {header}
                </View>
            ) : null }

            <View style={styles.body}>
                {Body}
            </View>

            {footer ? (<View style={[styles.footer, { backgroundColor: theme.colors.background }]}>
                {footer}
            </View>) :  null }
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1 },
    padded: { paddingHorizontal: 20, gap: 30, paddingBottom: 12 },
    scrollContent: { flexGrow: 1 },
    content: { flexGrow: 1, width: "100%" },
    centerGrow: {justifyContent: "center" },
    header: { width: "100%" },
    body: { flex: 1 },
    footer: { paddingHorizontal: 20, paddingBottom: 16, paddingTop: 8},
});

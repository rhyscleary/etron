import { Platform, View, StyleSheet, KeyboardAvoidingView, ScrollView } from "react-native";
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import { SafeAreaView } from "react-native-safe-area-context";

export default function ResponsiveScreen({
    children,
    scroll = true,  // Set if page is meant to be scrolled
    padded = true,
    center = true,
    footer
}) {
    const content = (
        <View
            style = {[
                styles.content,
                padded && styles.padded,
                center && styles.centerGrow,
            ]}
        >
            {children}
        </View>
    )

    const Body = scroll ? (
        <KeyboardAwareScrollView
            enableOnAndroid
            keyboardShouldPersistTaps="handled"
            extraScrollHeight={20}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            enableAutomaticScroll
        >
            {content}
        </KeyboardAwareScrollView>
    ) : (
        content
    )

    return (
        <SafeAreaView style={styles.safe} edges={["top", "right", "left"]}>
            {Body}
            {footer ?
                <View style={styles.footer}>
                    {footer}
                </View>
            :
                null
            }
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1 },
    padded: { paddingHorizontal: 20, gap: 30, paddingTop: 20, paddingBottom: 12 },
    scrollContent: { flexGrow: 1 },
    content: {flexGrow: 1, width: "100%" },
    centerGrow: {justifyContent: "center" },
    footer: { paddingHorizontal: 20, paddingBottom: 16, paddingTop: 8 },
});
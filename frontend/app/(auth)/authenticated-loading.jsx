import { ActivityIndicator } from "react-native-paper";
import { View } from "react-native";

export default function loading() {
    return (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <ActivityIndicator size="large" color="#0000ff" />;
        </View>
    )
}
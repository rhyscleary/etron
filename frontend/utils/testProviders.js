import { PaperProvider } from "react-native-paper";
import { SafeAreaProvider } from "react-native-safe-area-context";
import SafeView from "../components/layout/SafeView";
import { render } from "@testing-library/react-native";

export function renderwithProviders(elements) {
    return render(
        <SafeAreaProvider>
            <PaperProvider>
                <SafeView>
                    {elements}
                </SafeView>
            </PaperProvider>
        </SafeAreaProvider>
    );
}
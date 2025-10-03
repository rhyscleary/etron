// Author(s): Rhys Cleary

import { Pressable, ScrollView, View, Button } from "react-native";
import { Link, router, useRouter } from "expo-router";
import { Text, useTheme } from "react-native-paper";
import Header from "../../../../components/layout/Header";
import { commonStyles } from "../../../../assets/styles/stylesheets/common";
import DescriptiveButton from "../../../../components/common/buttons/DescriptiveButton";
import StackLayout from "../../../../components/layout/StackLayout";
import ResponsiveScreen from "../../../../components/layout/ResponsiveScreen";

const Collaboration = () => {
    const router = useRouter();
    const theme = useTheme();

    // container for different collaboration options
    const workspaceOptionButtons = [
            { label: "Users", description: "Manage users in the workspace", onPress: () => router.navigate("collaboration/users") },
            { label: "Roles", description: "Add and remove modules from the workspace", onPress: () => router.navigate("collaboration/roles") },
            { label: "Invites", description: "Manage invites to the workspace", onPress: () => router.navigate("collaboration/invites") },
            { label: "Workspace Log", description: "Audit log of actions within the workspace", onPress: () => router.navigate("collaboration/workspace-log") }
    ];

    return (
		<ResponsiveScreen
			header={
                <Header title="Collaboration" showMenu />
            }
			center={false}
			padded={false}
            scroll={true}
		>

            <ScrollView contentContainerStyle={commonStyles.scrollableContentContainer}>
                <StackLayout spacing={12}>
                    {/*Temporary redirect to profile screen*/}
                    <Button title="Temporary - Back to Dashboard" onPress={() => router.navigate("/profile")} />
                    {workspaceOptionButtons.map((item) => (
                        <DescriptiveButton 
                            key={item.label}
                            icon={item.icon}
                            label={item.label}
                            description={item.description}
                            onPress={item.onPress}
                        />
                    ))}
                </StackLayout>

            </ScrollView>

        </ResponsiveScreen>
    )
}

export default Collaboration;
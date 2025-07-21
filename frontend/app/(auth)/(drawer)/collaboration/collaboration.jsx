// Author(s): Rhys Cleary

import { Pressable, ScrollView, View } from "react-native";
import { Link, router, useRouter } from "expo-router";
import { Text, useTheme } from "react-native-paper";
import Header from "../../../../components/layout/Header";
import { commonStyles } from "../../../../assets/styles/stylesheets/common";
import DescriptiveButton from "../../../../components/common/buttons/DescriptiveButton";
import StackLayout from "../../../../components/layout/StackLayout";

const Collaboration = () => {
    const router = useRouter();
    const theme = useTheme();

    // container for different collaboration options
    const workspaceOptionButtons = [
            { label: "Users", description: "Manage users in the workspace", onPress: () => router.push("collaboration/users") },
            { label: "Roles", description: "Add and remove modules from the workspace", onPress: () => router.push("collaboration/invites") },
            { label: "Invites", description: "Manage invites to the workspace", onPress: () => router.push("collaboration/invite-user") },
            { label: "Workspace Log", description: "Audit log of actions within the workspace", onPress: () => router.push("collaboration/workspace-log") }
    ];

    return (
        <View style={commonStyles.screen}>
            <Header title="Collaboration" showMenu />

            {/*Temporary redirect to profile screen*/}
            <Link href="/profile" asChild>
                <Pressable>
                    <Text>temp home page</Text>
                </Pressable>
            </Link>
            
            {/*Temporary redirect to collab/workspace join endpoints screen*/}
            <Link href="/collaboration/collab-endpoints" asChild>
                <Pressable>
                    <Text>Go to Endpoints</Text>
                </Pressable>
            </Link>

            <ScrollView contentContainerStyle={commonStyles.scrollableContentContainer}>
                <StackLayout spacing={12}>
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

        </View>
    )
}

export default Collaboration;
import { View, FlatList, Pressable } from "react-native";
import Header from "../../../../components/layout/Header";
import { commonStyles } from "../../../../assets/styles/stylesheets/common";
import { Text } from "react-native-paper";
import { router } from "expo-router";

// Static list of roles
const roles = [
    { id: "1", name: "Business Owner" },
    { id: "2", name: "Manager" },
    { id: "3", name: "Employee" }
];

const Roles = () => {
    return (
        <View style={commonStyles.screen}>
            <Header
                title="Roles"
                showBack
                showPlus
                onRightIconPress={() => router.push("/collaboration/roles/add")}
            />

            <FlatList
                data={roles}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ paddingVertical: 16 }}
                renderItem={({ item }) => (
                    <Pressable
                        onPress={() => console.log(`Tapped role: ${item.name}`)}
                        style={{
                            borderWidth: 1,
                            borderColor: '#ccc',
                            borderRadius: 4,
                            padding: 16,
                            marginVertical: 2,
                            marginHorizontal: 12
                        }}
                    >
                        <Text>{item.name}</Text>
                    </Pressable>
                )}
            />
        </View>
    );
};

export default Roles;

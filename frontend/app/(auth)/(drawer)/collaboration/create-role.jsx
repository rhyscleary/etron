import { View } from "react-native";
import Header from "../../../../components/layout/Header";
import { commonStyles } from "../../../../assets/styles/stylesheets/common";
import { Text, TextInput } from "react-native-paper";
import { useState } from "react";

const CreateRole = () => {
    const [roleName, setRoleName] = useState("");


  const handleCheck = async () => {

  };

    return (
        <View style={commonStyles.screen}>
            <Header
                title="Create Role"
                showBack
                showCheck
                // onRightIconPress={handleCheck}
            />
            <TextInput
                label="Role Name"
                value={roleName}
                onChangeText={setRoleName}
                mode="outlined"
                style={{ marginVertical: 16 }}
            />

            <Text>Permissions</Text>
        </View>
    );
};

export default CreateRole;

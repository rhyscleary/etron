// Author(s): Holly Wyatt

import { View, ScrollView } from 'react-native'
import { commonStyles } from '../../../../../assets/styles/stylesheets/common';
import Header from '../../../../../components/layout/Header';
import { useTheme, Text } from "react-native-paper";
import StackLayout from '../../../../../components/layout/StackLayout';
import DescriptiveButton from '../../../../../components/common/buttons/DescriptiveButton';
import { router } from 'expo-router';

const PasswordSecurity = () => {
    const theme = useTheme();

    return(
        <View style={commonStyles.screen}>
            <Header title="Password and Security" showBack></Header>
            <ScrollView contentContainerStyle={commonStyles.scrollableContentContainer} >
                <StackLayout spacing={20}>
                    <StackLayout spacing={4}>
                        <Text style={commonStyles.listItemText}>Login and Recovery</Text>
                        <Text style={commonStyles.captionText}>Update your password and recovery methods</Text>
                    </StackLayout>
                    <DescriptiveButton 
                        key={"Update Password"}
                        label={"Update Password"}
                        onPress={ () => router.navigate("/settings/account/update-password")}
                        focused={true}
                    />
                </StackLayout>
            </ScrollView>
        </View>
    )
}

export default PasswordSecurity;
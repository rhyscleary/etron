import { View, ScrollView } from 'react-native'
import { commonStyles } from '../../../../../assets/styles/stylesheets/common';
import Header from '../../../../../components/layout/Header';
import StackLayout from '../../../../../components/layout/StackLayout';
import DescriptiveButton from '../../../../../components/common/buttons/DescriptiveButton';
import { router } from 'expo-router';

const Account = () => {



    const accountSettingsButtons = [
        { label: "Personal Details", description: "Update first and last name, phone number, and avatar", onPress: () => router.push("/settings/account/personal-details")},
        { label: "Password and Security", onPress: () => router.push("/settings/account/password-security") },
        { label: "Delete Account" }
    ]

    return(
        <View style={commonStyles.screen}>
            <Header title="Manage Account" showBack></Header>
            <ScrollView contentContainerStyle={commonStyles.scrollableContentContainer} >
                <StackLayout spacing={127}>
                    <DescriptiveButton
                        key={"Profiles"}
                        label={"Profiles"}
                    />
                    <StackLayout spacing={12}>
                        {accountSettingsButtons.map((item) => (
                            <DescriptiveButton
                                key={item.label}
                                label={item.label}
                                description={item.description}
                                onPress={item.onPress}
                            />
                        ))}
                    </StackLayout>
                </StackLayout>
            </ScrollView>
        </View>
    )
}

export default Account;
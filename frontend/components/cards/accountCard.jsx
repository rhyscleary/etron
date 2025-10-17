import { Pressable, StyleSheet, View } from "react-native";
import { Avatar, Card, Icon, Text, useTheme } from "react-native-paper"
import StackLayout from "../layout/StackLayout";
import { commonStyles } from "../../assets/styles/stylesheets/common";
import BasicButton from "../common/buttons/BasicButton";
import { themes } from "../../assets/styles/themes/themes";

const AccountCard = ({
    onPress,
    account,
    loading = false,
    active = false
}) => {
    const theme = useTheme();

    return (
        <Card mode="elevated" style={[
            styles.card, {
                backgroundColor: themes.dark.colors.buttonBackground
            }
        ]}>
            <Card.Content>
                <StackLayout spacing={8}>
                    <View style={{
                        padding: 4,
                        borderRadius: 8,
                        //flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                    }}>
                        <Text style={[commonStyles.listItemText, { fontWeight: 'bold' }]}>{account.email}</Text>
                        <BasicButton
                            label="Switch to"
                            onPress={onPress}
                            disabled={active || loading}
                        />
                    </View>
                </StackLayout>
            </Card.Content> 
        </Card>
    );
}

const styles = StyleSheet.create({
    card: {
        alignSelf: "stretch",
    }
})

export default AccountCard;
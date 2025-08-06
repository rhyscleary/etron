import { Pressable, StyleSheet, View } from "react-native";
import { Avatar, Card, Icon, Text, useTheme } from "react-native-paper"
import StackLayout from "../layout/StackLayout";
import { commonStyles } from "../../assets/styles/stylesheets/common";
import BasicButton from "../common/buttons/BasicButton";

const AccountCard = ({
    onPress,
    account,
    loading = false,
}) => {
    const theme = useTheme();

    return (
            <Card mode="elevated" style={[
                styles.card, {
                    backgroundColor: theme.colors.buttonBackground,
                    }
                ]}>
                <Card.Content>
                    <StackLayout spacing={8}>
                        <View style={{
                            flexDirection: "row", 
                            alignItems: "flex-start",
                            padding: 4,
                            borderRadius: 8,
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                        }}>
                            <StackLayout spacing={2}>
                                <Text style={[commonStyles.listItemText, { fontWeight: 'bold' }]}>{account.name}</Text>
                                <Text style={[commonStyles.captionText, { color: theme.colors.themeGrey, fontStyle: 'italic' }]}>
                                    {account.email}
                                </Text>
                            </StackLayout>
                            <BasicButton
                                label="Switch Account"
                                onPress={onPress}
                                disabled={loading}
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
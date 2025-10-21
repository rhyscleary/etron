// Author(s): Rhys Cleary

import { useRouter } from "expo-router"
import { Pressable, StyleSheet, View } from "react-native";
import { Avatar, Card, Icon, Text, useTheme } from "react-native-paper"
import StackLayout from "../layout/StackLayout";
import { commonStyles } from "../../assets/styles/stylesheets/common";

const InviteCard = ({
    invite,
    selected,
    onSelect
}) => {
    const theme = useTheme();

    return (
        <Pressable onPress={() => onSelect(invite)}>
            <Card 
                mode="elevated" 
                style={[
                    styles.card, 
                    {backgroundColor: theme.colors.buttonBackground}, 
                    selected && { borderWidth: 2, borderColor: theme.colors.outline }
                ]}>
                <Card.Content>
                    <StackLayout spacing={8}>
                        <View style={styles.cardContent}>
                            <View style={styles.iconContainer}>
                                <Icon source="account-group" size={48} />
                            </View>
                            <StackLayout spacing={2}>
                                <Text 
                                    style={[commonStyles.listItemText, { fontWeight: 'bold' }]}
                                    numberOfLines={1}
                                    ellipsizeMode="tail"
                                >
                                    {invite.workspaceName}
                                </Text>
                                <Text 
                                    style={{ flex: 1 }}
                                    numberOfLines={0}
                                >
                                    {invite.workspaceDescription}
                                </Text>
                                <Text 
                                    style={[commonStyles.captionText, { color: theme.colors.themeGrey}]}
                                >
                                    Expires at: {invite.expireAt}
                                </Text>
                            </StackLayout>
                        </View>
                    </StackLayout>
                </Card.Content>
            </Card>
        </Pressable>
        
    );
};

const styles = StyleSheet.create({
    card: {
        alignSelf: "stretch",
    },
    cardContent: {
        flexDirection: "row",
        alignItems: "flex-start",
        padding: 4,
        borderRadius: 8,
    },
    iconContainer: {
        marginRight: 16
    }
});

export default InviteCard;
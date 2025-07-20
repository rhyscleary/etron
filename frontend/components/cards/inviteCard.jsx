// Author(s): Rhys Cleary

import { useRouter } from "expo-router"
import { Pressable, StyleSheet, View } from "react-native";
import { Avatar, Card, Icon, Text, useTheme } from "react-native-paper"

const InviteCard = ({
    invite,
    selected,
    onSelect
}) => {
    const theme = useTheme();

    return (
        <Pressable onPress={() => onSelect(invite)}>
            <Card mode="elevated" style={[styles.card, selected && styles.selectedCard]}>
                <Card.Content>
                    <Text></Text>
                </Card.Content>
            </Card>
        </Pressable>
        
    );
};

const styles = StyleSheet.create({
    card: {
        alignSelf: "stretch",
        height: 142.5
    },
    selectedCard: {
        
    }
});

export default InviteCard;
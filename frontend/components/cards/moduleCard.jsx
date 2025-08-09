// Author(s): Rhys Cleary

import { useRouter } from "expo-router"
import { Pressable, StyleSheet, View } from "react-native";
import { Avatar, Card, Icon, Text, useTheme } from "react-native-paper"

const ModuleCard = ({
    onPress,
    title = "",
    icon = "",
    description = ""
}) => {
    const theme = useTheme();

    return (
        <Pressable onPress={onPress}>
            <Card mode="elevated" style={[styles.card, {backgroundColor: theme.colors.buttonBackground}]}>
                <Card.Content>
                    <View style={{flexDirection: "row", alignItems: "flex-start"}}>
                        {icon ? (
                            <Icon source={icon} size={48} />
                        ) : (
                            <Icon source="dots-square" size={48} />
                        )} 
                        <View style={{flex: 1, marginLeft: 6}}>
                            <Text variant="titleMedium" numberOfLines={1} style={{marginBottom: 6}}>Card title</Text>
                            <Text variant="bodyMedium" numberOfLines={4}>Card description 1234 1234 1234 1234 1234 1234 1234 1234 1234 1234 123454</Text>
                        </View>
                    </View>
                </Card.Content> 
            </Card>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    card: {
        alignSelf: "stretch",
        height: 142.5
    }
})

export default ModuleCard;
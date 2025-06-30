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
            <Card style={[styles.card, {backgroundColor: theme.colors.buttonBackground}]}>
                <Card.Title 
                    title={title}
                    subtitle={description}
                    left={(props) => (
                        <Icon
                            {...props}
                            source={icon}
                            size={48}
                        />
                    )} 
                />
                <Card.Content>
                    <Text>Card title maybe</Text>
                    <Text>Card description maybe</Text>
                </Card.Content> 
            </Card>
        </Pressable>
    );
}

const styles = StyleSheet.create({

})

export default ModuleCard;
import { useRouter } from "expo-router"
import { Pressable, View } from "react-native";
import { Avatar, Card, Icon, Text, useTheme } from "react-native-paper"

const ModuleCard = ({
    onPress,
    moduleName = "",
    icon = "",
    description = ""
}) => {
    const theme = useTheme();

    return (
        <Pressable onPress={onPress}>
            <Card>
                <Card.Title 
                    title={moduleName}
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

export default ModuleCard;
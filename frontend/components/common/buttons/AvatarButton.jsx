// Author(s): Rhys Cleary

import { View, StyleSheet, Pressable} from 'react-native';
import { Avatar, Badge, Button, Icon, useTheme } from 'react-native-paper';

const AvatarButton = ({
    type = "icon", // icon, image or text
    imageSource,
    firstName = "",
    lastName = "",
    badgeType = "plus", // add, edit or remove
    size = 72,
    onPress,
}) => {
    const theme = useTheme();

    const getInitials = () => {
        const firstInitial = firstName?.charAt(0).toUpperCase() || "";
        const lastInitial = lastName?.charAt(0).toUpperCase() || "";
        return firstInitial + lastInitial;
    }

    const badgeIcons = {
        add: "plus",
        edit: "pencil",
        remove: "close",
    };
    
    const renderAvatar = () => {
        switch (type) {
            case "image":
                return <Avatar.Image size={size} source={imageSource} />;
            case "text":
                return <Avatar.Text size={size} label={getInitials()} />;
            default:
                return <Avatar.Icon size={size} icon="account" />;
        }
    }
    return (
        <Pressable onPress={onPress}>
            <View style={styles.container}>
                {renderAvatar()}
                <Badge size={24} style={[styles.badge, { backgroundColor: theme.colors.badgeBackgroundColor }]}>
                    <Icon source={badgeIcons[badgeType] || "plus"} size={16} color="white" />
                </Badge> 
            </View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'relative',
        width: 72,
        height: 72,
    },
    badge: {
        position: 'absolute',
        bottom: -2,
        right: -2
    }
});

export default AvatarButton;
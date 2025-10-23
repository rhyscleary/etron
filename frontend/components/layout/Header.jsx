// Author(s): Rhys Cleary, Matthew Page, Noah Bradley

import { useRouter } from "expo-router";
import { useState } from "react";
import { Appbar, useTheme, Menu, Text } from "react-native-paper";
import { useNavigation } from '@react-navigation/native';

/*
    Removed code. Incase want to add a second right icon:
    {rightIcon && (<Appbar.Action icon={rightIcon} onPress={onRightIconPress} />)}
*/

const Header = ({
    title,
    showBack,
    showMenu,
    showEdit,
    showCheck,
    showCheckLeft,
    showPlus,
    showEllipsis,
    rightIconPermission = true,
    onRightIconPress,
    onLeftIconPress,
    onEllipsisPress,
    customBackAction,
    onBackPress,
    backIcon
}) => {
    const router = useRouter();
    const theme = useTheme();
    const navigation = useNavigation();

    const [noPermVisible, setNoPermVisible] = useState(false);
    
    const RightIconAnchor = (
        <Appbar.Action
            icon={showPlus ? "plus"
                : showEdit ? "pencil"
                : showCheck ? "check"
                : "line"}
            color={rightIconPermission ? undefined : theme.colors.onSurfaceDisabled ?? theme.colors.onSurfaceVariant}  // Dims when user doesn't have permission
            style={!rightIconPermission ? { opacity: 0.6 } : null}
            onPress={async () => {
                if (!rightIconPermission) {
                    setNoPermVisible(true);
                    setTimeout(() => setNoPermVisible(false), 1600);
                    return;
                }
                if (onRightIconPress) await onRightIconPress();
            }}
        />
    );

    return (
        <Appbar.Header mode="center-aligned"
            style={{
                backgroundColor: theme.colors.background,
                marginBottom: 12
            }}
        >
            {
                showBack ? (
                    <Appbar.Action
                        icon={backIcon || "arrow-left"}
                        onPress={async() => {
                            if (onBackPress) return await onBackPress();
                            router.back();
                        }} 
                    />
                ) : showMenu ? (
                    <Appbar.Action icon="menu" onPress={() => navigation.openDrawer()} />
                ) : null
            }
            
            <Appbar.Content title={title} />

            {showEllipsis && (
                <Appbar.Action icon="dots-vertical" onPress={onEllipsisPress} />
            )}

            {(showPlus || showEdit || showCheck) && (
                rightIconPermission ? (
                    RightIconAnchor
                ) : (
                    <Menu
                        visible={noPermVisible}
                        onDismiss={() => setNoPermVisible(false)}
                        anchor={RightIconAnchor}
                        contentStyle={{
                            paddingVertical: 6,
                            paddingHorizontal: 10,
                            borderRadius: 8,
                        }}
                    >
                        <Text
                            style={{
                                color: theme.colors.onSurface,
                                maxWidth: 220,
                                lineHeight: 18
                            }}
                        >
                            You don't have permission to perform this action.
                        </Text>
                    </Menu>
                )
            )}
        </Appbar.Header>
    );
}

export default Header;
// Author(s): Rhys Cleary, Matthew Page

import { useRouter } from "expo-router";
import { Appbar, useTheme, Searchbar } from "react-native-paper";

/*
TODO:
    - Will need to add in navigation rail into the onPress() of the menu action
    - Likely will change the icon styles depending on the users OS

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
    onRightIconPress,
    onLeftIconPress,
    onEllipsisPress,
    customBackAction,
    onBackPress
}) => {
    const router = useRouter();
    const theme = useTheme();

    return (
        <Appbar.Header mode="center-aligned" style={[{backgroundColor: theme.colors.background}, {marginBottom: 12}]}>
            {
                showBack ? (
                    <Appbar.BackAction onPress={customBackAction || (() => {
                        if (onBackPress) {
                            onBackPress();
                        } else {
                            router.back()
                        }
                    })} 
                    />
                ) : showMenu ? (
                    <Appbar.Action icon="menu" onPress={() => {}} />
                ) : null
            }
            
            <Appbar.Content title={title} />
            {showEllipsis && (
                <Appbar.Action icon="dots-vertical" onPress={onEllipsisPress} />
            )}
            {
                showPlus ? (
                    <Appbar.Action icon="plus" onPress={onRightIconPress} />
                ) : showEdit ? (
                    <Appbar.Action icon="pencil" onPress={onRightIconPress} />
                ) : showCheck ? (
                    <Appbar.Action icon="check" onPress={onRightIconPress} />
                ) : null
            }

        </Appbar.Header>
    );
}

export default Header;
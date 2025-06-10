// Author(s): Rhys Cleary

import { useNavigation } from "@react-navigation/native";
import { Appbar, useTheme } from "react-native-paper";

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
    showPlus,
    onRightIconPress
}) => {
    const nav = useNavigation();
    const theme = useTheme();

    return (
        <Appbar.Header mode="center-aligned" style={{backgroundColor: theme.colors.background}}>
            {
                showBack ? (
                    <Appbar.BackAction onPress={() => nav.goBack()} />
                ) : showMenu ? (
                    <Appbar.Action icon="menu" onPress={() => {}} />
                ) : null
            }
            
            <Appbar.Content title={title} />

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
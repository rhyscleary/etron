// Author(s): Rhys Cleary

import { DrawerActions } from "@react-navigation/native";
import { useNavigation, useRouter } from "expo-router";
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
    showPlus,
    onRightIconPress
}) => {
    const router = useRouter();
    const theme = useTheme();
    const navigation = useNavigation();

    return (
        <Appbar.Header mode="center-aligned" style={[{backgroundColor: theme.colors.background}, {marginBottom: 12}]}>
            {
                showBack ? (
                    <Appbar.BackAction onPress={() => router.back()} />
                ) : showMenu ? (
                    <Appbar.Action icon="menu" onPress={() => navigation.dispatch(DrawerActions.openDrawer())} />
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
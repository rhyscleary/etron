// Author(s): Rhys Cleary

import { View, StyleSheet} from 'react-native';
import { Button, useTheme } from 'react-native-paper';

const BasicButton = ({
    danger = false,
    altBackground = false,
    altText = false,
    label,
    onPress,
    fullWidth = false,
    style,
    disabled = false,
}) => {
    const theme = useTheme();
    
    let buttonColor;
    if (danger) {
        buttonColor = theme.colors.error;
    } else if (altBackground) {
        buttonColor = theme.colors.buttonBackground;
    } else {
        buttonColor = theme.colors.primary;
    }

    let textColor = altText
        ? theme.colors.textAlt
        : theme.colors.text;

    return (
        <Button 
            compact  
            mode="contained" 
            textColor={textColor}  
            buttonColor={buttonColor}
            disabled={disabled}
            style={[
                styles.button,
                fullWidth ? styles.fullWidth : styles.fixedWidth
            ]}
            onPress={onPress}
            //disabled={disabled}
        >
            {label}
        </Button>
    );
}

const styles = StyleSheet.create({
    button: {
        borderRadius: 10,
    },
    fixedWidth: {
        width: 145,
        maxWidth: "100%",
        flexShrink: 1
    },
    fullWidth: {
        width: '100%',
    },
});

export default BasicButton;
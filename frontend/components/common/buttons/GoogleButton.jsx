import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { Icon, useTheme } from 'react-native-paper';

const GoogleButton = ({
    icon,
    imageSource,
    label,
    onPress,
    style
}) => {
    const theme = useTheme();

    return (
        <Pressable
            onPress={onPress}
            style={[
                styles.googleButton, 
                {
                    borderColor: theme.colors.altGM, 
                    backgroundColor: theme.colors.background
                }, 
                style
            ]}
        >
        
        <View style={styles.innerContainer}>
            {imageSource ? (
                <Image
                    source={imageSource}
                    style={styles.logoImage}
                    resizeMode="contain"
                />
            ) : icon ? (
                <Icon
                    source={icon}
                    size={24}
                    color={theme.colors.icon}
                    style={styles.icon}
                />
            ) : null}

            <Text style={[styles.labelText, { color: theme.colors.altGM, marginLeft: 10 }]}>
                {label}
            </Text>
        </View>

        </Pressable>
    );
}

const styles = StyleSheet.create({
  googleButton: {
    borderRadius: 10,
    width: '100%',
    borderWidth: 1,
    marginVertical: 6,
  },
  innerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',  // center horizontally
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  icon: {
    marginRight: 10,
  },
  logoImage: {
    width: 24,
    height: 24,
    marginRight: 10,
  },
  labelText: {
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default GoogleButton;
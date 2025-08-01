import { Background } from '@react-navigation/elements';
import { View, StyleSheet } from 'react-native';
import { Button, useTheme, Icon } from 'react-native-paper';

const IconButton = ({
  altText = false,
  icon,
  label,
  onPress,
  fullWidth = false,
  style,
  loading = false,
}) => {
  const theme = useTheme();

  return (
    <View>
      <Button
          icon={() => (
            <Icon source={icon} size={24} color={theme.colors.themeGrey} />
          )}
        compact
        mode="elevated"
        textColor={theme.colors.themeGrey}
        loading={loading}
        style={[
          styles.button,
          fullWidth ? styles.fullWidth : styles.fixedWidth,
          style,
          {backgroundColor: theme.colors.buttonBackground, }
        ]}
        contentStyle={styles.content}
        labelStyle={styles.label}
        onPress={onPress}
      >
        {label}
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 4,
    paddingHorizontal: 8,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    fontWeight: "400"
  },
  fullWidth: {
    width: '100%',
  },
});

export default IconButton;

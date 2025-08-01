import { Background } from '@react-navigation/elements';
import { View, StyleSheet } from 'react-native';
import { Button, useTheme } from 'react-native-paper';

const IconButton = ({
  altText = false,
  icon,
  label,
  onPress,
  fullWidth = false,
  style,
}) => {
  const theme = useTheme();

  return (
    <View>
      <Button
        icon={icon}
        compact
        mode="elevated"
        textColor={theme.colors.text}
        style={[
          styles.button,
          fullWidth ? styles.fullWidth : styles.fixedWidth,
          style,
          {backgroundColor: theme.colors.buttonBackground}
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
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    marginLeft: 8,
    fontWeight: "400"
  },
  fixedWidth: {
    width: 145,
  },
  fullWidth: {
    width: '100%',
  },
});

export default IconButton;

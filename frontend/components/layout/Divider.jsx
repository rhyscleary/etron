import { View, StyleSheet } from 'react-native';
import { useTheme } from 'react-native-paper';

const Divider = ({ thickness = 2, color, style }) => {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.divider,
        {
          height: thickness,
          backgroundColor: color ?? theme.colors.text,
        },
        style
      ]}
    />
  );
};

const styles = StyleSheet.create({
  divider: {
    width: '100%',
  },
});

export default Divider;
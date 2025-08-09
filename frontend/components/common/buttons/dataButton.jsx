import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Icon, useTheme, Card } from 'react-native-paper';

const DataButton = ({
  icon,
  label,
  description,
  onPress,
  boldLabel = true,
  selected = false,
}) => {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.dataButton,
        selected && ({
          borderColor: theme.colors.secondary,
          borderWidth: 2,
        }),
      ]}
    >
      <Card
        mode={selected ? 'elevated' : 'compact'}
        style={[
          styles.card,
          selected && ({
              backgroundColor: theme.colors.buttonBackground,
            }),
        ]}
      >
        <Card.Content>
          <View style={styles.innerContainer}>
            {icon ? (
              <Icon source={icon} size={28} color={theme.colors.themeGrey} />
            ) : null}

            <View style={styles.textContainer}>
              <Text
                style={[
                  styles.labelText,
                  { color: theme.colors.text },
                  !boldLabel && { fontWeight: 'normal' },
                ]}
              >
                {label}
              </Text>
              {description ? (
                <Text
                  style={[styles.descriptionText, { color: theme.colors.themeGrey }]}
                >
                  {description}
                </Text>
              ) : null}
            </View>
          </View>
        </Card.Content>
      </Card>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    alignSelf: 'stretch',
    backgroundColor: 'transparent',
  },
  dataButton: {
    borderRadius: 10,
    width: '100%',
  },
  innerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 0,
    borderRadius: 2,
    justifyContent: 'space-between',
  },
  textContainer: {
    flex: 1,
    flexShrink: 1,
    marginLeft: 14,
    marginRight: 14,
  },
  labelText: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  descriptionText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
});

export default DataButton;

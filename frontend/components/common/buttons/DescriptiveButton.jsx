// Author(s): Rhys Cleary, Holly Wyatt

import { View, Text, StyleSheet, Pressable } from "react-native";
import { Icon, useTheme } from "react-native-paper";

const DescriptiveButton = ({
  icon,
  label,
  description,
  onPress,
  showChevron = true,
  variant = "standard",
}) => {
  const theme = useTheme();

  const isDrawer = variant === "drawer";

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.descriptiveButton,
        isDrawer ? styles.drawerButton : styles.standardButton,
        {
          backgroundColor: isDrawer
            ? theme.colors.primaryP8
            : theme.colors.buttonBackground,
          borderColor: isDrawer ? "transparent" : theme.colors.outline,
        },
      ]}
    >
      <View style={styles.innerContainer}>
        {icon && (
          <Icon
            source={icon}
            size={28}
            color={isDrawer ? theme.colors.black : theme.colors.icon}
          />
        )}

        <View style={styles.textContainer}>
          <Text
            style={[
              styles.labelText,
              { color: isDrawer ? theme.colors.black : theme.colors.text },
            ]}
          >
            {label.replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase())}
          </Text>
          {description && !isDrawer && (
            <Text
              style={[styles.descriptionText, { color: theme.colors.text }]}
            >
              {description}
            </Text>
          )}
        </View>

        {showChevron && (
          <Icon
            source="chevron-right"
            size={28}
            color={isDrawer ? theme.colors.black : theme.colors.icon}
          />
        )}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  descriptiveButton: {
    borderRadius: 10,
    width: "100%",
    borderWidth: 2,
  },
  standardButton: {

  },
  drawerButton: {
    height: 55,
    borderWidth: 0,
    justifyContent: "center",
  },
  innerContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  textContainer: {
    flex: 1,
    flexShrink: 1,
    marginLeft: 14,
    marginRight: 14,
  },
  labelText: {
    fontWeight: "bold",
    fontSize: 16,
  },
  descriptionText: {
    fontSize: 14,
  },
});

export default DescriptiveButton;

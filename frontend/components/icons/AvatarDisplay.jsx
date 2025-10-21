// Author(s): Rhys Cleary

import { View, StyleSheet } from "react-native";
import { Avatar, useTheme } from "react-native-paper";

const AvatarDisplay = ({
  imageSource,
  firstName = "",
  lastName = "",
  size = 72,
  backgroundColor = "#008663", // default for text avatars
}) => {
  const theme = useTheme();

  const getInitials = () => {
    const firstInitial = firstName?.charAt(0).toUpperCase() || "";
    const lastInitial = lastName?.charAt(0).toUpperCase() || "";
    return firstInitial + lastInitial;
  };

  return (
    <View style={styles.container}>
      {imageSource ? (
        <Avatar.Image
          size={size}
          source={imageSource}
          style={[{ backgroundColor: theme.colors.buttonBackground }]}
        />
      ) : (
        <Avatar.Text
          size={size}
          label={getInitials()}
          style={[{ backgroundColor }]}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
});

export default AvatarDisplay;
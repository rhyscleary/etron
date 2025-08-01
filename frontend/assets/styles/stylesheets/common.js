import { StyleSheet } from "react-native";

export const commonStyles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scrollableContentContainer: {
    paddingBottom: 100,
  },
  inlineButtonContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginVertical: 30,
    gap: 32,
  },
  listItemText: {
    fontSize: 16,
  },
  captionText: {
    fontSize: 12,
  },
  titleText: {
    fontSize: 20,
  },
});

import { StyleSheet } from "react-native";
import { SearchBar } from "react-native-screens";

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
  searchBar: {
    borderRadius: 4,
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
  floatingButtonContainer: {
    position: "absolute",
    right: 10,
    bottom: 20,
    zIndex: 10,
  },
});

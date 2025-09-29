import React from 'react';
import { StyleSheet } from 'react-native';
import { Searchbar } from 'react-native-paper';

const ContentsSearchBar = ({ value, onChangeText, placeholder = 'Search' }) => {
  return (
    <Searchbar
      placeholder={placeholder}
      value={value}
      onChangeText={onChangeText}
      style={styles.searchbar}
      inputStyle={styles.input}
      autoCorrect={false}
      autoCapitalize="none"
    />
  );
};

const styles = StyleSheet.create({
  searchbar: {
    marginHorizontal: 0,
    marginBottom: 8,
    elevation: 0,
    borderRadius: 4,
    backgroundColor: "#494949",
  },
  input: {
    fontSize: 14,
  },
});

export default React.memo(ContentsSearchBar);

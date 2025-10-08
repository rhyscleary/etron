import { View, StyleSheet, ScrollView } from 'react-native';
import { Searchbar, useTheme, Chip, IconButton } from 'react-native-paper';
import React, { useState } from 'react';

const SearchBar = ({
    placeholder = "Search",
    onSearch = () => {},
    onFilterChange = () => {},
    filters
}) => {
    const[searchQuery, setSearchQuery] = useState('');
    const theme = useTheme();

    // create filter state if filters exist
    const [selectedFilter, setSelectedFilter] = useState(
        filters && filters.length > 0 ? filters[0] : null
    );

    const handleSearch = () => {
        onSearch(searchQuery);
    };

    const handleFilterPress = (filter) => {
        setSelectedFilter(filter);
        onFilterChange(filter);
    };

    return (
        <View style={styles.container}>
            <Searchbar
                placeholder={placeholder}
                placeholderTextColor={theme.colors.placeholderText}
                onChangeText={(text) => {
                    setSearchQuery(text);
                    onSearch(text);
                }}
                value={searchQuery}
                onIconPress={handleSearch}
                style={[
                    styles.searchbar,
                    {
                        backgroundColor: theme.colors.background,
                        borderColor: theme.colors.outline,
                    }
                ]}
                inputStyle={{ fontSize: 16 }}
                iconColor={theme.colors.icon}
            />

            {filters && filters.length > 0 && (
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.chipRow}
                >
                    {filters.map((filter) => (
                        <Chip
                            key={filter}
                            mode="flat"
                            showSelectedCheck={false}
                            selected={selectedFilter === filter}
                            onPress={() => handleFilterPress(filter)}
                            style={[
                                styles.chip,
                                {
                                    borderRadius: 14,
                                    backgroundColor: selectedFilter === filter
                                        ? theme.colors.primary
                                        : theme.colors.surfaceVariant,
                                    paddingVertical: 2
                                }
                            ]}
                            textStyle={{
                                fontSize: 12,
                                color: selectedFilter === filter ? theme.colors.onPrimary : theme.colors.text,
                                lineHeight: 12
                            }}
                        >
                            {filter}
                        </Chip>
                    ))}


                </ScrollView>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 10,
        marginHorizontal: 20,
    },
    searchbar: {
        borderRadius: 10,
        borderWidth: 1,
    },
    chipRow: {
        flexDirection: 'row',
        paddingVertical: 10,
        gap: 8,
        alignItems: 'center',
    },
    chip: {
        marginRight: 8,
    },
});

export default SearchBar;
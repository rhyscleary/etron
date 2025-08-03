import { View, StyleSheet } from 'react-native';
import { Searchbar, useTheme, Chip, IconButton } from 'react-native-paper';
import React, { useState } from 'react';

const filterOptions = ['All', 'Active', 'Inactive'];

const SearchBar = ({
    placeholder = "Search",
    onSearch = () => {},
    onFilterChange = () => {},
}) => {
    const[searchQuery, setSearchQuery] = useState('');
    const [selectedFilter, setSelectedFilter] = useState('All');
    const [showFilters, setShowFilters] = useState(false);
    const theme = useTheme();

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
                onChangeText={setSearchQuery}
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

            <View style={styles.filterToggleContainer}>
                <IconButton
                    icon="sort-variant"
                    size={24}
                    onPress={() => setShowFilters(!showFilters)}
                    iconColor={theme.colors.icon}
                />

                {showFilters && (
                    <View style={styles.chipRow}>
                        {filterOptions.map((filter) => (
                            <Chip
                                key={filter}
                                selected={selectedFilter === filter}
                                onPress={() => handleFilterPress(filter)}
                                style={[
                                    styles.chip,
                                    { backgroundColor: theme.colors.background },
                                ]}
                            >
                                {filter}
                            </Chip>
                        ))}
                    </View>
                )}
            </View>
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
    filterToggleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: -5,
        marginLeft: -10,
    },
    chipRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginLeft: 8,
        gap: 6,
        alignItems: 'center',
    },
    chip: {
        marginRight: 6,
        marginBottom: 6,
    },
});

export default SearchBar;
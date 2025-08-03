import { View, StyleSheet, Pressable } from 'react-native';
import { useTheme, Text, Icon, Surface } from 'react-native-paper';
import FilterButton from '../common/buttons/FilterButton';
import { commonStyles } from '../../assets/styles/stylesheets/common';
import Searchbar from 'react-native-paper';

const FilterBar = ({
    filters = [], 
    activeFilter,
    onFilterChange,
    style,
    collapsedLimit = 1,
}) => {
    const theme = useTheme();
    
    if (!filters || filters.length === 0) {
        return null;
    }

    return (
        <View style={[styles.container, style]}>
            <View style={styles.filtersContainer}>
                {filters.map((filter) => (
                    <FilterButton
                        key={filter.value}
                        label={filter.label}
                        count={filter.count}
                        isActive={activeFilter.label === filter.label}
                        onPress={() => onFilterChange(filter)}
                        style={styles.filterButton}
                        showCount={filter.label !== "All"}
                    />
                ))}

                {activeFilter && activeFilter.label !== "All" && (
                    <Pressable
                        onPress={() => {
                            const allOption = filters.find(f => f.label === "All");
                            onFilterChange(allOption);
                        }}
                        style={styles.activeFilterContainer}
                    >
                        <Icon source={"close"} size={24} color={theme.colors.divider} />
                    </Pressable>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    filtersContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginLeft: 6,
    },
    filterButton: {
        marginRight: 8,
        marginBottom: 1,
    },
    activeFilterContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 8,
    },
});

export default FilterBar;
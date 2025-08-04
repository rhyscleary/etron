import { View, StyleSheet} from 'react-native';
import { Button, useTheme, Chip } from 'react-native-paper';

const FilterButton = ({
    label,
    count,
    isActive,
    onPress,
    style,
    showCount = false,
}) => {
    const theme = useTheme();
    const disabled = count < 1 ? true : false;
    const backgroundColor = isActive ? theme.colors.primary : theme.colors.background;
    

    return (
        <View>
            <Chip 
                compact
                mode={isActive ? "flat" : "outlined"}
                disabled={disabled}
                selected={isActive}
                showSelectedCheck={false}
                showSelectedOverlay={false}
                style={[
                    styles.chip,
                    style,
                    {backgroundColor: backgroundColor, }
                ]}
                onPress={onPress}
            >
                {`${label} ${count > 0 && showCount ? ` (${count})` : ''}`}
            </Chip>
        </View>
    );
}

const styles = StyleSheet.create({
    chip: {
        borderRadius: 100,
    },
});

export default FilterButton;
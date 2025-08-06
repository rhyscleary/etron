import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Text, useTheme, IconButton, List } from 'react-native-paper';
import { router } from "expo-router";

const DropDown = ({
    title,
    items = [],
    showRouterButton=true,
    onSelect,
}) => {
    const [expanded, setExpanded] = useState(true);
    const [selectedItem, setSelectedItem] = useState(null);

    const handleItemSelect = (item) => {
        setSelectedItem(item);
        setExpanded(prev => !prev);
        if (onSelect) {
            onSelect(item);
        }
    }

    const theme = useTheme();

    return (
        <List.Section>
            <List.Accordion
                title={selectedItem || title}
                expanded={!expanded}
                onPress={() => setExpanded(prev => !prev)}
                style={[
                    styles.container,
                    { borderColor: theme.colors.outline }
                ]}
            >
                {items.map((item, index) => (    
                    <List.Item 
                        key={index}
                        title={item}
                        style={[
                            styles.items,
                            { borderColor: theme.colors.outline }
                        ]}
                        onPress={() => handleItemSelect(item)}
                    />
                ))}

                {showRouterButton && (
                    <TouchableOpacity
                        style={[
                            styles.routerButton,
                            { borderColor: theme.colors.outline }
                        ]}
                        onPress={() => {
                            router.push('/data-management/create-data-connection')
                        }}
                    >
                        <View
                            style={styles.routerButtonContent}
                        >
                            <IconButton
                                icon="plus"
                                size={20}
                                style={styles.routerIcon}
                                iconColor={theme.colors.icon}
                            />

                            <Text 
                                style={[
                                    styles.routerText,
                                    { color: theme.colors.placeholderText, } 
                                ]}
                            >
                                New Data Source
                            </Text>
                        </View>
                    </TouchableOpacity>
                )}
            </List.Accordion>
        </List.Section>
    );
};

export default DropDown;

const styles = StyleSheet.create({
    container: {
        borderWidth: 1,
        borderTopLeftRadius: 10,
        borderTopRightRadius: 10,
    },
    items: {
        borderWidth: 1,
    },
    routerButton: {
        height: 50,
        borderWidth: 1,
        borderBottomLeftRadius: 10,
        borderBottomRightRadius: 10,
        justifyContent: 'center',
        paddingHorizontal: 5,
    },
    routerButtonContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    routerIcon: {
        margin: 0,
        marginRight: 4,
    },
    routerText: {
        fontSize: 16,
    },
});

/*
const DropDown = ({
    label = 'Select',
    options = [], //Will pull individual sources from backend
    selectedValue,
    onValueChange,
    placeholder = 'Search',
}) => {
    const [menuVisible, setMenuVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const filteredOptions = options.filter(option =>
        option.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const theme = useTheme();

    return (
        <View style={styles.container}>
            <Menu
                visible={menuVisible}
                onDismiss={() => setMenuVisible(false)}
                anchor={
                    <TouchableOpacity onPress={() => setMenuVisible(true)}>
                        <TextInput
                            label={label}
                            value={selectedValue}
                            editable={false}
                            right={<TextInput.Icon icon="menu-down" onPress={() => setMenuVisible(true)} />}
                            style={styles.input}
                        />
                    </TouchableOpacity>
                }
                contentStyle={styles.menuContent}
            >
                <TextInput
                    placeholder={placeholder}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    style={styles.searchInput}
                    left={<TextInput.Icon icon="magnify"/>}
                    right={<TextInput.Icon icon="menu-up" onPress={() => setMenuVisible(false)} />}
                />

                <ScrollView style={styles.list}>
                    {filteredOptions.map((item, index) => (
                        <List.Item
                            key={`${item}-${index}`}
                            title={item}
                            onPress={() => {
                                onValueChange(item);
                                setMenuVisible(false);
                                setSearchQuery('');
                            }}
                            titleStyle={{ color: theme.colors.text }}
                            style={{
                                paddingVertical: 4,
                                paddingHorizontal: 10,
                            }}
                        />
                    ))}
                </ScrollView>

                <TouchableOpacity
                    style={styles.routerButton}
                    onPress={() => {
                        setMenuVisible(false);
                        setSearchQuery('');
                        router.push('/create-data-connection')
                    }}
                >
                    <Text style={{ color: theme.colors.placeholderText, textAlignVertical: 'center' }}>
                        New Data Source
                    </Text>
                </TouchableOpacity>
            </Menu>
        </View>
    );
};

export default DropDown;

const styles = StyleSheet.create({
    container: {
        margin: 0,
        zIndex: 999,
        width: 230,
    },
    input: {
        backgroundColor: 'white',
    },
    searchInput: {
        margin: 0,
        backgroundColor: '#f2f2f2',
    },
    menuContent: {
        paddingVertical: 0,
        width: 230,
    },
    list: {
        maxheight: 200,
    },
    routerButton: {
        borderWidth: 1,
        paddingHorizontal: 15,
        paddingVertical: 0,
        height: 50,
    },
})
*/
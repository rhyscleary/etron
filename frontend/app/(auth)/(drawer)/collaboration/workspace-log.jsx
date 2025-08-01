import { View, FlatList, Text as RNText, Pressable } from "react-native";
import Header from "../../../../components/layout/Header";
import { commonStyles } from "../../../../assets/styles/stylesheets/common";
import { Text, TextInput, TouchableRipple } from "react-native-paper";
import { useState } from "react";

const WorkspaceLog = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedFilter, setSelectedFilter] = useState('All');

    const handleSearchChange = (query) => {
        setSearchQuery(query);
    };

    const handleFilterPress = (filter) => {
        setSelectedFilter(filter);
    };

    const stubLogs = [
        { id: '1', user: 'Alice Johnson', action: 'Created task "Review PR #42"', type: 'Created', time: '10:05 AM' },
        { id: '2', user: 'Bob Smith', action: 'Deleted workspace file "notes.txt"', type: 'Deleted', time: '9:50 AM' },
        { id: '3', user: 'Charlie Rose', action: 'Renamed project folder to "Q3 Launch"', type: 'Updated', time: '9:30 AM' },
        { id: '4', user: 'Alice Johnson', action: 'Updated permissions for Bob', type: 'Updated', time: '9:10 AM' },
        { id: '5', user: 'Danielle Blake', action: 'Commented on task "UI Polish"', type: 'Commented', time: '8:55 AM' }
    ];

    const filters = ['All', 'Created', 'Deleted', 'Updated', 'Commented'];

    const filteredLogs = stubLogs.filter(log =>
        (selectedFilter === 'All' || log.type === selectedFilter) &&
        (log.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
         log.action.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <View style={commonStyles.screen}>
            <Header title="Workspace Log" showBack />

            {/* Search Bar */}
            <TextInput
                label="Search..."
                value={searchQuery}
                onChangeText={handleSearchChange}
                mode="outlined"
                style={{ marginVertical: 8 }}
            />

            {/* Fixed Filter Row */}
            <View
                style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    paddingVertical: 0,
                    marginBottom: 8
                }}
            >
                <RNText style={{ marginRight: 12, fontWeight: 'bold', color: '#e0e0e0' }}>
                    Filter:
                </RNText>

                {filters.map((filter) => (
                    <Pressable key={filter} onPress={() => handleFilterPress(filter)}>
                        <RNText
                            style={{
                                marginRight: 16,
                                fontWeight: selectedFilter === filter ? 'bold' : 'normal',
                                textDecorationLine: selectedFilter === filter ? 'underline' : 'none',
                                fontSize: 16,
                                color: selectedFilter === filter ? '#007AFF' : '#e0e0e0'
                            }}
                        >
                            {filter}
                        </RNText>
                    </Pressable>
                ))}
            </View>

            {/* Workspace Action Log */}
            <FlatList
                data={filteredLogs}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <TouchableRipple
                        style={{
                            borderWidth: 1,
                            borderColor: '#e0e0e0',
                            borderRadius: 4,
                            padding: 12,
                            marginVertical: 4
                        }}
                        onPress={() => console.log('Tapped log:', item)}
                        rippleColor="rgba(0, 0, 0, .1)"
                    >
                        <View>
                            <Text style={{ fontWeight: 'bold' }}>{item.user}</Text>
                            <Text>{item.action}</Text>
                            <Text style={{ color: '#666', fontSize: 12 }}>{item.time}</Text>
                        </View>
                    </TouchableRipple>
                )}
                ListEmptyComponent={
                    <RNText style={{ textAlign: 'center', marginTop: 16, color: '#999' }}>
                        No activity found
                    </RNText>
                }
            />
        </View>
    );
};

export default WorkspaceLog;

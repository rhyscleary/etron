// Author(s): Matthew Page

import { View, FlatList, Text as RNText } from "react-native";
import Header from "../../../../components/layout/Header";
import { commonStyles } from "../../../../assets/styles/stylesheets/common";
import { Text, TextInput, Chip } from "react-native-paper";
import { useState } from "react";
import ResponsiveScreen from "../../../../components/layout/ResponsiveScreen";

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
        <ResponsiveScreen
            header={<Header title="Workspace Log" showBack />}
            center={false}
            padded
            scroll={false}
        >

            {/* Search Bar */}
            <TextInput
                label="Search..."
                value={searchQuery}
                onChangeText={handleSearchChange}
                mode="outlined"
                style={{ marginVertical: 8 }}
            />

            {/* Filter Chips Row */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
                {filters.map((filter) => (
                    <Chip
                        key={filter}
                        mode="outlined"
                        selected={selectedFilter === filter}
                        onPress={() => handleFilterPress(filter)}
                        style={{ borderRadius: 16 }}
                    >
                        {filter}
                    </Chip>
                ))}
            </View>

            {/* Workspace Action Log */}
            <FlatList
                data={filteredLogs}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <View
                        style={{
                            borderWidth: 1,
                            borderColor: '#e0e0e0',
                            borderRadius: 4,
                            padding: 12,
                            marginVertical: 4
                        }}
                    >
                        <Text style={{ fontWeight: 'bold' }}>{item.user}</Text>
                        <Text>{item.action}</Text>
                        <Text style={{ color: '#666', fontSize: 12 }}>{item.time}</Text>
                    </View>
                )}
                ListEmptyComponent={
                    <RNText style={{ textAlign: 'center', marginTop: 16, color: '#999' }}>
                        No activity found
                    </RNText>
                }
            />
        </ResponsiveScreen>
    );
};

export default WorkspaceLog;

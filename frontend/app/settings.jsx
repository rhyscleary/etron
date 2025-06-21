import React from 'react';
import { View, Text, StyleSheet } from 'react-native'
import Header from '../components/layout/Header';
import DescriptiveButton from '../components/common/buttons/DescriptiveButton';
import { Button, useTheme } from 'react-native-paper';
import TextField from '../components/common/input/TextField';

const Settings = () => {
    const theme = useTheme();

    return (
        <View>
            <Header title="Settings" showMenu />

            <Text>Test Settings page</Text>
            <View style={styles.contentContainer}>
                <DescriptiveButton icon="account" label="test"  description="hello there" />
            </View>
            <TextField label="Name" />

            <Button mode="contained" style={{backgroundColor: theme.colors.primary}}>Hi</Button>
        </View>
    )
}

const styles = StyleSheet.create({
    contentContainer: {
        alignItems: 'center',
        
    }
});

export default Settings;
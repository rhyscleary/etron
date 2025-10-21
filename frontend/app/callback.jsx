import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';

import { commonStyles } from '../assets/styles/stylesheets/common';
import { Text } from 'react-native-paper';


const Callback = () => {

  return (
    <View style={commonStyles.screen}>
        <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" />
            <Text>Authorizing...</Text>
        </View>
        
    </View>
  );
}

const styles = StyleSheet.create({
    contentContainer: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center"
    }
})

export default Callback;
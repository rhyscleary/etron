// Author(s): Matthew Parkinson

import SearchBar from "../../../../../../components/common/input/SearchBar.jsx";
import Divider from "../../../../../../components/layout/Divider.jsx";
import { RefreshControl, Pressable, View, Button, StyleSheet, ScrollView, Alert } from "react-native";
import Header from "../../../../../../components/layout/Header";
import { commonStyles } from "../../../../../../assets/styles/stylesheets/common";
import { Link, router } from "expo-router";
import { Text, useTheme, ActivityIndicator, } from "react-native-paper";
/*
import {
  getAdapterInfo,
  getCategoryDisplayName,
} from "../../../../../../adapters/day-book/";
import useMetrics from "../../../../../../hooks/";
*/


const MetricManagement = ({
    metrics,
    loading,
    error,
    refresh,
}) => {
    
    const renderMetricCard = (metric) => {
        //const adapterInfo = getAdapterInfo(metric.type);
        //if (!adapterInfo) return null;

        return (
            <View key={metric.id} style={{ marginBottom: 12 }}>
                
            </View>
        );
    };
   /* 
    const groupMetricsByCategory = () => {
        const grouped = {};
        metrics.forEach((metric) => {
            const adapterInfo = getAdapterInfo(metric.type);
            if (adapterInfo) {
                const category = adapterInfo.category;
                if (!grouped[category]) {
                    grouped[category] = [];
                }
                grouped[category].push(metric);
            }
        });
        return grouped;
    };
    */
    if (loading) {
        return (
            <View style={commonStyles.screen}>
                <Header 
                    title="Metrics"
                    showMenu
                    showPlus
                    onRightIconPress={() =>
                        router.navigate(
                            "/modules/day-book/metrics/create-metric-v2"
                        )
                    }
                />
                {/*Temporary redirect to profile screen*/}
                <Button title="Temporary - Back to Dashboard" onPress={() => router.push("/profile")} />
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" />
                    <Text style={styles.loadingText}>Loading metrics...</Text>
                </View>
            </View>
        );
    }

    if (error) {
        return (
            <View style={commonStyles.screen}>
                <Header
                  title="Data Management"
                  showMenu
                  showPlus
                  onRightIconPress={() =>
                    router.navigate(
                      "/modules/day-book/metrics/create-metric-v2"
                    )
                  }
                />
                {/*Temporary redirect to profile screen*/}
                <Button title="Temporary - Back to Dashboard" onPress={() => router.push("/profile")} />
                <View style={styles.errorContainer}>
                    <Text variant="headlineSmall" style={styles.errorTitle}>
                        Unable to Load Metrics
                    </Text>
                    <Text variant="bodyMedium" style={styles.errorMessage}>
                        {error}
                    </Text>
                    <Pressable style={styles.retryButton} onPress={refresh}>
                    <Text style={styles.retryButtonText}>Try Again</Text>
                    </Pressable>
                </View>
            </View>
        )
    }

//    const groupedMetrics = groupMetricsByCategory();

    const theme = useTheme();

    return (
        <View style={commonStyles.screen}>
            <Header 
                title="Metrics"
                showMenu
                showPlus
                onRightIconPress={() => 
                    router.navigate(
                        "/modules/day-book/metrics/create-metric-v2"
                    )
                }
            />
            
            <SearchBar/>

            {/*Temporary redirect to profile screen*/}
            <Button title="Temporary - Back to Dashboard" onPress={() => router.navigate("/profile")} />

            <ScrollView
                style={styles.container}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={loading} onRefresh={refresh} />
                }
            >
                <Text>Test</Text>
            
            </ScrollView>

        </View>
    )
}

export default MetricManagement;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
    },
    categorySection: {
        marginBottom: 24,
    },
    categoryTitle: {
        marginBottom: 12,
    },
})
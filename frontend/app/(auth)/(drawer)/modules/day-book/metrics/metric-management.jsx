// Author(s): Matthew Parkinson, Noah Bradley

import SearchBar from "../../../../../../components/common/input/SearchBar.jsx";
import Divider from "../../../../../../components/layout/Divider.jsx";
import { Pressable, View, Button, ActivityIndicator, ScrollView, TouchableOpacity } from "react-native";
import Header from "../../../../../../components/layout/Header";
import { commonStyles } from "../../../../../../assets/styles/stylesheets/common";
import { Link, useRouter } from "expo-router";
import { Text, useTheme, Card } from "react-native-paper";
import { useEffect, useState } from "react";
import { getWorkspaceId } from "../../../../../../storage/workspaceStorage.jsx";
import { list } from 'aws-amplify/storage';

const MetricManagement = () => {
    const router = useRouter();
    const theme = useTheme();
    const [metricPaths, setMetricPaths] = useState([]);
    const [loadingMetricPaths, setLoadingMetricPaths] = useState(true);

    useEffect(() => {
        async function getWorkspaceMetrics() {
            const workspaceId = await getWorkspaceId();
            const filePathPrefix = `workspaces/${workspaceId}/day-book/metrics/`

            try {
                const result = await list ({
                    path: filePathPrefix,
                    options: {
                        bucket: 'workspaces',
                        //subpathStrategy: { strategy:'exclude' }
                    }
                })
                setMetricPaths(Array.from(new Set(  // Set prevents duplicates
                    result.items.map((item) => item.path
                        .slice(filePathPrefix.length)  // Cuts off file path
                        .split('/')[0]  // Cuts off everything inside the folder
                    )
                )));
                setLoadingMetricPaths(false);
            } catch (error) {
                console.log("Error getting workspace metrics:", error);
            }
        }
        getWorkspaceMetrics();
    }, []);
    

    return (
        <View style={commonStyles.screen}>
            <Header title="Metrics" showMenu showPlus onRightIconPress={() => router.navigate("/modules/day-book/metrics/create-metric")}/>
            
            <View>
                <SearchBar/>

                <View style={{ paddingHorizontal: 20, gap: 30 }}>
                    <View>
                        <Text style={{ fontSize: 16, color: theme.colors.placeholderText}}>
                            Created by you
                        </Text>
                    </View>

                    <Divider/>

                    <ScrollView>
                        <Text style={{ fontSize: 16, color: theme.colors.placeholderText}}>
                            Created by others
                        </Text>
                        <Text>
                            {loadingMetricPaths && (
                                <ActivityIndicator />
                            )}
                            {!loadingMetricPaths && (
                                metricPaths.map((path) => { return (
                                    <TouchableOpacity 
                                        key = {path}
                                        onPress={() => {router.navigate(`./view-metric/${path}`)}}
                                        
                                    >
                                        <Card>
                                            <Text>
                                                {path}
                                            </Text>
                                        </Card>
                                    </TouchableOpacity>
                                )})
                            )}
                        </Text>
                    </ScrollView>
                </View>
            </View>

            {/*Temporary redirect to profile screen*/}
            <Button title="Temporary - Back to Dashboard" onPress={() => router.navigate("/profile")} />
        </View>
    )
}

export default MetricManagement;
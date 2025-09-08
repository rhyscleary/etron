// Author(s): Noah Bradley

import { useEffect, useState } from "react";
import { useLocalSearchParams } from "expo-router";
import { View, Button } from "react-native";
import Header from "../../../../../../../components/layout/Header";
import { commonStyles } from "../../../../../../../assets/styles/stylesheets/common";
import { ActivityIndicator, Text } from "react-native-paper";
import { getWorkspaceId } from "../../../../../../../storage/workspaceStorage";
import { downloadData, uploadData, list } from "aws-amplify/storage";
import * as DocumentPicker from 'expo-document-picker'
import { apiGet } from "../../../../../../../utils/api/apiClient";
import endpoints from "../../../../../../../utils/api/endpoints";

const ViewDataSource = () => {
    const { dataSourceId } = useLocalSearchParams();
    //const dataSourceId = dataSourceName.replace(/ /g, "_")

    const [loadingDataSourceInfo, setLoadingDataSourceInfo] = useState(true);
    const [creator, setCreator] = useState();
    const [method, setMethod] = useState();
    const [name, setName] = useState();
    const [sourceType, setSourceType] = useState();
    const [timeCreated, setTimeCreated] = useState();

    useEffect(() => {
        async function getDataSourceInfo() {
            const workspaceId = await getWorkspaceId();

            try {
                console.log("workspaceId:", workspaceId);
                console.log("dataSourceId:", dataSourceId);

                let result = await apiGet(
                    endpoints.modules.day_book.data_sources.getDataSource,
                    { workspaceId, dataSourceId }
                )
                console.log("apiget result:", result);

                /*
                const { body } = await downloadData ({
                    path: `workspaces/${workspaceId}/day-book/dataSources/${dataSourceName}/data-source-details.json`,
                    options: {
                        bucket: 'workspaces'
                    }
                }).result;
                const dataSourceJson = JSON.parse(await body.text());
                setCreator(dataSourceJson.creator);
                setMethod(dataSourceJson.method);
                setName(dataSourceJson.name);
                setSourceType(dataSourceJson.sourceType);
                setTimeCreated(dataSourceJson.timeCreated);
                setLoadingDataSourceInfo(false);
                */
            } catch (error) {
                console.log("Error downloading data source info:", error);
            }
        }
        getDataSourceInfo();
    }, []);

    const [deviceFilePath, setDeviceFilePath] = useState(null);
    const userSelectDocument = async () => {
        try {
            setDataDetailsStatus("loading");
            const result = await DocumentPicker.getDocumentAsync({
                type: ['text/csv', 'application/vnd.ms-excel', 'application/csv', 'text/comma-separated-values'],
                copyToCacheDirectory: true  // This might be bad for large files
            });

            if (result.canceled) {
                console.log('File selection cancelled');
                setDataDetailsStatus("none");
                return;
            }
            
            const file = result.assets[0];  // [0] means it only keeps the first file, as result will be an array of files
            setDeviceFilePath(file.uri);

            setDataDetailsStatus("loaded");
        } catch (error) {
            setDataDetailsStatus("none");
            console.error('Error picking document:', error);
        }
    };

    const [isUploadingData, setIsUploadingData] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    const [dataDetailsStatus, setDataDetailsStatus] = useState("none");
    const uploadDocument = async (sourceFilePath, destinationFilePath) => {
        setIsUploadingData(true);
        setUploadProgress(0);

        try {
            console.log('Retrieving file...');
            const response = await fetch(sourceFilePath);
            const blob = await response.blob();

            console.log('Uploading file to S3 Bucket...');
            const result = await uploadData({
                path: destinationFilePath,
                data: blob,
                //accessLevel: 'public', // should become private or protected in future i think?
                options: {
                    bucket: "workspaces",
                    contentType: "text/csv",
                    onProgress: ({ transferredBytes, totalBytes }) => {
                        if (totalBytes) {
                            setUploadProgress(Math.round((transferredBytes / totalBytes) * 100));  // for some reason, transferredBytes goes to double totalBytes
                        }
                    }
                }
            }).result;
            console.log('File uploaded successfully:', result.path);
        } catch (error) {
            console.error('Error uploading file:', error);
        } finally {
            setIsUploadingData(false);
        }
    }

    async function updateIntegratedMetrics() {
        const workspaceId = await getWorkspaceId();
        let S3FilePath = `workspaces/${workspaceId}/day-book/dataSources/${dataSourceId}/integrated-metrics/`
        let metricIds = []
        try {
            const result = await list ({
                path: S3FilePath,
                options: {
                    bucket: "workspaces",
                }
            });
            metricIds = result.items
                .filter(item => item.path.length > S3FilePath.length)
                .map(item => item.path.split("/").at(-1));
            console.log("metric ids:", metricIds);
            // metricId = await body.text();
        } catch (error) {
            console.log("Error downloading list of integrated metrics:", error);
            return;
        }

        metricIds.map(async metricId => {
            try { 
                await CSVIntoMetricData(metricId);
            } catch (error) {
                console.log(`Error uploading pruned data for ${metricId} from csv file:`, error);
            }
        })
    }

    async function CSVIntoMetricData(metricId) {
        // Get the new data
        const workspaceId = await getWorkspaceId();
        let S3FilePath = `workspaces/${workspaceId}/day-book/dataSources/${dataSourceId}/data-source-data.csv`
        const { body } = await downloadData({
            path: S3FilePath,
            options: {
                bucket: "workspaces"
            }
        }).result;

        // Convert the new data from csv into json
        const csvText = await body.text();
        const csv = require('csvtojson');
        const csvRow = await csv({
            noheader: true,
            output: 'csv',
        }).fromString(csvText)
        const dataRows = csvRow?.slice(1);

        // Upload the json data to the metric
        const prunedData = {
            data: dataRows,
        }
        S3FilePath = `workspaces/${workspaceId}/day-book/metrics/${metricId}/metric-pruned-data.json`
        const result = uploadData({
            path: S3FilePath,
            data: JSON.stringify(prunedData),
            options: {
                bucket: 'workspaces'
            }
        }).result;
        console.log(`Pruned data uploaded to ${metricId} successfully.`)
    }

    const handleFinalise = async () => {
        const workspaceId = await getWorkspaceId();
        let S3FilePath = `workspaces/${workspaceId}/day-book/dataSources/${dataSourceId}/data-source-data.csv`;
        await uploadDocument(deviceFilePath, S3FilePath);
        await updateIntegratedMetrics();
    }

    return (
        <View style={commonStyles.screen}>
            <Header title={`${dataSourceId}`} showBack showEdit />
            {loadingDataSourceInfo ?
                <ActivityIndicator />
            : (<>
                <Text>Name: {name}</Text>
                <Text>Source type: {sourceType}</Text>
                <Text>Method: {method}</Text>

                <Button onPress={userSelectDocument} title="Pick a CSV File" disabled={isUploadingData} />{/* TODO: This is mostly a duplicate from local-csv.jsx, components to import into both would be better */}
                {dataDetailsStatus == "none" && (
                    <Text>No data selected</Text>
                )}
                {dataDetailsStatus == "loading" && (
                    <ActivityIndicator />
                )}
                {dataDetailsStatus == "loaded" && (
                    <View>
                        <Button onPress={handleFinalise} title="Upload data" disabled={isUploadingData || dataSourceName == ""} />
                        {isUploadingData && (
                            <Text>
                                Progress: {uploadProgress}%
                            </Text>
                        )}
                    </View>
                )}
            </>)}
        </View>
    )
}

export default ViewDataSource;
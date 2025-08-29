// Author(s): Noah Bradley

import { useEffect, useState } from "react";
import { useLocalSearchParams } from "expo-router";
import { View, Button } from "react-native";
import Header from "../../../../../../../components/layout/Header";
import { commonStyles } from "../../../../../../../assets/styles/stylesheets/common";
import { ActivityIndicator, Text } from "react-native-paper";
import { getWorkspaceId } from "../../../../../../../storage/workspaceStorage";
import { downloadData, uploadData } from "aws-amplify/storage";
import * as DocumentPicker from 'expo-document-picker'

const ViewDataSource = () => {
    const { dataSourceName } = useLocalSearchParams();

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
                const { body } = await downloadData ({
                    path: `workspaces/${workspaceId}/dataSources/${dataSourceName}/data_source_details.json`,
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
        console.log('File path:', sourceFilePath);

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
            console.log('File uploaded successfully:', result);
        } catch (error) {
            console.error('Error uploading file:', error);
        } finally {
            setIsUploadingData(false);
        }
    }

    const handleFinalise = async () => {
        const workspaceId = await getWorkspaceId();
        const S3FilePath = `workspaces/${workspaceId}/readyData/${dataSourceName.replace(/ /g, "_")}`;
        console.log('S3 File Path:', S3FilePath);
        uploadDocument(deviceFilePath, S3FilePath);
    }

    return (
        <View style={commonStyles.screen}>
            <Header title={`${dataSourceName}`} showBack showEdit />
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
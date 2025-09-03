// Author(s): Noah Bradley

import { ActivityIndicator, Text } from 'react-native-paper';
import { useState } from 'react';
import * as DocumentPicker from 'expo-document-picker';
import { Button, View } from 'react-native';
import { uploadData } from 'aws-amplify/storage';
import { getCurrentUser } from 'aws-amplify/auth';
import * as FileSystem from 'expo-file-system';
import { getWorkspaceId } from "../../../../../../../storage/workspaceStorage";
import TextField from '../../../../../../../components/common/input/TextField';
import { RadioButton } from 'react-native-paper';
import { apiPost } from "../../../../../../../utils/api/apiClient";
import endpoints from "../../../../../../../utils/api/endpoints"

const LocalCSV = () => {
    const [deviceFilePath, setDeviceFilePath] = useState(null);
    const [method, setMethod] = useState('overwrite');  // Method starts at overwrite by default
    const [dataDetailsStatus, setDataDetailsStatus] = useState("none");
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
            console.log('File uploaded successfully:', result.path);
        } catch (error) {
            console.error('Error uploading file:', error);
        } finally {
            setIsUploadingData(false);
        }
    }

    const createDataSource = async () => {
        console.log("2");
        let dataSourceDetails = {};

        console.log("2.1");
        const { userId } = await getCurrentUser();
        console.log("2.1.1");
        try {
            dataSourceDetails = {
            name: dataSourceName,
            //creator: userId,
            sourceType: "local-csv",
            method: method,
            //timeCreated: Date.now(),
            //expiry: TODO,
            config: null,
            secrets: null
        } } catch (error) {
            console.log(error);
        }
        console.log("2.2");

        const workspaceId = await getWorkspaceId();

        console.log("2.3");
        //endpoint stuff{
        try {
            console.log("2.3.1");
            let result = await apiPost(
                endpoints.modules.day_book.data_sources.addLocal,
                dataSourceDetails,
                { params: {
                    workspaceId
                }}
            )
            console.log("2.3.2");
            console.log("Result:", result);
        } catch (error) {
            console.log("Error posting via endpoint:", error);
        }
        console.log("2.4");
        //}endpoints stuff

        const S3FilePath = `workspaces/${workspaceId}/day-book/dataSources/${dataSourceName.replace(/ /g, "_")}/data-source-details.json`
        try {
            let result = uploadData({
                path: S3FilePath,
                data: JSON.stringify(dataSourceDetails),
                options: {
                    bucket: "workspaces"
                }
            }).result;
        } catch (error) {
            console.log("Error uploading data source info:", error);
        };
    }

    const handleFinalise = async () => {
        console.log("1");
        await createDataSource();
        console.log("3");

        const workspaceId = await getWorkspaceId();
        const dataSourceId = dataSourceName.replace(/ /g, "_")
        const S3FilePath = `workspaces/${workspaceId}/day-book/dataSources/${dataSourceId}/data-source-data.csv`;
        console.log('S3 File Path:', S3FilePath);
        uploadDocument(deviceFilePath, S3FilePath);
    }

    const [dataSourceName, setDataSourceName] = useState("");

    return (
        <>
            <Button onPress={userSelectDocument} title="Pick a CSV File" disabled={isUploadingData} />
            
            {dataDetailsStatus == "none" && (
                <Text>No data selected</Text>
            )}
            {dataDetailsStatus == "loading" && (
                <ActivityIndicator />
            )}
            {dataDetailsStatus == "loaded" && (
                <View>
                    <TextField 
                        label = "Source Name"
                        placeholder = "Source Name"
                        onChangeText = {setDataSourceName}
                    />
                    <RadioButton.Group onValueChange={newValue => setMethod(newValue)} value={method}>
                        <RadioButton.Item label="Overwrite" value="overwrite" />
                        <RadioButton.Item label="Extend" value="extend" />
                    </RadioButton.Group>
                    <Button onPress={handleFinalise} title="Create Source" disabled={isUploadingData || dataSourceName == ""} />
                    {isUploadingData && (
                        <Text>
                            Progress: {uploadProgress}%
                        </Text>
                    )}
                </View>
            )}
        </>
    );
}

export default LocalCSV;
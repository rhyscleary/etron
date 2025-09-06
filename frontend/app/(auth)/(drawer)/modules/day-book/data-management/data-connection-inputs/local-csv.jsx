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

    const uploadDocument = async (sourceFilePath, uploadUrl) => {
        console.log('File path:', sourceFilePath);

        setIsUploadingData(true);
        setUploadProgress(0);

        try {
            console.log('Retrieving file...');
            const response = await fetch(sourceFilePath);
            const blob = await response.blob();

            console.log('Uploading file to S3 Bucket...');
            const result = await fetch(uploadUrl, {
                method: "PUT",
                body: blob,
                headers: {
                    "Content-Type": "text/csv",
                },
            });
            console.log('File uploaded successfully');
        } catch (error) {
            console.error('Error uploading file:', error);
        } finally {
            setIsUploadingData(false);
        }
    }

    const createDataSource = async () => {
        let dataSourceDetails = {};

        //const { userId } = await getCurrentUser();
        
        dataSourceDetails = {
            name: dataSourceName,            
            sourceType: "local-csv",
            method: method
            //expiry: TODO,
        }

        const workspaceId = await getWorkspaceId();

        try {
            let result = await apiPost(
                endpoints.modules.day_book.data_sources.addLocal,
                dataSourceDetails,
                { workspaceId }
            )
            return result;
        } catch (error) {
            console.log("Error posting via endpoint:", error);
            return null;
        }
    }

    const handleFinalise = async () => {
        /*await createDataSource();

        const workspaceId = await getWorkspaceId();
        const dataSourceId = dataSourceName.replace(/ /g, "_")
        const S3FilePath = `workspaces/${workspaceId}/day-book/dataSources/${dataSourceId}/data-source-data.csv`;
        console.log('S3 File Path:', S3FilePath);
        uploadDocument(deviceFilePath, S3FilePath);*/

        const createResponse = await createDataSource();
        if (!createResponse) return;

        const { uploadUrl } = createResponse;
        if (!uploadUrl) {
            console.error("No upload URL was returned");
            return;
        }

        await uploadDocument(deviceFilePath, uploadUrl);
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
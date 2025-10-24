// Author(s): Noah Bradley

import { ActivityIndicator, Text } from 'react-native-paper';
import { useState } from 'react';
import * as DocumentPicker from 'expo-document-picker';
import { Button, View } from 'react-native';
import { getWorkspaceId } from "../../../../../../../storage/workspaceStorage";
import TextField from '../../../../../../../components/common/input/TextField';
import { RadioButton } from 'react-native-paper';
import { apiPost } from "../../../../../../../utils/api/apiClient";
import endpoints from "../../../../../../../utils/api/endpoints"
import { router } from 'expo-router';
import ResponsiveScreen from '../../../../../../../components/layout/ResponsiveScreen';
import Header from '../../../../../../../components/layout/Header';

const LocalCSV = () => {
    const [deviceFilePath, setDeviceFilePath] = useState(null);
    const [dataDetailsStatus, setDataDetailsStatus] = useState("unstarted");
    const [loading, setLoading] = useState(false);

    const userSelectFile = async () => {
        try {
            setDataDetailsStatus("loading");
            const result = await DocumentPicker.getDocumentAsync({
                type: ['text/csv', 'application/vnd.ms-excel', 'application/csv', 'text/comma-separated-values'],
                copyToCacheDirectory: true  // This might be bad for large files
            });

            if (result.canceled) {
                console.log('File selection cancelled');
                setDataDetailsStatus("unstarted");
                return;
            }
            
            const file = result.assets[0];  // [0] means it only keeps the first file, as result will be an array of files
            setDeviceFilePath(file.uri);

            setDataDetailsStatus("loaded");
        } catch (error) {
            setDataDetailsStatus("unstarted");
            console.error('Error picking file:', error);
        }
    };

    const [isUploadingData, setIsUploadingData] = useState(false);

    const uploadFile = async (sourceFilePath, uploadUrl) => {
        setIsUploadingData(true);
        try {
            console.log('Retrieving file...');
            const response = await fetch(sourceFilePath);
            const blob = await response.blob();

            console.log('Uploading file to S3 Bucket...');
            await fetch(uploadUrl, {
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
        setLoading(true);
        const workspaceId = await getWorkspaceId();
        
        let dataSourceDetails = {
            workspaceId: workspaceId,
            name: dataSourceName,            
            sourceType: "local-csv",
            method: method
            //expiry: TODO,
        }

        try {
            let result = await apiPost(  // Returns an object containing an upload URL
                endpoints.modules.day_book.data_sources.addLocal,
                dataSourceDetails
            );
            setLoading(false);
            return result.data;
        } catch (error) {
            console.error("Error posting via endpoint:", error);
            setLoading(false);
            return null;
        }
    }

    const handleFinalise = async () => {
        try {
            const createResponse = await createDataSource();
            if (!createResponse) {
                throw new Error("No response from API.")
            }

            const { uploadUrl } = createResponse;
            if (!uploadUrl) {
                throw new Error("No upload URL in API response.");
            }

            await uploadFile(deviceFilePath, uploadUrl);

            router.navigate("modules/day-book/data-management");
        } catch (error) {
            console.error("Error finalising CSV upload:", error);
        }
    }
    
    const [method, setMethod] = useState('overwrite');
    const [dataSourceName, setDataSourceName] = useState("");

    return (
        <>
            <ResponsiveScreen
                header = {<Header title="Upload CSV" showBack />}
                scroll = {true}
                center = {false}
                loadingOverlayActive={loading}
            >
                <Button onPress={userSelectFile} title="Pick a CSV File" disabled={isUploadingData} />
            
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
                    </View>
                )}
            </ResponsiveScreen>
            
        </>
    );
}

export default LocalCSV;
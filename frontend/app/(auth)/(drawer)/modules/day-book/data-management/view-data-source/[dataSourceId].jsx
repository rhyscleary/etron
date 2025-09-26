// Author(s): Noah Bradley

import { useEffect, useState } from "react";
import { useLocalSearchParams } from "expo-router";
import { View, Button } from "react-native";
import Header from "../../../../../../../components/layout/Header";
import { commonStyles } from "../../../../../../../assets/styles/stylesheets/common";
import { ActivityIndicator, Text } from "react-native-paper";
import { getWorkspaceId } from "../../../../../../../storage/workspaceStorage";
import * as DocumentPicker from 'expo-document-picker'
import { apiGet } from "../../../../../../../utils/api/apiClient";
import endpoints from "../../../../../../../utils/api/endpoints";

const ViewDataSource = () => {
    // Be flexible with the param name coming from the route/navigation
    const params = useLocalSearchParams();
    const pickFirst = (v) => Array.isArray(v) ? v[0] : v;
    const sourceId = pickFirst(params?.dataSourceId ?? params?.sourceId ?? params?.id);

    const [loadingDataSourceInfo, setLoadingDataSourceInfo] = useState(true);
    const [creator, setCreator] = useState();
    const [method, setMethod] = useState();
    const [name, setName] = useState();
    const [sourceType, setSourceType] = useState();
    const [timeCreated, setTimeCreated] = useState();
    const [lastUpdate, setLastUpdate] = useState();

    useEffect(() => {
        async function getDataSourceInfo() {
            if (!sourceId) {
                // No source id present; stop loading and show an inline error state
                setLoadingDataSourceInfo(false);
                return;
            }
            const workspaceId = await getWorkspaceId();

            let apiDataSourceInfo;
            try {
                apiDataSourceInfo = await apiGet(
                    endpoints.modules.day_book.data_sources.getDataSource(sourceId),
                    { workspaceId }
                );
                setMethod(apiDataSourceInfo.method);
                setName(apiDataSourceInfo.name);
                setSourceType(apiDataSourceInfo.sourceType);
                setTimeCreated(apiDataSourceInfo.createdAt);
                setLastUpdate(apiDataSourceInfo.lastUpdate);
                setLoadingDataSourceInfo(false);
            } catch (error) {
                console.error("Error downloading data source info:", error);
                return;
            }

            try {
                let apiUserInfo = await apiGet(
                    endpoints.workspace.users.getUser(workspaceId, apiDataSourceInfo.createdBy)
                );
                setCreator(apiUserInfo.given_name + " " + apiUserInfo.family_name);
            } catch (error) {
                console.error("Error getting user info:", error);
            }
        }
        getDataSourceInfo();
    }, [sourceId]);

    const [deviceFilePath, setDeviceFilePath] = useState(null);
    const userSelectDocument = async () => {
        try {
            setDataDetailsStatus("loading");
            const apiDataSourceInfo = await DocumentPicker.getDocumentAsync({
                type: ['text/csv', 'application/vnd.ms-excel', 'application/csv', 'text/comma-separated-values'],
                copyToCacheDirectory: true  // This might be bad for large files
            });

            if (apiDataSourceInfo.canceled) {
                console.log('File selection cancelled');
                setDataDetailsStatus("none");
                return;
            }
            
            const file = apiDataSourceInfo.assets[0];  // [0] means it only keeps the first file, as apiDataSourceInfo will be an array of files
            setDeviceFilePath(file.uri);

            setDataDetailsStatus("loaded");
        } catch (error) {
            setDataDetailsStatus("none");
            console.error('Error picking document:', error);
        }
    };

    const [isUploadingData, setIsUploadingData] = useState(false);
    const [dataDetailsStatus, setDataDetailsStatus] = useState("unstarted");
    const uploadFile = async (sourceFilePath, uploadUrl) => {
        setIsUploadingData(true);
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
            setDataDetailsStatus("unstarted");
        } catch (error) {
            console.error('Error uploading file:', error);
        } finally {
            setIsUploadingData(false);
        }
    }

    async function updateIntegratedMetrics() {  
    }

    const handleFinalise = async () => {
        if (!sourceId) return;
        const workspaceId = await getWorkspaceId();
        const uploadUrlApiResponse = await apiGet(
            endpoints.modules.day_book.data_sources.getUploadUrl(sourceId),
            { workspaceId }
        )
        const uploadUrl = uploadUrlApiResponse.fileUploadUrl;
        await uploadFile(deviceFilePath, uploadUrl);     

        //await updateIntegratedMetrics();
    }

    return (
        <View style={commonStyles.screen}>
            <Header title={name ? `${name}` : "Loading"} showBack showEdit />
            {loadingDataSourceInfo ?
                <ActivityIndicator />
            : (!sourceId ? (
                <Text>Unable to load data source: missing source id.</Text>
            ) : (<>
                <Text>Name: {name}</Text>
                <Text>Source type: {sourceType}</Text>
                <Text>Method: {method}</Text>
                <Text>Creator: {creator}</Text>
                <Text>Time created: {timeCreated}</Text>
                <Text>Last update: {lastUpdate}</Text>

                <Button onPress={userSelectDocument} title="Pick a CSV File" disabled={isUploadingData} />{/* TODO: This is mostly a duplicate from local-csv.jsx, components to import into both would be better */}
                {dataDetailsStatus == "none" && (
                    <Text>No data selected</Text>
                )}
                {dataDetailsStatus == "loading" && (
                    <ActivityIndicator />
                )}
                {dataDetailsStatus == "loaded" && (
                    <View>
                        <Button onPress={handleFinalise} title="Upload data" disabled={isUploadingData} />
                    </View>
                )}
            </>))}
        </View>
    )
}

export default ViewDataSource;
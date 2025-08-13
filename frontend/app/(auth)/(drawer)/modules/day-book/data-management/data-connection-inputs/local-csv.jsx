// Author(s): Noah Bradley

import { Text } from 'react-native-paper';
import { useState } from 'react';
import * as DocumentPicker from 'expo-document-picker';
import { Pressable } from 'react-native';
import { uploadData } from 'aws-amplify/storage';
import { getCurrentUser } from 'aws-amplify/auth';
import * as FileSystem from 'expo-file-system';

const LocalCSV = () => {
    const [fileUri, setFileUri] = useState(null);
    const [fileName, setName] = useState('');
    const [uploadProgress, setUploadProgress] = useState(0);

    const pickDocument = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: 'text/csv',
                copyToCacheDirectory: true  // this might be bad for large files
            });

            if (result.canceled) {
                console.log('File selection cancelled');
            } else {
                console.log('File selected:', result.assets[0]);
                const file = result.assets[0];
                console.log('Document chosen:', file.name);
                setName(file.name);
                console.log('Document location:', file.uri);
                setFileUri(file.uri);
            }
        } catch (error) {
            console.error('Error picking document:', error);
        }
    };

    const handleUploadDocument = async () => {
        console.log('Beginning upload process...');
        if (!fileUri) {
            console.error('No file selected to upload');
            return;
        } else console.log('File URI:', fileUri);

        const { userId } = await getCurrentUser();
        S3FilePath = `public/${userId}/${fileName}`;

        try {
            console.log('Retrieving file...');
            const base64Data = await FileSystem.readAsStringAsync(fileUri, {
                encoding: FileSystem.EncodingType.Base64,
            });
            const binary = atob(base64Data);

            console.log('Uploading file to S3 Bucket...');
            const result = await uploadData({
                path: S3FilePath,
                data: binary,
                options: {
                    bucket: 'etron-day-book-sourced-data-4jr4jk',
                    onProgress: ({ transferredBytes, totalBytes }) => {
                        if (totalBytes) {
                            setUploadProgress(Math.round((transferredBytes / totalBytes) * 100));
                        } // for some reason, transferredBytes goes to double totalBytes
                    }
                }
            }).result;
            console.log('File uploaded successfully:', result);
        } catch (error) {
            console.error('Error uploading file:', error);
            return;
        }
    }

    return (
        <>
            <Text>
                Testing
            </Text>
            <Pressable onPress={pickDocument}>
                <Text style={{ color: 'blue' }}>Pick a CSV file</Text>
            </Pressable>
            <Pressable onPress={handleUploadDocument}>
                <Text style={{ color: 'blue' }}>Upload File</Text>
            </Pressable>
            <Text>
                Progress: {uploadProgress}%
            </Text>
        </>
    );
}

export default LocalCSV;
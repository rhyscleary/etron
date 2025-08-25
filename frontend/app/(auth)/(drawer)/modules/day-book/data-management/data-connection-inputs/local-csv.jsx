// Author(s): Noah Bradley

import { Text } from 'react-native-paper';
import { useState } from 'react';
import * as DocumentPicker from 'expo-document-picker';
import { Button } from 'react-native';
import { uploadData } from 'aws-amplify/storage';
import { getCurrentUser } from 'aws-amplify/auth';

const LocalCSV = () => {
    const [fileUri, setFileUri] = useState(null);
    const [fileName, setName] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    const pickDocument = async () => {
        try {
            console.log("Picking file...");
            const result = await DocumentPicker.getDocumentAsync({
                type: ['text/csv', 'application/vnd.ms-excel', 'application/csv', 'text/comma-separated-values'],
                copyToCacheDirectory: true  // This might be bad for large files
            });

            if (result.canceled) {
                console.log('File selection cancelled');
                return;
            }
            
            console.log('File selected:', result.assets[0]);
            const file = result.assets[0];
            console.log('Document chosen:', file.name);
            setName(file.name.replace(/\s+/g, '_'));  // Cleans spaces into underscores
            console.log('Document location:', file.uri);
            setFileUri(file.uri);
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

        setIsUploading(true);
        setUploadProgress(0);  // Reset progress on new file selection

        try {
            console.log('Creating file path...');
            const { userId } = await getCurrentUser();
            const S3FilePath = `ready-data/${userId}/${fileName}`;
            console.log('S3 File Path:', S3FilePath);

            console.log('Retrieving file...');
            const response = await fetch(fileUri);
            const blob = await response.blob();

            console.log('Uploading file to S3 Bucket...');
            const result = await uploadData({
                path: S3FilePath,
                data: blob,
                //accessLevel: 'public', // should become private or protected in future i think?
                options: {
                    bucket: 'workspaceReadyData',
                    contentType: 'text/csv',
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
            setIsUploading(false);
        }
    }

    return (
        <>
            <Button onPress={pickDocument} title="Pick a CSV File" disabled={isUploading} />
            
            <Button onPress={handleUploadDocument} title="Upload File" disabled={isUploading || !fileUri} />
            
            {isUploading?
                <Text>
                    Progress: {uploadProgress}%
                </Text>:
                <Text>
                    No current upload
                </Text>
            }
        </>
    );
}

export default LocalCSV;
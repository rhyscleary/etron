// Author(s): Noah Bradley

import { Text } from 'react-native-paper';
import * as DocumentPicker from 'expo-document-picker';
import { Pressable } from 'react-native';

const LocalCSV = () => {
    const pickDocument = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: 'text/csv',
                copyToCacheDirectory: false, // make this false so that the file isn't saved locally
            });

            if (result.canceled) {
                console.log('File selection cancelled');
            } else {
                console.log('File selected:', result.assets[0]);
                const file = result.assets[0];
                console.log('Document chosen:', file.name);
                console.log('Document location:', file.uri);
            }
        } catch (error) {
            console.error('Error picking document:', error);
        }
    };

    return (
        <>
            <Text>
                Testing
            </Text>
            <Pressable onPress={pickDocument}>
                <Text style={{ color: 'blue' }}>Pick a CSV file</Text>
            </Pressable>
        </>
    );
}

export default LocalCSV;
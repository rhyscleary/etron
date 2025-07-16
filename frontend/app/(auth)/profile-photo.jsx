import { Pressable, View, Button } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Text, Alert } from "react-native-paper";
import { commonStyles } from "../../assets/styles/stylesheets/common";
import * as FileSystem from "expo-file-system";
import { Storage } from "aws-amplify";
import { uploadData } from 'aws-amplify/storage';
import { Buffer } from 'buffer';

global.Buffer = global.Buffer || Buffer

const changeProfilePhoto = () => {
    console.log("Storage is:", Storage);

    const handleUploadPhoto = async () => {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permissionResult.granted) {
            console.log("Photo picking failed: Photo access was denied.");
            Alert.alert("Permission to access photos is required.");
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: 'images',
            allowsEditing: true,  //means they can crop it
            quality: 0.7,
        });

        if (result.canceled) {
            console.log("Photo picking failed: User cancelled image picker.");
            return;
        }

        const asset = result.assets[0];
        const localUri = asset.uri;
        console.log("Photo picked successfully:", localUri);
        const fileName = `user-${Date.now()}.jpg`;  //todo: get adding user's ID to the file name working; had trouble with it
        console.log("File name:", fileName);
        const s3Key = `public/${fileName}`;
        console.log("s3Key:", s3Key);

        try {
            const fileBuffer = await FileSystem.readAsStringAsync(localUri, {
                encoding: FileSystem.EncodingType.Base64,
            });
            console.log("File buffer read successful.");

            /*const uploadResult = await Storage.put(s3Key, Buffer.from(fileBuffer, 'base64'), {
                contentType: "image/jpeg",
                level: "public",  //shouldn't stay public forever, just useful while testing
            });

            console.log("Photo upload successful:", uploadResult);

            const s3Url = await Storage.get(s3Key);
            console.log("Photo URL:", s3Url);*/
        /*} catch (error) {
            console.error("Photo upload failed:", error);
        }
        try {*/
            const result = await uploadData({
                path: 'public/album/2024/1.jpg', 
                // Alternatively, path: ({identityId}) => `protected/${identityId}/album/2024/1.jpg`
                data: Buffer.from(fileBuffer, 'base64')
            }).result;
            console.log('Succeeded: ', result);
        } catch (error) {
            console.log('Error : ', error);
        }
    }

    return (
        <View style={commonStyles.screen}>
            <Text> Test </Text>
            <Button title="Choose and upload photo" onPress={handleUploadPhoto} />
        </View>
    )
}

export default changeProfilePhoto;
import { Pressable, View, Button } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Text, Alert } from "react-native-paper";
import { commonStyles } from "../../assets/styles/stylesheets/common";
import * as FileSystem from "expo-file-system";
import { Image } from 'expo-image';
import { uploadData } from 'aws-amplify/storage';
import { Buffer } from 'buffer';
import { updateUserAttribute, getCurrentUser } from 'aws-amplify/auth';

global.Buffer = global.Buffer || Buffer

const changeProfilePhoto = () => {
    const handleUploadPhoto = async () => {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permissionResult.granted) {
            console.log("Photo picking failed: Photo access was denied.");
            Alert.alert("Permission to access photos is required.");
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: 'images',
            allowsEditing: true,
            //aspect: [1, 1]  //todo: check if this works, i read it but haven't tested it yet
            quality: 0.7,  //todo: find a lower number for this that fits the tiny profile photos so we don't waste storage
        });
        if (result.canceled) {
            console.log("Photo picking failed: User cancelled image picker.");
            return;
        }

        const asset = result.assets[0];
        const localUri = asset.uri;
        console.log("Photo picked successfully:", localUri);

        const { userId } = await getCurrentUser();
        const fileName = `${userId}/${Date.now()}.jpg`;  //todo: get adding user's ID to the file name working; had trouble with it
        const s3FilePath = `public/${fileName}`;
        console.log("s3 File Path:", s3FilePath);

        try {
            const fileBuffer = await FileSystem.readAsStringAsync(localUri, {
                encoding: FileSystem.EncodingType.Base64,
            });

            const result = await uploadData({
                path: s3FilePath,
                data: Buffer.from(fileBuffer, 'base64')
            }).result;
            console.log("Successfully uploaded photo:", result);
        } catch (error) {
            console.log("Error uploading photo:", error);
        }

        try {
            const output = await updateUserAttribute({
                userAttribute: {
                    attributeKey: 'picture',
                    value: s3FilePath
                }
            });

            const { nextStep } = output;
            if (nextStep.updateAttributeStep == "DONE") {
                console.log("Profile picture URL updated successfully.");                
            } else {
                console.log("Profile picture URL update not finished:", nextStep);
            }
        } catch (error) {
            console.log("Error uploading profile picture URL to user:", error);
        }

        //todo: add the s3FilePath to the user's picture attribute in Cognito
        //todo: also add way to display the photo in the app
    }

    return (
        <View style={commonStyles.screen}>
            <Text> Test </Text>
            <Button title="Choose and upload photo" onPress={handleUploadPhoto} />
            <Image
                source={{ uri: 'https://picsum.photos/100' }}
                style={{ width: 100, height: 100, borderRadius: 50 }}
                placeholder = {"Profile photo goes here"}
            />
        </View>
    )
}

export default changeProfilePhoto;
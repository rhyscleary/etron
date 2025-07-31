import { Pressable, View, Button } from "react-native";
import { useState, useEffect } from "react";
import * as ImagePicker from "expo-image-picker";
import { Text, Alert } from "react-native-paper";
import { commonStyles } from "../../assets/styles/stylesheets/common";
import * as FileSystem from "expo-file-system";
import { Image } from 'expo-image';
import { uploadData, getUrl } from 'aws-amplify/storage';
import { Buffer } from 'buffer';
import { updateUserAttribute, fetchUserAttributes, getCurrentUser } from 'aws-amplify/auth';
import AsyncStorage from '@react-native-async-storage/async-storage'

global.Buffer = global.Buffer || Buffer

const changeProfilePhoto = () => {
    const [profilePhotoUri, setProfilePhotoUri] = useState(null);

    // Load the profile photo URL upon component mount
    useEffect(() => {
        const fetchProfilePhoto = async () => {
            try {
                // Load the photo from local storage if possible
                console.log("Fetching from local storage...");
                const cachedUri = await AsyncStorage.getItem('profilePhotoUri');
                if (cachedUri) {
                    setProfilePhotoUri(cachedUri);
                    console.log("Profile photo loaded from cache.");
                    return;
                }

                // If not in local storage, then get from S3
                console.log("Fetching from S3...")
                const userAttributes = await fetchUserAttributes();
                const S3Url = userAttributes.picture;
                if (!S3Url) {
                    console.log("Profile photo URL not found.");
                    return;
                }
                const S3UrlResult = await getUrl({path: S3Url});
                await AsyncStorage.setItem('profilePhotoUri', s3UrlResult.url.toString())
                setProfilePhotoUri(S3UrlResult.url.toString());
                console.log("New profile photo URL fetched and cached.");
            } catch (error) {
                console.log("Profile photo URL fetch unsuccessful:", error);
            }
        }
        fetchProfilePhoto();
    }, [])

    // Function for uploading photo to S3
    const handleUploadPhoto = async () => {
        // Get photo library access permission
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permissionResult.granted) {
            console.log("Photo picking failed: Photo access was denied.");
            Alert.alert("Permission to access photos is required.");
            return;
        }

        // Open photo library and get user to pick photo
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: 'images',
            allowsEditing: true,
            //aspect: [1, 1],  //todo: check if this works, i read it but haven't tested it yet
            quality: 0.7,  //todo: find a lower number for this that fits the tiny profile photos so we don't waste storage
        });
        if (result.canceled) {
            console.log("Photo picking failed: User cancelled image picker.");
            return;
        }

        // Get the selected photo URI from the device 
        const asset = result.assets[0];
        const localUri = asset.uri;
        console.log("Local URI of photo obtained.");
        
        // Get the destination S3 path
        const { userId } = await getCurrentUser();
        const fileName = `${userId}/${Date.now()}.jpg`;
        const S3FilePath = `public/${fileName}`;
        console.log("S3 file path created.")

        // Upload the photo to S3
        console.log("Uploading photo to S3 bucket...")
        try {
            const fileBuffer = await FileSystem.readAsStringAsync(localUri, {
                encoding: FileSystem.EncodingType.Base64,
            });

            const result = await uploadData({
                path: S3FilePath,
                data: Buffer.from(fileBuffer, 'base64')
            }).result;
            console.log("Photo uploaded successfully.");
            setProfilePhotoUri(localUri);
            await AsyncStorage.setItem("profilePhotoUri", localUri);
            console.log("Locally saved photo replaced.");
        } catch (error) {
            console.log("Error uploading photo:", error);
            return;
        }

        // Update the S3 path in the user's details
        try {
            const output = await updateUserAttribute({
                userAttribute: {
                    attributeKey: 'picture',
                    value: S3FilePath
                }
            });

            const { nextStep } = output;
            if (nextStep.updateAttributeStep == "DONE") {
                console.log("User details profile picture URL updated.");                
            } else {
                console.log("User details profile picture URL update not finished:", nextStep);
            }
        } catch (error) {
            console.log("Profile picture URL upload to user details unsuccessful:", error);
            return;
        }
    }

    return (
        <View style={commonStyles.screen}>
            <Text> Test </Text> 
            <Button title="Choose and upload photo" onPress={handleUploadPhoto} />
            <Image
                source={{ uri:profilePhotoUri }}
                style={{ width: 100, height: 100, borderRadius: 50 }}
                placeholder = {"Profile photo goes here"}
            />
        </View>
    )
}

export default changeProfilePhoto;
import { fetchUserAttributes, getCurrentUser, updateUserAttribute } from "aws-amplify/auth";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import { uploadData, getUrl } from 'aws-amplify/storage';
import { Buffer } from 'buffer';
import AsyncStorage from "@react-native-async-storage/async-storage";
//import awsconfig from '../src/aws-exports';

global.Buffer = global.Buffer || Buffer

export async function loadProfilePhoto() {
    try {
        // Load the photo from local storage if possible
        const cachedUri = await AsyncStorage.getItem('profilePhotoUri');
        if (cachedUri) {
            console.log("Profile photo loaded from cache.");
            console.log(cachedUri);
            return cachedUri;
        }

        // If not in local storage, then get from S3
        console.log("Fetching from S3...")
        const userAttributes = await fetchUserAttributes();
        const S3Path = userAttributes.picture;
        if (!S3Path) {
            console.log("Profile photo URL not found.");
            return null;
        }
        const S3UrlResult = await getUrl({path: S3Path});
        await AsyncStorage.setItem('profilePhotoUri', S3UrlResult.url.toString());
        console.log("New profile photo URL fetched and cached.");
        return S3UrlResult.url.toString();
    } catch (error) {
        console.log("Profile photo URL fetch unsuccessful:", error);
        return null;
    }
}

export async function uploadProfilePhotoFromDevice() {
    // Get photo library access permission
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
        throw new Error("Photo picking failed: Photo access was denied.");
    }

    // Open photo library and get user to pick photo
    const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        aspect: [1, 1],  // Forces user to crop image to a square
        quality: 0.1, 
    });
    if (result.canceled) {
        throw new Error("Photo picking failed: User cancelled image picker.");
    }

    // Get the selected photo URI from the device 
    const asset = result.assets[0];
    console.log("Local URI of photo obtained.");
    return asset.uri;
}

export async function uploadProfilePhotoToS3(profilePhotoUri) {
    
    // Get the destination S3 path
    const { userId } = await getCurrentUser();
    const fileName = `${userId}.jpg`;
    const S3FilePath = `profile-pictures/${fileName}`;
    console.log("S3 file path created.");

    // Upload the photo to S3
    console.log("Uploading photo to S3 bucket...");

    const fileBuffer = await FileSystem.readAsStringAsync(profilePhotoUri, {
        encoding: FileSystem.EncodingType.Base64,
    });

    try {
        await uploadData({
            path: S3FilePath,
            data: Buffer.from(fileBuffer, 'base64'),
            options: {
                bucket: "profilePictures"
            }
        }).result;
        console.log("Photo uploaded successfully.");
    } catch (error) {
        throw new Error(`Error uploading photo: ${error.message}`);
    }

    try {
        await uploadData({
            path: `${userId}/accountpicture.jpg`,
            data: Buffer.from(fileBuffer, 'base64'),
            options: {
                bucket: "users"
            }
        }).result;
        console.log("Photo uploaded successfully TO NEW BUCKET.");
    } catch (error) {
        throw new Error(`Error uploading photo TO NEW BUCKET: ${error.message}`);
    }

    await AsyncStorage.removeItem("profilePhotoUri");
    return S3FilePath;
}

export async function removeProfilePhotoFromLocalStorage() {
    try {
        await AsyncStorage.removeItem("profilePhotoUri");
        return null;
    } catch (error) {
        console.log("Error removing profile photo:", error);
        return null;
    }
}


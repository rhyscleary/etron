# Electronic Tracking Revenue and Operations Network

eTRON is an all-in-one affordable mobile solution for small to medium enterprises to aggregate and track business operations.
It delivers a collaborative platform to use on the go. The modular design gives businesses many options to customise it to their needs.

## The following is how to install and setup everything needed to run the application:

# Setting up Development Environment
## Frontend
### Install Apps
1. Install VSCode
2. Install GitHub Desktop
    1. Link it to vscode
3. Get emulator via android studio
    1. Download android studio
    2. Open android studio    
    3. Click more actions
    4. Click virtual device manager
    5. Click create device
    6. Select device (We recommend the Pixel 6 Pro)
    7. Click Next
    8. Select system image "Baklava"
    9. Click Next then Finish in the following page
    10. Run emulator
    11. Open settings from the emulator
    12. Click snapshots
    13. Click settings (in top)
    14. Turn "save state to quickboot" to "No"
    15. Close emulator
    16. Go to emulator settings and Cold Boot (this opens it as blank)
    17. You can close the emulator now.
4. Get emulator's environmental variables set up
    1. In android studio, go to "more actions" -> "sdk manager"
    2. Copy the SDK location. should be something like "C:\Users\<QWERTY>\AppData\Local\Android\Sdk"
    3. In windows search, search for "edit environmental variables for your account"
    4. Click "New"
    5. Variable Name: ANDROID_HOME
    6. Variable value: paste the SDK location in here
    7. Press "OK" to save it
    8. Can close all that now

### Set up Environment
1. Download code
    1. Get copy of code into computer
2. Install dependencies
    1. Open etron/frontend in terminal
    2. Run 'npm install'
    * If that doesn't work, follow this guide to install nodejs https://www.codewithharry.com/blogpost/solving-npm-not-recognized-error-windows
    3. Run 'npx expo install expo-dev-client'
    4. Run 'npm install -g eas-cli && eas login'
    5. Login with username 'InSyncDev' and password 'Face#321#book'
    6. Run 'eas build --platform android --profile development' (let it build, will need some time depending on system)
    7. Say "yes" to installing on an emulator
    8. Select your emulator from earlier.
3. Run code
    1. While emulator is running, run 'npx expo start' in that terminal
    2. It should open up a QR code (if you wish to run the app on a physical device with the expo app installed)
    3. Make sure its "using development build", press s to swap to dev build if not
    4. Press 'a' to open with Android
    5. Let it build

## Backend
### Setup the Environment
#### Install AWS SAM CLI
Follow the tutorial to configure SAM for your environment:
https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html

Optional -
Invoke the Lambda functions locally for testing (You will not be able to have them interact with the emulator for a full integration test): 
https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/using-sam-cli-local-invoke.html


# API Documentation
We use Postman during devleopment to document our API endpoints.
The Postman collection is available at https://documenter.getpostman.com/view/34328174/2sB3Wjy3XW

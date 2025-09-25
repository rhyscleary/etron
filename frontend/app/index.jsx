// Author(s): Noah Bradley

import { Redirect } from "expo-router";
import { ActivityIndicator } from 'react-native-paper';
import { useEffect, useState } from "react";

import { Amplify } from 'aws-amplify';
import { useAuthenticator } from '@aws-amplify/ui-react-native';

// TOOD: make sure all app-wide initialisations are in here

import amplifyOutputs from '../amplify_outputs.json'
Amplify.configure(amplifyOutputs);
//console.log('Amplify configured with:', Amplify.getConfig());


function App() {
    const { authStatus } = useAuthenticator();
    const [target, setTarget] = useState(null);

    useEffect(() => {
        console.log("(index.jsx). Auth status:", authStatus);
        if (authStatus === 'authenticated') {
            //if (router.canDismiss()) router.dismissAll();
            console.log("Redirecting to auth root page.");
            setTarget("/(auth)/profile")
            //router.replace('/(auth)/profile');
        } else if (authStatus === `configuring`) {

        } else {
            //router.replace('landing');
            setTarget("landing")
        }
    }, [authStatus]);

    if (target) {
        return <Redirect href={target} />;
    }

    return <ActivityIndicator size="large" color="#0000ff" />;
}

export default App;
import { Redirect, useRouter } from "expo-router";
import React from "react";

import { Text, Button } from 'react-native';

import { Amplify } from 'aws-amplify';
import { withAuthenticator } from '@aws-amplify/ui-react-native';
import '@aws-amplify/ui-react/styles.css';
import awsmobile from '../src/aws-exports';
Amplify.configure(awsmobile);

/*function App({ signOut, user }) {
    return ( 
        <>
            <Text>Hello {user.signInDetails.loginId}</Text>
            <Button onClick={signOut}>Sign out</Button>
        </>
    );
}*/

function App({ signOut, user }) {
    return ( 
        <>
            <Text>Hello</Text>
            <Button title="Sign Out" onPress={signOut}>Sign out</Button>
        </>
    );
}

export default withAuthenticator(App);

/*function App() {
    return (
        <Text>Testing</Text>
    )
}

export default App;

/*function firstScreen() {
    const auth = useAuth();

    return (
        <div>
            <p>First page</p>
            <button onClick={() => auth.signinRedirect()}>Sign in</button>
        </div>
    );
}

export default firstScreen;*/
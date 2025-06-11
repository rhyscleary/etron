import { Redirect, useRouter } from "expo-router";
import React from "react";
import { useAuth } from "react-oidc-context";

import { Amplify } from 'aws-amplify';

import { withAuthenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import awsmobile from '../src/aws-exports';
Amplify.configure(awsmobile);

function App({ signOut, user }) {
    return (
        <>
            <h1>Hello {user.signInDetails.loginId}</h1>
            <button onClick={signOut}>Sign out</button>
        </>
    );
}

export default withAuthenticator(App);

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
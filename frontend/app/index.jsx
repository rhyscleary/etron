import { Redirect, useRouter } from "expo-router";
import React from "react";
import { useAuth } from "react-oidc-context";

function firstScreen() {
    const auth = useAuth();

    /*if (auth.isLoading) {
        return <div>Loading...</div>;
    }

    if (auth.error) {
        return <div>Encountering error... {auth.error.message}</div>;
    }

    if (auth.isAuthenticated) {
        return (
            <div>
                <pre> Hello: {auth.user?.profile.email} </pre>
                <pre> ID Token: {auth.user?.id_token} </pre>
                <pre> Access Token: {auth.user?.access_token} </pre>
                <pre> Refresh Token: {auth.user?.refresh_token} </pre>

            <button onClick={() => fullSignOut()}>Sign out fully</button>
            </div>
        );
    }*/

    return (
        <div>
            <p>First page</p>
            <button onClick={() => auth.signinRedirect()}>Sign in</button>
        </div>
    );
}

export default firstScreen;

/*export default function Index() {
    return <Redirect href="/landing" />;
}*/

/*const Index = () => {
    return (
        <React.StrictMode>
            <AuthProvider {...cognitoAuthConfig}>
                <App />
            </AuthProvider>
        </React.StrictMode>
    );
};

export default Index;*/

/*import React from 'react';
import {Text} from 'react-native';


const Landing = () => {
    return (
        <Text>Hello, I am RJ!</Text>
    );
};

export default Landing;*/
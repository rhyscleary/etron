import { Redirect, useRouter } from "expo-router";
import React from "react";
import { useAuth } from "react-oidc-context";

function firstScreen() {
    const auth = useAuth();

    return (
        <div>
            <p>First page</p>
            <button onClick={() => auth.signinRedirect()}>Sign in</button>
        </div>
    );
}

export default firstScreen;
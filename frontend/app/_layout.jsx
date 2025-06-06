import { Slot, Stack } from 'expo-router';
import { AuthProvider } from "react-oidc-context";

const cognitoAuthConfig = {
    authority: "https://cognito-idp.ap-southeast-2.amazonaws.com/ap-southeast-2_m2sU1vTUd",
    client_id: "30uq8adstk0l8blharsir4f6ed",
    redirect_uri: "http://localhost:8081/logged-in",
    response_type: "code",
    scope: "email openid phone aws.cognito.signin.user.admin",
};

/*export default function RootLayout() {
    //return <Slot />;
}*/

export default function Index() {
    return (
        <AuthProvider {...cognitoAuthConfig}>
            <Stack />
        </AuthProvider>
    );
}
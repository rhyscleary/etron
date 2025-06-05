import { useAuth } from "react-oidc-context";

function Logged_In() {
    const auth = useAuth();

    const fullSignOut = async () => {
        await auth.removeUser();

        const clientId = "30uq8adstk0l8blharsir4f6ed";
        const logoutUri = "http://localhost:8081/logged-out";
        const cognitoDomain = "http://ap-southeast-2m2su1vtud.auth.ap-southeast-2.amazoncognito.com";
        window.location.href = `${cognitoDomain}/logout?client_id=${clientId}&logout_uri=${encodeURIComponent(logoutUri)}`;
    };

    if (auth.isLoading) {
        return <div>Loading...</div>;
    }

    return (
        <div>
            <p>Logged in!</p>
            <div>
                <pre> Hello: {auth.user?.profile.email} </pre>
                <pre> ID Token: {auth.user?.id_token} </pre>
                <pre> Access Token: {auth.user?.access_token} </pre>
                <pre> Refresh Token: {auth.user?.refresh_token} </pre>
            </div>
            <button onClick={() => fullSignOut()}>Sign out fully</button>
        </div>
    );
};

export default Logged_In;
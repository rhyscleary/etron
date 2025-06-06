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

    if (auth.error) {
        console.error("Auth Error:", auth.error);
        return <div>Error: {auth.error.message}</div>;
    }

    async function handleSubmit(event) {
        event.preventDefault();
        const form = event.target;
        const formData = new FormData(form);
        const newFirstName = formData.get("newFirstName");

        const response = await fetch("https://uz2x5wqtf6.execute-api.ap-southeast-2.amazonaws.com/update-name", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
                body: JSON.stringify({
                access_token: auth.user?.access_token,
                given_name: newFirstName,
            }),
        });

        const data = await response.json();
        alert(data.message || data.error);
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
            <hr />
            <div>
                <form method="post" onSubmit={handleSubmit}>
                    <label>
                        Text input: <input name="newFirstName"/>
                    </label>
                    <br />
                    <button type="submit">Submit</button>
                </form>
            </div>
            <hr />
            <button onClick={() => fullSignOut()}>Sign out fully</button>
        </div>
    );
};

export default Logged_In;
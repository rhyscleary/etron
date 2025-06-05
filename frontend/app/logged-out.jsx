import { useAuth } from "react-oidc-context";

const Logged_Out = () => {
    const auth = useAuth();

    return (
        <div>
            <p>Logged out!</p>
            <button onClick={() => auth.signinRedirect()}>Sign in</button>
        </div>
    );
};

export default Logged_Out;
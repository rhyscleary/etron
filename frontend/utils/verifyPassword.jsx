import { getCurrentUser, signIn } from "aws-amplify/auth";

export async function verifyPassword(password) {
    try {
        const user = await getCurrentUser();
        const response = await signIn(user.username, password);

        console.log("Entered password is correct", response)
        return true;
    } catch (error) {
        console.error("Incorrect password:", error);
        return false;
    }
}
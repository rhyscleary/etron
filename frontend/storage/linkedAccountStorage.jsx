// temporary file for storing the linked accounts until backend
// this file adds and removes linked accounts from local storage

import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCurrentUser, signOut } from 'aws-amplify/auth';
import { router } from 'expo-router';

const accountKey = "linkedAccounts";

export async function loadLinkedAccounts() {
    try {
        const user = await getCurrentUser();
        const currentEmail = user?.signInDetails?.loginId || user?.username || "";

        const stored = await AsyncStorage.getItem(accountKey);
        let linkedAccounts = stored ? JSON.parse(stored) : [];
        
        // remove current account if it exists in the list
        linkedAccounts = linkedAccounts.filter(acc => acc.email !== currentEmail);
        
        // add current account at the top
        linkedAccounts.unshift({ 
            email: currentEmail, 
            provider: 'Cognito', 
            linkedAt: null 
        });

        await AsyncStorage.setItem(accountKey, JSON.stringify(linkedAccounts));

        return { currentEmail, linkedAccounts };
    } catch (error) {
        console.error("Error loading linked accounts:", error);
        return { currentEmail: "", linkedAccounts: [] };
    }
}

export async function addLinkedAccountIfNeeded(currentEmail, provider) {
    try {
        const stored = await AsyncStorage.getItem(accountKey);
        let linkedAccounts = stored ? JSON.parse(stored) : [];

        const exists = linkedAccounts.find(acc => acc.email === currentEmail && acc.provider === provider);
        if (!exists) {
            linkedAccounts.push({ email: currentEmail, provider, linkedAt: new Date().toISOString() });
            await AsyncStorage.setItem(accountKey, JSON.stringify(linkedAccounts));
            console.log("Linked account saved locally:", linkedAccounts);
        } else {
            console.log("Account already linked:", currentEmail);
        }
    } catch (error) {
            console.error("Error adding linked account:", error);
    }
}

export async function removeLinkedAccount(emailToRemove, currentEmail) {
    try {
        if (emailToRemove === currentEmail) {
            await signOut();
            router.dismissAll();
            router.replace('/login-signup');
        }

        const stored = await AsyncStorage.getItem(accountKey);
        let linkedAccounts = stored ? JSON.parse(stored) : [];
        const updated = linkedAccounts.filter(acc => acc.email !== emailToRemove);

        await AsyncStorage.setItem(accountKey, JSON.stringify(updated));
        return updated;
    } catch (error) {
        console.error("Error removing linked account:", error);
        return [];
    }
}
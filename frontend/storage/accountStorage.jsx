// Author(s): Holly Wyatt

import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCurrentUser, signOut, fetchUserAttributes } from 'aws-amplify/auth';

const ACCOUNT_KEY = "linkedAccounts";

export class AccountStorage {
    static async loadLinkedAccounts(loginProvider = 'Cognito') {
        try {
            const user = await getCurrentUser();
            const userEmail = user?.signInDetails?.loginId || user?.username || "";
            const userAttributes = await fetchUserAttributes();

            const stored = await AsyncStorage.getItem(ACCOUNT_KEY);
            let accounts = stored ? JSON.parse(stored) : [];
            
            // Remove current account if it exists in the list
            accounts = accounts.filter(acc => acc.email !== userEmail);
            
            // Add current account at the top with user attributes
            const currentAccount = { 
                email: userEmail, 
                provider: loginProvider, 
                givenName: userAttributes.given_name || '',
                familyName: userAttributes.family_name || '',
                linkedAt: null 
            };
            accounts.unshift(currentAccount);

            await AsyncStorage.setItem(ACCOUNT_KEY, JSON.stringify(accounts));

            console.log("Linked accounts loaded:", accounts);
            console.log("User attributes loaded:", userAttributes);
            
            return { 
                currentEmail: userEmail, 
                currentProvider: loginProvider, 
                linkedAccounts: accounts,
                attributes: userAttributes 
            };
        } catch (error) {
            console.error("Error loading linked accounts:", error);
            throw error;
        }
    }

    static async addLinkedAccount(email, provider, userAttributes = {}) {
        try {
            const stored = await AsyncStorage.getItem(ACCOUNT_KEY);
            let accounts = stored ? JSON.parse(stored) : [];

            const exists = accounts.find(acc => acc.email === email && acc.provider === provider);
            if (!exists) {
                const newAccount = { 
                    email, 
                    provider, 
                    givenName: userAttributes.given_name || '',
                    familyName: userAttributes.family_name || '',
                    linkedAt: new Date().toISOString() 
                };
                accounts.push(newAccount);
                await AsyncStorage.setItem(ACCOUNT_KEY, JSON.stringify(accounts));
                console.log("Linked account saved locally:", accounts);
                return accounts;
            } else {
                console.log("Account already linked:", email);
                return accounts;
            }
        } catch (error) {
            console.error("Error adding linked account:", error);
            throw error;
        }
    }

    static async removeLinkedAccount(emailToRemove) {
        try {
            const stored = await AsyncStorage.getItem(ACCOUNT_KEY);
            let accounts = stored ? JSON.parse(stored) : [];
            const updated = accounts.filter(acc => acc.email !== emailToRemove);

            await AsyncStorage.setItem(ACCOUNT_KEY, JSON.stringify(updated));
            console.log("Account removed from storage:", emailToRemove);
            return updated;
        } catch (error) {
            console.error("Error removing linked account:", error);
            throw error;
        }
    }

    static async getStoredAccounts() {
        try {
            const stored = await AsyncStorage.getItem(ACCOUNT_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error("Error getting stored accounts:", error);
            return [];
        }
    }
 
    static async clearAllAccounts() {
        try {
            await AsyncStorage.removeItem(ACCOUNT_KEY);
            console.log("All linked accounts cleared from storage");
        } catch (error) {
            console.error("Error clearing accounts:", error);
            throw error;
        }
    }

    static async accountExists(email, provider = null) {
        try {
            const accounts = await this.getStoredAccounts();
            if (provider) {
                return accounts.some(acc => acc.email === email && acc.provider === provider);
            }
            return accounts.some(acc => acc.email === email);
        } catch (error) {
            console.error("Error checking account existence:", error);
            return false;
        }
    }

    static async updateAccount(email, updates) {
        try {
            const stored = await AsyncStorage.getItem(ACCOUNT_KEY);
            let accounts = stored ? JSON.parse(stored) : [];
            
            const accountIndex = accounts.findIndex(acc => acc.email === email);
            if (accountIndex !== -1) {
                accounts[accountIndex] = { ...accounts[accountIndex], ...updates };
                await AsyncStorage.setItem(ACCOUNT_KEY, JSON.stringify(accounts));
                console.log("Account updated in storage:", email);
            }
            
            return accounts;
        } catch (error) {
            console.error("Error updating account:", error);
            throw error;
        }
    }

    static async getCurrentUserInfo() {
        try {
            const user = await getCurrentUser();
            const userEmail = user?.signInDetails?.loginId || user?.username || "";
            const userAttributes = await fetchUserAttributes();
            
            return {
                email: userEmail,
                attributes: userAttributes
            };
        } catch (error) {
            console.error("Error getting current user info:", error);
            throw error;
        }
    }

    static async signOutUser() {
        try {
            await signOut();
            console.log("User signed out successfully");
        } catch (error) {
            console.error("Error signing out user:", error);
            throw error;
        }
    }
}
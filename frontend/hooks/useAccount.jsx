// Author(s): Holly Wyatt

import { useState, useEffect, useCallback } from 'react';
import { router } from 'expo-router';
import { AccountStorage } from '../storage/accountStorage';

export function useAccount() {
    const [currentEmail, setCurrentEmail] = useState("");
    const [currentProvider, setCurrentProvider] = useState("");
    const [linkedAccounts, setLinkedAccounts] = useState([]);
    const [attributes, setAttributes] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [dialogVisible, setDialogVisible] = useState(false);
    const [accountToRemove, setAccountToRemove] = useState(null);

    const loadLinkedAccounts = useCallback(async (loginProvider = 'Cognito') => {
        try {
            setLoading(true);
            setError(null);
            
            const result = await AccountStorage.loadLinkedAccounts(loginProvider);
            
            setCurrentEmail(result.currentEmail);
            setCurrentProvider(result.currentProvider);
            setLinkedAccounts(result.linkedAccounts);
            setAttributes(result.attributes);
            
            return result;
        } catch (err) {
            //console.error("Error loading linked accounts:", err);
            setError(err);
            setCurrentEmail("");
            setCurrentProvider("");
            setLinkedAccounts([]);
            setAttributes(null);
            return { 
                currentEmail: "", 
                currentProvider: "", 
                linkedAccounts: [],
                attributes: null 
            };
        } finally {
            setLoading(false);
        }
    }, []);

    const addLinkedAccount = useCallback(async (email, provider, userAttributes = {}) => {
        try {
            setError(null);
            const updatedAccounts = await AccountStorage.addLinkedAccount(email, provider, userAttributes);
            setLinkedAccounts(updatedAccounts);
            console.log(`Account ${email} linked successfully with provider ${provider}`);
        } catch (err) {
            //console.error("Error adding linked account:", err);
            setError(err);
        }
    }, []);

    const linkCurrentUser = useCallback(async () => {
        try {
            const userInfo = await AccountStorage.getCurrentUserInfo();
            if (userInfo.email && userInfo.email !== currentEmail) {
                await addLinkedAccount(userInfo.email, currentProvider || 'Cognito', userInfo.attributes);
                // Refresh accounts to get updated list
                await loadLinkedAccounts(currentProvider || 'Cognito');
            }
        } catch (error) {
            //console.error('Error linking current user:', error);
            setError(error);
        }
    }, [currentEmail, currentProvider, addLinkedAccount, loadLinkedAccounts]);

    const removeLinkedAccount = useCallback(async (emailToRemove) => {
        try {
            setError(null);
            
            if (emailToRemove === currentEmail) {
                await AccountStorage.signOutUser();
                setCurrentEmail("");
                router.replace('/login-signup');
                return [];
            }

            const updatedAccounts = await AccountStorage.removeLinkedAccount(emailToRemove);
            setLinkedAccounts(updatedAccounts);
            return updatedAccounts;
        } catch (err) {
            //console.error("Error removing linked account:", err);
            setError(err);
            return [];
        }
    }, [currentEmail]);

    const handleSwitchAccount = useCallback(async (targetEmail) => {
        try {
            setError(null);
            await AccountStorage.signOutUser();
            router.push({
                pathname: '/login-signup',
                params: { email: targetEmail, fromAccounts: 'true' },
            });
        } catch (err) {
            //console.error("Error switching account:", err);
            setError(err);
        }
    }, []);

    const handleRemoveAccount = useCallback((targetEmail) => {
        setAccountToRemove(targetEmail);
        setDialogVisible(true);
    }, []);

    const confirmRemoveAccount = useCallback(async () => {
        if (!accountToRemove) return;

        try {
            const updatedAccounts = await removeLinkedAccount(accountToRemove);
            
            if (accountToRemove !== currentEmail) {
                setLinkedAccounts(updatedAccounts);
            }
        } catch (error) {
            //console.error('Error removing account:', error);
            setError(error);
        } finally {
            setDialogVisible(false);
            setAccountToRemove(null);
        }
    }, [accountToRemove, currentEmail, removeLinkedAccount]);

    const cancelRemoveAccount = useCallback(() => {
        setDialogVisible(false);
        setAccountToRemove(null);
    }, []);

    const getDialogMessage = useCallback(() => {
        if (!accountToRemove) return '';
        
        const isCurrentAccount = accountToRemove === currentEmail;
        const baseMessage = `Are you sure you want to remove the account: ${accountToRemove}?`;
        
        if (isCurrentAccount) {
           return `${baseMessage}\n\nYou are currently signed into this account. Removing this account will log you out.`;
        }
        
        return baseMessage;
    }, [accountToRemove, currentEmail]);

    const getDisplayName = useCallback((account = null) => {
        // If account is provided, use its attributes, otherwise use current user attributes
        const targetAccount = account || { givenName: attributes?.given_name, familyName: attributes?.family_name };
        
        const firstName = targetAccount.givenName || '';
        const lastName = targetAccount.familyName || '';
        const fullName = `${firstName} ${lastName}`.trim();
        
        console.log("Display name for account:", targetAccount.email || 'current', fullName);
        return fullName || 'Unknown User';
    }, [attributes]);

    const navigateToLinkAccount = useCallback(() => {
        router.push({
            pathname: '/login-signup',
            params: { link: 'true' }
        });
    }, []);

    const handleAuthSuccess = useCallback(async (provider = 'Cognito') => {
        try {
            // This should be called after successful authentication
            await loadLinkedAccounts(provider);
            console.log('Authentication success handled, accounts refreshed');
        } catch (error) {
            //console.error('Error handling auth success:', error);
            setError(error);
        }
    }, [loadLinkedAccounts]);

    const refreshAccounts = useCallback((provider = 'Cognito') => {
        loadLinkedAccounts(provider);
    }, [loadLinkedAccounts]);

    // Load accounts on mount
    useEffect(() => {
        loadLinkedAccounts();
    }, [loadLinkedAccounts]);

    return {
        // State
        currentEmail,
        currentProvider,
        linkedAccounts,
        attributes,
        loading,
        error,
        dialogVisible,
        accountToRemove,
        
        // Actions
        addLinkedAccount,
        removeLinkedAccount,
        handleSwitchAccount,
        handleRemoveAccount,
        confirmRemoveAccount,
        cancelRemoveAccount,
        refreshAccounts,
        navigateToLinkAccount,
        linkCurrentUser,
        handleAuthSuccess,
        
        // Computed values
        getDialogMessage,
        getDisplayName
    };
}
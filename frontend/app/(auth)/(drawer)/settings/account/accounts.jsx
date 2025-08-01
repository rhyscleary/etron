import { View, ScrollView, ActivityIndicator, StyleSheet } from 'react-native'
import { commonStyles } from '../../../../../assets/styles/stylesheets/common';
import Header from '../../../../../components/layout/Header';
import StackLayout from '../../../../../components/layout/StackLayout';
import DescriptiveButton from '../../../../../components/common/buttons/DescriptiveButton';
import { useRouter } from 'expo-router';
import { useEffect, useState } from "react";
import BasicDialog from '../../../../../components/overlays/BasicDialog';
import { useTheme } from "react-native-paper";
import AccountCard from '../../../../../components/cards/accountCard';
import BasicButton from '../../../../../components/common/buttons/BasicButton';
import { loadLinkedAccounts, removeLinkedAccount } from '../../../../../storage/linkedAccountStorage';

import {
    signOut,
} from 'aws-amplify/auth';

const Accounts = () => {
    const theme = useTheme();
    const [email, setEmail] = useState("");
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [dialogVisible, setDialogVisible] = useState(false);
    const [accountToRemove, setAccountToRemove] = useState(null);
    const router = useRouter();

    useEffect(() => {
        async function loadAccountsData() {
            setLoading(true);
            try {
                // TODO: update when linked accounts are added in backend
                const { currentEmail, linkedAccounts } = await loadLinkedAccounts();
                setEmail(currentEmail);
                setAccounts(linkedAccounts);
            } catch (error) {
                console.error("Error loading accounts: ", error);
                setEmail("Error");
                setAccounts([]);
            } finally {
                setLoading(false);
            }
        }

        loadAccountsData();
    }, []);

    const handleSwitchAccount = async (targetEmail) => {
        try {
            await signOut();
            router.push({
                pathname: '/login-signup',
                params: { email: targetEmail, fromAccounts: 'true' },
            });
        } catch (err) {
            console.error("Error switching account:", err);
        }
    };

    const handleRemoveAccount = (targetEmail) => {
        setAccountToRemove(targetEmail);
        setDialogVisible(true);
    };

    const confirmRemoveAccount = async () => {
        if (!accountToRemove) return;

        try {
            // local storage function to remove account
            const updatedAccounts = await removeLinkedAccount(accountToRemove, email);
            
            if (accountToRemove === email) {
                // if removing current account then sign out and reset email
                setEmail("");
                router.replace('/login-signup');
            } else {
                // update state with remaining accounts
                setAccounts(updatedAccounts);
            }
        } catch (error) {
            console.error('Error removing account:', error);
            // error handling can be improved here
        } finally {
            setDialogVisible(false);
            setAccountToRemove(null);
        }
    };

    const cancelRemoveAccount = () => {
        setDialogVisible(false);
        setAccountToRemove(null);
    };

    // dialog message based on account being removed
    const getDialogMessage = () => {
        if (!accountToRemove) return '';
        
        const isCurrentAccount = accountToRemove === email;
        const baseMessage = `Are you sure you want to remove the account: ${accountToRemove}?`;
        
        if (isCurrentAccount) {
           return `${baseMessage}\n\nYou are currently signed into this account. Removing this account will log you out.`;
        }
        
        return baseMessage;
    };

    return (
        <View style={commonStyles.screen}>
            <Header
                title="Accounts"
                showBack
            />

            <ScrollView contentContainerStyle={commonStyles.scrollableContentContainer}>
                <View style={{ padding: 16 }}>
                    {loading ? (
                      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                        <ActivityIndicator size="large" />
                      </View>
                    ) : (
                      <>
                        {accounts.map((account, index) => (
                          <AccountCard
                            key={index}
                            account={account}
                            isActive={account.email === email}
                            onSwitch={handleSwitchAccount}
                            onRemove={handleRemoveAccount}
                            totalAccounts={accounts.length}
                          />
                        ))}
                        
                        <BasicButton
                            label="Link Another Account"
                            onPress={() => {
                                router.push({
                                    pathname: '/login-signup',
                                    params: { link: 'true' }
                                });
                            }}
                            fullWidth
                            style={{ marginTop: 20 }}
                        />
                      </>
                    )}
                </View>
            </ScrollView>
            <BasicDialog
                visible={dialogVisible}
                message={getDialogMessage()}
                leftActionLabel="Cancel"
                handleLeftAction={cancelRemoveAccount}
                rightActionLabel="Remove"
                rightDanger
                handleRightAction={confirmRemoveAccount}
            />
        </View>
    );
};

export default Accounts;
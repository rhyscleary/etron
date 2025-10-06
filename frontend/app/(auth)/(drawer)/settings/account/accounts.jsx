// Author(s): Holly Wyatt

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
import { useAuthenticator } from '@aws-amplify/ui-react-native';

import {
    signOut,
    fetchUserAttributes
} from 'aws-amplify/auth';
import { removeWorkspaceInfo } from '../../../../../storage/workspaceStorage';

const Accounts = () => {
    const theme = useTheme();
    const [email, setEmail] = useState("");
    const [accounts, setAccounts] = useState([]);
    const [attributes, setAttributes] = useState(null); 
    const [loading, setLoading] = useState(false);
    const [dialogVisible, setDialogVisible] = useState(false);
    const [accountToRemove, setAccountToRemove] = useState(null);
    const router = useRouter();
    const { signOut: amplifySignOut } = useAuthenticator();

    useEffect(() => {
        async function loadAccountsData() {
            setLoading(true);
            try {
                // TODO: update when linked accounts are added in backend
                const { currentEmail, linkedAccounts } = await loadLinkedAccounts();
                const userAttributes = await fetchUserAttributes(); 
                setEmail(currentEmail);
                setAccounts(linkedAccounts);
				console.log("linked accounts:", linkedAccounts);
                setAttributes(userAttributes);
                console.log("User attributes:", userAttributes); 
            } catch (error) {
                console.error("Error loading accounts: ", error);
                setEmail("Error");
                setAccounts([]);
                setAttributes(null);
            } finally {
                setLoading(false);
            }
        }

        loadAccountsData();
    }, []);

    const handleSwitchAccount = async (targetEmail) => {
		console.log("handleSwitchAccount");
        try {
            await signOut();
            router.dismissAll(); //TODO: MAKE SURE THIS REDIRECT WORKS; IT MIGHT CAUSE BUGS AS IS
            router.push({
                pathname: '/login-signup',
                params: { email: targetEmail, fromAccounts: 'true' },
            });
        } catch (error) {
            console.error("Error switching account:", error);
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
                router.dismissAll();
                router.replace('/login-signup'); //TODO: SHOULD REDIRECT YOU TO A BASE PAGE ASKING YOU TO JOIN OR CREATE A WORKSPACE
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

    // Helper function to get display name - FIXED
    const getDisplayName = () => {
        if (!attributes) return 'Unknown User';
        const firstName = attributes.given_name || '';
        const lastName = attributes.family_name || '';
        const fullName = `${firstName} ${lastName}`.trim();
        console.log("Display name:", fullName); // Debug log
        return fullName || 'Unknown User';
    };

    // sign out. Separate function in case more logic required later
    const handleSignOut = () => {
        //removeWorkspaceInfo(); // temp fix to remove workspace info
        // sign out from app
        amplifySignOut();
    } 

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
							{accounts.map((linkedAccount, index) => (
								<AccountCard
									key={index}
									account={{
										name: getDisplayName(),
										email: linkedAccount.email
									}}
									isActive={linkedAccount.email === email}
									onPress={() => handleSwitchAccount(linkedAccount.email)}  // Anonymous function used to prevent handleSwitchAccount from running during load
									onRemove={handleRemoveAccount}
									totalAccounts={accounts.length}
									loading={loading}
									active={linkedAccount.email == attributes.email}
								/>
							))}
							
							<StackLayout spacing={172}>
								<BasicButton
									label="Link Another Account"
									onPress={() => {
										router.dismissAll();
										router.replace({
											pathname: '/login-signup',
											params: { link: 'true' }
										});
									}}
									fullWidth
									style={{ marginTop: 20 }}
								/>

								<BasicButton label="Sign Out" fullWidth onPress={handleSignOut} />
							</StackLayout>
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
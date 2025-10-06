// Author(s): Holly Wyatt

import { View, ScrollView, ActivityIndicator, Text } from 'react-native'
import BasicButton from '../../../../../components/common/buttons/BasicButton';
import { useAccount } from '../../../../../hooks/useAccount';
import { commonStyles } from '../../../../../assets/styles/stylesheets/common';
import Header from '../../../../../components/layout/Header';
import BasicDialog from '../../../../../components/overlays/BasicDialog';
import AccountCard from '../../../../../components/cards/accountCard';
import ResponsiveScreen from '../../../../../components/layout/ResponsiveScreen';
import { AccountStorage } from '../../../../../storage/accountStorage';
import { router } from 'expo-router';

const Accounts = () => {
    const {
        // State
        currentEmail,
        linkedAccounts,
        loading,
        error,
        dialogVisible,
        
        // Actions
        handleSwitchAccount,
        handleRemoveAccount,
        confirmRemoveAccount,
        cancelRemoveAccount,
        navigateToLinkAccount,
        
        // Computed values
        getDialogMessage,
        getDisplayName
    } = useAccount();

    const handleSignOut = async () => {
        try {
            await AccountStorage.signOutUser();
            router.replace('/login-signup');
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    if (error) {
        console.error('Account management error:', error);
    }

    return (
        <ResponsiveScreen
			header = {
				<Header
					title="Accounts"
					showBack
				/>
			}
			footer = {
				<BasicButton label="Sign Out" fullWidth onPress={handleSignOut} />
			}
		>
            <ScrollView contentContainerStyle={commonStyles.scrollableContentContainer}>
                <View style={{ padding: 16 }}>
                    {loading ? (
                      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", minHeight: 200 }}>
                        <ActivityIndicator size="large" />
                      </View>
                    ) : (
                      <>
                        {linkedAccounts.map((linkedAccount, index) => (
                          <AccountCard
                            key={`${linkedAccount.email}-${index}`}
                            account={{
                              name: getDisplayName(linkedAccount),
                              email: linkedAccount.email
                            }}
                            isActive={linkedAccount.email === currentEmail}
                            onSwitch={() => handleSwitchAccount(linkedAccount.email)}
                            onRemove={() => handleRemoveAccount(linkedAccount.email)}
                            totalAccounts={linkedAccounts.length}
                            loading={false}
                          />
                        ))}
                        
                        <BasicButton
                            label="Link Another Account"
                            onPress={navigateToLinkAccount}
                            fullWidth
                            style={{ marginTop: 20 }}
                        />
                        
                        {error && (
                            <Text style={{ 
                                color: 'red', 
                                textAlign: 'center', 
                                marginTop: 10,
                                fontSize: 14
                            }}>
                                {error.message || 'An error occurred'}
                            </Text>
                        )}
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
        </ResponsiveScreen>
    );
};

export default Accounts;
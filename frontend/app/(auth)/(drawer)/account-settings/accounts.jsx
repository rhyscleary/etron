// Author(s): Holly Wyatt

import { View, ScrollView, ActivityIndicator, Text } from 'react-native'
import BasicButton from '../../../../components/common/buttons/BasicButton';
import { useAccount } from '../../../../hooks/useAccount';
import { commonStyles } from '../../../../assets/styles/stylesheets/common';
import Header from '../../../../components/layout/Header';
import BasicDialog from '../../../../components/overlays/BasicDialog';
import AccountCard from '../../../../components/cards/accountCard';
import ResponsiveScreen from '../../../../components/layout/ResponsiveScreen';
import StackLayout from '../../../../components/layout/StackLayout';

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

    if (error) {
        console.error('Account management error:', error);
    }

    return (
        <ResponsiveScreen
			header={<Header
                title="Accounts"
                showBack
				
            />}
			center={false}
			scroll={false}
		>
			<View style={{ padding: 16 }}>
				{loading ? (
					<View style={{ flex: 1, justifyContent: "center", alignItems: "center", minHeight: 200 }}>
						<ActivityIndicator size="large" />
					</View>
				) : (
					<StackLayout spacing={16}>
						{linkedAccounts.map((linkedAccount, index) => (
							<AccountCard
								key={`${linkedAccount.email}-${index}`}
								account={{
									name: getDisplayName(linkedAccount),
									email: linkedAccount.email
								}}
								active={linkedAccount.email === currentEmail}
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
					</StackLayout>
				)}
			</View>
            
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
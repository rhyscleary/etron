import React from "react";
import { View } from "react-native";
import { Text, Button, Card } from "react-native-paper";
import { useTheme } from "react-native-paper";
import BasicButton from "../common/buttons/BasicButton";

const AccountCard = ({ account, isActive, onSwitch, onRemove, totalAccounts }) => {
    const theme = useTheme();

    return (
        <Card
            style={{
                marginBottom: 16,
                backgroundColor: theme.colors.buttonBackground
            }}
        >
            <Card.Content>
                <Text variant="titleMedium">{account.email}</Text>
                {isActive ? (
                    <Text style={{ color: theme.colors.textGreen, marginTop: 4, fontStyle: 'italic' }}>
                        Currently Signed In
                    </Text>
                ) : null}

                <View style={{ flexDirection: "row", justifyContent: "flex-end", marginTop: 16, gap: 12 }}>
                    {!isActive && (
                        <BasicButton
                            label={"Switch"}
                            onPress={() => onSwitch(account.email)}
                        />
                    )}

                    <BasicButton
                        label={totalAccounts === 1 ? "Sign Out" : "Remove"}
                        danger={true}
                        onPress={() => onRemove(account.email)}
                    />
                </View>
            </Card.Content>
        </Card>
    );
};

export default AccountCard;

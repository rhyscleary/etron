import { Pressable, StyleSheet, View } from "react-native";
import { Avatar, Card, Chip, Text, useTheme, IconButton } from "react-native-paper"
import StackLayout from "../layout/StackLayout";
import { commonStyles } from "../../assets/styles/stylesheets/common";
import BasicButton from "../common/buttons/BasicButton";
import { themes } from "../../assets/styles/themes/themes";

const AccountCard = ({
    account,
    loading = false,
    active = false,
    onSwitch,
    onRemove
}) => {
    const theme = useTheme();

    return (
        <Card mode="elevated" style={[
            styles.card, {
                backgroundColor: themes.dark.colors.buttonBackground
            }
        ]}>
            <Card.Content>
                <StackLayout spacing={12}>
                    <View style={styles.topRow}>
						<Text style={[commonStyles.listItemText]}>
							{account.email}
						</Text>
						{active && (
							<Chip compact mode="flat" style={styles.activeChip} textStyle={styles.activeChipText}>
								Active
							</Chip>
						)}
                    </View>
                    <View style={styles.actionsRow}>
                        <IconButton
                            icon="delete"
                            onPress={onRemove}
                            accessibilityLabel="Remove account"
                            size={20}
                            style={styles.iconBtn}
                        />
                        <BasicButton
                            label={"Switch to"}
                            onPress={onSwitch}
                            disabled={active || loading}
                            compact
                            style={styles.switchBtn}
                        />
                    </View>
                </StackLayout>
            </Card.Content> 
        </Card>
    );
}

const styles = StyleSheet.create({
  card: {
    alignSelf: "stretch",
    borderRadius: 12,
    // Parent can pass marginBottom via containerStyle
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  activeChip: {
    alignSelf: "flex-start",
    opacity: 0.9,
  },
  activeChipText: {
    fontSize: 12,
    fontWeight: "600",
  },
  iconBtn: {
    margin: 0,
  },
  actionsRow: {
    flexDirection: "row",
	justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  switchBtn: {
    alignSelf: "flex-end",
    minHeight: 36,
    paddingVertical: 0,
  },
});

export default AccountCard;
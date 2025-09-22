// Author(s): Rhys Cleary

import { useRouter } from "expo-router"
import { Pressable, StyleSheet, TouchableOpacity, View } from "react-native";
import { Avatar, Card, Icon, IconButton, Text, useTheme } from "react-native-paper"
import { commonStyles } from "../../assets/styles/stylesheets/common";

const ListCard = ({
    leftIcon,
    title,
    subtitle,
    content,
    onPress,
    rightIcon = [],
    contentRightIcons = [],
}) => {
    const theme = useTheme();

    const CardBody = (
        <Card
            mode="elevated"
            style={[styles.card, { backgroundColor: theme.colors.buttonBackground }]}
        >
            <Card.Title
                title={title}
                titleStyle={[
                    commonStyles.listItemText,
                    { color: theme.colors.text },
                ]}
                subtitle={subtitle}
                subtitleStyle={[
                    commonStyles.captionText,
                    { color: theme.colors.text }
                ]}
                left={
                    leftIcon 
                        ? (props) =>
                            typeof leftIcon === "string" ? (
                                <Card.Icon {...props} icon={leftIcon} />
                            ) : (
                                leftIcon
                            )
                        : undefined
                }
                right={
                    rightIcon 
                        ? (props) =>
                            typeof rightIcon === "string" ? (
                                <IconButton
                                    {...props}
                                    icon={rightIcon}
                                    onPress={onRightPress}
                                    size={26}
                                    color={theme.colors.primary}
                                    style={styles.actionButton}
                                    accessibilityLabel={rightAccessibilityLabel}
                                />
                            ) : (
                                rightIcon
                            )
                        : undefined
                }
            />

            {content && (
                <Card.Content style={styles.content}>
                    <Text style={[commonStyles.captionText, { color: theme.colors.text }]}>
                        {content}
                    </Text>
                </Card.Content>
            )}

        </Card>
    );


    return onPress ? (
        <TouchableOpacity onPress={onPress}>
            {CardBody}
        </TouchableOpacity>
    ) : (
        CardBody
    );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 8,
    marginVertical: 6,
  },
  content: {
    marginTop: -6,
    marginBottom: 8,
  },
  actionButton: {
    marginHorizontal: 2,
  },
});

export default ListCard;
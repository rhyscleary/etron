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
    cardStyle,
    titleStyle,
    subtitleStyle,
    contentStyle,
    onRightPress,
    rightAccessibilityLabel,
    contentNumberOfLines = 4,
}) => {
    const theme = useTheme();

    const defaultCardStyle = { backgroundColor: theme.colors.buttonBackground };
    const defaultTitleStyle = { color: theme.colors.text, fontSize: 16 };
    const defaultSubtitleStyle = { color: theme.colors.text, fontSize: 15, marginTop: 6 };
    const defaultContentStyle = { color: theme.colors.text, fontSize: 14, lineHeight: 20, marginTop: 8 };

    const CardBody = (
        <Card
            mode="elevated"
            style={[styles.card, defaultCardStyle, cardStyle]}
        >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>

                {/* Left Icon */}
                {leftIcon && (
                    typeof leftIcon === 'string' ? (
                        <Card.Icon icon={leftIcon} />
                    ) : (
                        leftIcon
                    )
                )}

                {/* Content Block */}
                <View style={{ flex: 1, marginHorizontal: 8 }}>
                    {title && (
                        <Text 
                            style={[commonStyles.listItemText, defaultTitleStyle, titleStyle]} 
                            numberOfLines={1}
                        >
                            {title}
                        </Text>
                    )}
                    
                    {subtitle && (
                        <Text 
                            style={[commonStyles.captionText, defaultSubtitleStyle, subtitleStyle]}
                            numberOfLines={0}
                        >
                            {subtitle}
                        </Text>
                    )}

                    {content && (
                        <Text 
                            style={[commonStyles.captionText, defaultContentStyle, contentStyle]}
                            numberOfLines={contentNumberOfLines}
                            ellipsizeMode="tail"
                        >
                            {content}
                        </Text>
                    )}
                </View>

                {/* Right Icon */}
                {rightIcon && (
                    typeof rightIcon === 'string' ? (
                        <IconButton
                            icon={rightIcon}
                            onPress={onRightPress}
                            size={26}
                            color={theme.colors.primary}
                            style={{ alignSelf: 'center' }}
                            accessibilityLabel={rightAccessibilityLabel}
                        />
                    ) : (
                        rightIcon
                    )
                )}
            </View>

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
    padding: 8
  }
});

export default ListCard;
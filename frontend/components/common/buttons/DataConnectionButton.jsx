import React, { useState } from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity,  } from "react-native";
import {
  Card,
  IconButton,
  Chip,
  Menu,
  useTheme,
  ActivityIndicator,
} from "react-native-paper";
import { commonStyles } from "../../../assets/styles/stylesheets/common";

const activeIcon = require("../../../assets/images/check.png");
const inactiveIcon = require("../../../assets/images/cross.png");

const DataConnectionButton = ({
  label = "Data Connection 1",
  type = "Custom Source",
  status = "connected",
  lastSync,
  error,
  isProcessing = false,
  onSync,
  onTest,
  onSettings,
  onDelete,
  onNavigate,
}) => {
  const theme = useTheme();
  const [menuVisible, setMenuVisible] = useState(false);

  const openMenu = () => setMenuVisible(true);
  const closeMenu = () => setMenuVisible(false);

  const getStatusColor = () => {
    switch (status) {
      case "connected":
        return theme.colors.themeGreen;
      case "error":
        return theme.colors.error;
      case "syncing":
      case "testing":
        return theme.colors.primary;
      default:
        return theme.colors.disabled;
    }
  };

  const formatLastSync = (dateString) => {
    if (!dateString) return "Never";
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <TouchableOpacity onPress={() => onNavigate} >
    <Card
      mode="elevated"
      style={[
        styles.sourceCard,
        { backgroundColor: theme.colors.buttonBackground },
      ]}
    >
      <Card.Title
        subtitle={label}
        subtitleStyle={[
          commonStyles.listItemText,
          { color: theme.colors.text },
        ]}
        right={() => (
          <View
            style={[
              styles.statusContainer,
              { backgroundColor: `${getStatusColor()}22` },
            ]}
          >
            <Image
              source={status === "connected" ? activeIcon : inactiveIcon}
              style={[styles.statusIcon, { tintColor: getStatusColor() }]}
              resizeMode="contain"
            />
            <Chip
              mode="outlined"
              textStyle={[styles.statusChipText, { color: getStatusColor() }]}
              style={[
                styles.statusChip,
                {
                  borderColor: getStatusColor(),
                  backgroundColor: `${getStatusColor()}11`,
                },
              ]}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Chip>
          </View>
        )}
        style={commonStyles.titleText}
      />

      <Card.Content style={styles.cardContent}>
        <View style={styles.cardDetails}>
          <Text
            style={[
              commonStyles.captionText,
              { color: theme.colors.themeGrey, fontStyle: "italic" },
            ]}
          >
            Last sync: {formatLastSync(lastSync)}
          </Text>
          {error && (
            <Text style={[styles.errorText, { color: theme.colors.error }]}>
              Error: {error}
            </Text>
          )}
        </View>
      </Card.Content>

      <Card.Actions style={styles.cardActions}>
        <IconButton
          onPress={onSync}
          icon="refresh"
          size={26}
          disabled={isProcessing}
          color={theme.colors.primary}
          style={styles.actionButton}
          accessibilityLabel="Sync Data Connection"
        />
        <Menu
          visible={menuVisible}
          onDismiss={closeMenu}
          anchor={
            <IconButton
              icon="dots-vertical"
              size={26}
              onPress={openMenu}
              style={styles.actionButton}
              accessibilityLabel="More options"
            />
          }
        >
          <Menu.Item
            dense
            leadingIcon="link"
            onPress={onTest}
            title="Test Connection"
            disabled={isProcessing}
            color={theme.colors.primary}
            contentStyle={{ backgroundColor: theme.colors.buttonBackground }}
          />
          <Menu.Item
            dense
            leadingIcon="cog"
            onPress={onSettings}
            title="Settings"
            contentStyle={{ backgroundColor: theme.colors.buttonBackground }}
          />
          <Menu.Item
            dense
            leadingIcon="delete"
            onPress={onDelete}
            title="Delete"
            titleStyle={{ color: theme.colors.error }}
            contentStyle={{ backgroundColor: theme.colors.buttonBackground }}
          />
        </Menu>
      </Card.Actions>
    </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  sourceCard: {
    borderRadius: 4,
    padding: 2,
  },
  cardTitle: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 6,
    flex: 1,
    flexDirection: "row",
    alignContent: "center",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    flexShrink: 1,
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center", 
    justifyContent: "center",
    borderRadius: 20,
    paddingHorizontal: 6,
    paddingVertical: 4,
    transitionDuration: "200ms",
  },

  statusIcon: {
    width: 22,
    height: 22,
    marginRight: 6,
  },
  statusChip: {
    height: 26,
    borderWidth: 1.5,
    paddingHorizontal: 8,
    borderRadius: 14,
  },
  statusChipText: {
    paddingVertical: 0,
    fontWeight: "600",
    lineHeight: "10",
  },
  cardDetails: {
    flexDirection: "column",
  },
  cardActions: {
    justifyContent: "flex-end",
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  actionButton: {
    marginHorizontal: 4,
  },
});

export default DataConnectionButton;

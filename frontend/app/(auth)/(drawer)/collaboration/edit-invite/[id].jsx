import React, { useEffect, useState } from "react";
import { View, ScrollView, TouchableOpacity, Alert } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { Text, TextInput, Dialog, Portal, Button } from "react-native-paper";

import Header from "../../../../../components/layout/Header";
import { commonStyles } from "../../../../../assets/styles/stylesheets/common";
import { apiGet, apiPut, apiDelete } from "../../../../../utils/api/apiClient";
import endpoints from "../../../../../utils/api/endpoints";
import { getWorkspaceId } from "../../../../../storage/workspaceStorage";

const EditUser = () => {
  const { id } = useLocalSearchParams(); // inviteId from route
  const [workspaceId, setWorkspaceId] = useState(null);
  const [invite, setInvite] = useState(null);
  const [roles, setRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState("");
  const [roleDialogVisible, setRoleDialogVisible] = useState(false);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const wsId = await getWorkspaceId();
        setWorkspaceId(wsId);

        const inviteRes = await apiGet(endpoints.workspace.invites.getInvite(wsId, id));
        setInvite(inviteRes);
        setSelectedRole(inviteRes.role?.name || "");

        const rolesRes = await apiGet(endpoints.workspace.roles.getRoles(wsId));
        setRoles(rolesRes || []);
      } catch (err) {
        console.error("Error loading invite:", err);
      }
    };

    if (id) fetchInitialData();
  }, [id]);

  const handleUpdate = async () => {
    try {
      const selectedRoleObj = roles.find((role) => role.name === selectedRole);
      if (!selectedRoleObj) {
        console.warn("Invalid role selected.");
        return;
      }

      const payload = {
        roleId: selectedRoleObj.roleId,
      };

      await apiPut(endpoints.workspace.invites.update(workspaceId, id), payload);
      router.replace("/collaboration/invites");
    } catch (error) {
      console.error("Failed to update invite:", error);
    }
  };

  const handleDelete = async () => {
    try {
      await apiDelete(endpoints.workspace.invites.cancelInvite(workspaceId, id));
      setDeleteDialogVisible(false);
      router.replace("/collaboration/invites");
    } catch (error) {
      console.error("Failed to delete invite:", error);
    }
  };

  return (
    <View style={commonStyles.screen}>
      <Header title="Edit Invite" showBack showCheck onRightIconPress={handleUpdate} />

      {invite && (
        <>
          <TextInput
            label="Email Address"
            value={invite.email}
            mode="outlined"
            disabled
            style={{ marginVertical: 16 }}
          />

          <TouchableOpacity onPress={() => setRoleDialogVisible(true)}>
            <TextInput
              label="Select Role"
              value={selectedRole}
              mode="outlined"
              editable={false}
              right={<TextInput.Icon icon="menu-down" />}
            />
          </TouchableOpacity>

          <Button
            mode="contained"
            buttonColor="#960019"
            textColor="#fff"
            style={{ marginTop: 32 }}
            onPress={() => setDeleteDialogVisible(true)}
          >
            Delete Invite
          </Button>

          {/* Role Selection Dialog */}
          <Portal>
            <Dialog visible={roleDialogVisible} onDismiss={() => setRoleDialogVisible(false)}>
              <Dialog.Title>Select a Role</Dialog.Title>
              <Dialog.ScrollArea>
                <ScrollView style={{ paddingHorizontal: 16 }}>
                  {roles.map((role) => (
                    <TouchableOpacity
                      key={role.roleId}
                      onPress={() => {
                        setSelectedRole(role.name);
                        setRoleDialogVisible(false);
                      }}
                      style={{
                        paddingVertical: 12,
                        borderBottomWidth: 1,
                        borderBottomColor: "#eee",
                      }}
                    >
                      <Text>{role.name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </Dialog.ScrollArea>
              <Dialog.Actions>
                <Button onPress={() => setRoleDialogVisible(false)}>Cancel</Button>
              </Dialog.Actions>
            </Dialog>
          </Portal>

          {/* Delete Confirmation Dialog */}
          <Portal>
            <Dialog visible={deleteDialogVisible} onDismiss={() => setDeleteDialogVisible(false)}>
              <Dialog.Title>Confirm Deletion</Dialog.Title>
              <Dialog.Content>
                <Text>Are you sure you want to delete this invite?</Text>
              </Dialog.Content>
              <Dialog.Actions>
                <Button onPress={() => setDeleteDialogVisible(false)}>Cancel</Button>
                <Button textColor="red" onPress={handleDelete}>
                  Delete
                </Button>
              </Dialog.Actions>
            </Dialog>
          </Portal>
        </>
      )}
    </View>
  );
};

export default EditUser;

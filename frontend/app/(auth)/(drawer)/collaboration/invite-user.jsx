// Author(s): Matthew Page

import React, { useState, useEffect } from "react";
import { View, ScrollView, TouchableOpacity } from "react-native";
import { Text, TextInput, RadioButton, Dialog, Portal, Button } from "react-native-paper";
import { router, useLocalSearchParams } from "expo-router";
import Header from "../../../../components/layout/Header";
import { commonStyles } from "../../../../assets/styles/stylesheets/common";
import { apiGet, apiPost } from "../../../../utils/api/apiClient";
import { getWorkspaceId } from "../../../../storage/workspaceStorage";
import endpoints from "../../../../utils/api/endpoints";
import ResponsiveScreen from "../../../../components/layout/ResponsiveScreen";
import DropDown from "../../../../components/common/input/DropDown";
import StackLayout from "../../../../components/layout/StackLayout";
import TextField from "../../../../components/common/input/TextField";
import BasicButton from "../../../../components/common/buttons/BasicButton";

const InviteUser = () => {
  const [workspaceId, setWorkspaceId] = useState(null);
  const [userEmail, setUserEmail] = useState("");
  const [roles, setRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState("");
  const [inviting, setInviting] = useState(false);
  const { from } = useLocalSearchParams();

  useEffect(() => {
    const fetchId = async () => {
      const id = await getWorkspaceId();
      setWorkspaceId(id);
    };
    fetchId();
  }, []);

  useEffect(() => {
    if (!workspaceId) return;

    const fetchRoles = async () => {
      try {
        const result = await apiGet(endpoints.workspace.roles.getRoles(workspaceId));
        const fetchedRoles = result;

        // filter out the owner role
        const filtered = (fetchedRoles || []).filter(role => !role.owner);
        setRoles(filtered);
      } catch (error) {
        console.error("Error fetching roles:", error);
      }
    };

    fetchRoles();
  }, [workspaceId]);

  const handleSendInvite = async () => {
    if (!userEmail || !selectedRole || !workspaceId) {
      console.warn("Missing data for invite.");
      return;
    }

    try {
      const selectedRoleObj = roles.find(role => role.roleId === selectedRole);

      if (!selectedRoleObj) {
        console.warn("Selected role not found in roles list.");
        return;
      }

      setInviting(true);

      const data = {
        email: userEmail.trim(),
        roleId: selectedRoleObj.roleId,
      };

      const result = await apiPost(
        endpoints.workspace.invites.create(workspaceId),
        data
      );

      console.log("Invite sent:", result);

      // redirects to invite list after sending the invite
      if (from == "invites") router.back();
      else router.replace("/collaboration/invites");
      setInviting(false);
    } catch (error) {
      console.error("Error sending invite:", error);
      setInviting(false);
    }
  };

  return (
		<ResponsiveScreen
			header={
        <Header title="Invite User" showBack />        
      }
			center={false}
			padded
      scroll={false}
		>
      <StackLayout spacing={34}>
        <TextField
          label="Email Address"
          value={userEmail}
          placeholder="Email"
          onChangeText={setUserEmail}
        />

        <DropDown
          title="Select Role"
          items={roles.map(role => ({ label: role.name, value: role.roleId }))}
          value={selectedRole}
          onSelect={setSelectedRole}
          showRouterButton={false}
        />
      </StackLayout>


                        
      <View style={commonStyles.inlineButtonContainer}>
        <BasicButton 
          label={inviting ? "Inviting..." : "Invite"} 
          onPress={handleSendInvite}
          disabled={inviting}
        />
      </View>
              

      
    </ResponsiveScreen>
  );
};

export default InviteUser;

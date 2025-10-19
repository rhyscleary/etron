// Author(s): Rhys Cleary

import { useState, useEffect, useCallback } from "react";
import { View, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { Text, TextInput, RadioButton, Dialog, Portal, Button, useTheme, Divider, Avatar } from "react-native-paper";
import { useLocalSearchParams, useRouter } from "expo-router";

import Header from "../../../../../components/layout/Header";
import { commonStyles } from "../../../../../assets/styles/stylesheets/common";
import { apiGet } from "../../../../../utils/api/apiClient";
import endpoints from "../../../../../utils/api/endpoints";
import { getWorkspaceId } from "../../../../../storage/workspaceStorage";
import TextField from "../../../../../components/common/input/TextField";
import AvatarButton from "../../../../../components/common/buttons/AvatarButton";
import { updateUserAttribute } from "aws-amplify/auth";
import StackLayout from "../../../../../components/layout/StackLayout";
import ResponsiveScreen from "../../../../../components/layout/ResponsiveScreen";
import formatDateTime from "../../../../../utils/format/formatISODate";
import { useFocusEffect } from "@react-navigation/native";
import DescriptiveButton from "../../../../../components/common/buttons/DescriptiveButton";
import AvatarDisplay from "../../../../../components/icons/AvatarDisplay";


const ViewUser = () => {
	const { userId } = useLocalSearchParams();
	const router = useRouter();
	const theme = useTheme();

	const [firstName, setFirstName] = useState("");
	const [lastName, setLastName] = useState("");
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
	const [roleName, setRoleName] = useState("");
    const [joinDate, setJoinDate] = useState("");
	const [profilePicture, setProfilePicture] = useState(null);
    const [loading, setLoading] = useState(true);

	useEffect(() => {
		loadUser();
	}, []);	

    useFocusEffect(
        useCallback(() => {
            loadUser();
        }, [loadUser])
    );

    const loadUser = useCallback(async () => {
        setLoading(true);
        const workspaceId = await getWorkspaceId();

        let user = {};
        try {
            const result = await apiGet(endpoints.workspace.users.getUser(workspaceId, userId));
            user = result.data;
        } catch (error) {
            console.error("Error fetching user:", error);
            return;
        }
        
        let roleName;
        try {
            const result = await apiGet(endpoints.workspace.roles.getRole(workspaceId, user.roleId));
            roleName = result.data.name;
        } catch (error) {
            console.error("Error fetching role details:", error);
            return;
        }

        setFirstName(user.given_name);
        setLastName(user.family_name);
        setName(user.given_name + " " + user.family_name);
        setEmail(user.email);
        setRoleName(roleName);
        setJoinDate(formatDateTime(user.joinedAt));
        
        setLoading(false);
    });


	return (
		<ResponsiveScreen
			header={
                <Header 
                    title={"User"} 
                    showBack 
                    showEdit 
                    onRightIconPress={() => router.navigate(`/collaboration/edit-user/${userId}`)} 
                />
            }
			center={false}
			padded
            scroll={false}
		>

            { loading ? (
                <View style={commonStyles.centeredContainer}>
                    <ActivityIndicator size="large" />
                </View>
            ) : (
                <StackLayout spacing={34}>
                    <View style={{ alignItems: "center"}}>
                        <AvatarDisplay
                            imageSource={profilePicture ? { uri: profilePicture } : null}
                            firstName={firstName}
                            lastName={lastName}
                        />
                    </View>

                    <StackLayout spacing={24}>
                        <TextField
                            value={name}
                            placeholder="Name"
                            isDisabled={true}
                        />

                        <TextField
                            value={email}
                            placeholder="Email"
                            isDisabled={true}
                        />

                        <TextField
                            value={roleName}
                            placeholder="Role"
                            isDisabled={true}
                        />

                        <TextField
                            value={"Joined: " + joinDate}
                            placeholder="Join Date"
                            isDisabled={true}
                        />

                        <Divider />

                        <DescriptiveButton 
                            label="User Activity Log" 
                            onPress={() => router.navigate(`/collaboration/user-log/${userId}`)}
                        />
                    </StackLayout>
                </StackLayout>
            )}
		</ResponsiveScreen>
	);
};

export default ViewUser;

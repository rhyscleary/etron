// Author(s): Rhys Cleary

import { useState, useEffect } from "react";
import { View, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { Text, TextInput, RadioButton, Dialog, Portal, Button, useTheme } from "react-native-paper";
import { useLocalSearchParams, useRouter } from "expo-router";

import Header from "../../../../../components/layout/Header";
import { commonStyles } from "../../../../../assets/styles/stylesheets/common";
import { apiGet, apiPut, apiDelete, apiPatch } from "../../../../../utils/api/apiClient";
import endpoints from "../../../../../utils/api/endpoints";
import { getWorkspaceId } from "../../../../../storage/workspaceStorage";
import TextField from "../../../../../components/common/input/TextField";
import BasicButton from "../../../../../components/common/buttons/BasicButton";
import AvatarButton from "../../../../../components/common/buttons/AvatarButton";
import { updateUserAttribute } from "aws-amplify/auth";
import { getUserType } from "../../../../../storage/userStorage";
import StackLayout from "../../../../../components/layout/StackLayout";

const ViewUser = () => {
	const { userId } = useLocalSearchParams();
	const router = useRouter();
	const theme = useTheme();

	const [workspaceId, setWorkspaceId] = useState(null);
	const [firstName, setFirstName] = useState("");
	const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
	const [roleName, setRoleName] = useState("");
	const [profilePicture, setProfilePicture] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadUserData();
    }, []);

    const loadUserData = async () => {
        
    }
	useEffect(() => {
		const initialise = async () => {
			const userType = await getUserType();
			console.log("userType:", userType);
			const workspaceIdTemp = await getWorkspaceId();
            console.log(workspaceIdTemp);
			setWorkspaceId(workspaceIdTemp);

			try {
				const user = await apiGet(endpoints.workspace.users.getUser(workspaceIdTemp, userId));
				setFirstName(user.given_name);
				setLastName(user.family_name);
                setEmail(user.email);
				//setSelectedRole(user.roleId || "");
                setRoleName();
			} catch (error) {
				console.error("Error fetching user:", error);
				return;
			}
			
			try {
				console.log("workspaceId:", workspaceIdTemp);
				const fetchedRoles = await apiGet(endpoints.workspace.roles.getRoles(workspaceIdTemp));
				console.log("fetchedRoles:", fetchedRoles);
				
			} catch (error) {
				console.error("Error fetching roles:", error);
				return;
			}
		};
		initialise();
	}, []);	


	return (
		<View style={commonStyles.screen}>
			<Header 
                title={firstName || "View User"} 
                showBack 
                showEdit 
                onRightIconPress={() => router.navigate(`/collaboration/edit-user/${userId}`)} 
            />

            { loading ? (
                <View style={commonStyles.centeredContainer}>
                    <ActivityIndicator size="large" />
                </View>
            ) : (
                <View>
                    <StackLayout spacing={34}>
                        <View style={{ alignItems: "center"}}>
                            <AvatarButton
                                type={profilePicture ? "image" : "text"}
                                imageSource={profilePicture ? {uri: profilePicture} : undefined}
                                firstName={firstName}
                                lastName={lastName}
                                badgeType={profilePicture ? "remove" : "plus"}
                                //onPress={handleChoosePhoto}
                            />
			            </View>

                        <StackLayout spacing={24}>
                            <TextField
                                value={firstName}
                                placeholder="First Name"
                                isDisabled={true}
                            />

                            <TextField
                                value={lastName}
                                placeholder="Last Name"
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
                        </StackLayout>

                        
                        <TextInput
                            label="Select Role"
                            value={roleName}
                            mode="outlined"
                            editable={false}
                            right={<TextInput.Icon icon="menu-down" />}
                            style={{ marginTop: 8 }}
                        />
                    </StackLayout>
                </View>
            )}

            

		</View>
	);
};

export default ViewUser;

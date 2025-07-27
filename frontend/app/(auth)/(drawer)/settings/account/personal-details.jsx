import { useEffect, useState } from "react";
import { ActivityIndicator, View } from 'react-native'
import { commonStyles } from '../../../../../assets/styles/stylesheets/common';
import Header from '../../../../../components/layout/Header';
import { apiPut } from "../../../../../utils/api/apiClient";
import StackLayout from "../../../../../components/layout/StackLayout";
import TextField from "../../../../../components/common/input/TextField";
import BasicButton from "../../../../../components/common/buttons/BasicButton";
import { Text, useTheme } from "react-native-paper";


const PersonalDetails = () => {
    const theme = useTheme();

    const [first, setFirst] = useState("");
    const [last, setLast] = useState("");
    const [phone, setPhone] = useState("");
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({
        first: false,
        last: false,
        phone: false,
    });

    useEffect(() => {
        async function loadPersonalDetails() {
            setLoading(true);
            try {
                // TODO: add getPersonalDetails here
                const details = "";
                if (details) {
                    setFirst(details.first || "" );
                    setLast(details.last || "");
                    setPhone(details.phone || "");
                }
            } catch (error) {
                console.log("Error loading personal details: ", error);
                
                // remove after implementing data retrieval
                setFirst("error");
                setLast("error");
                setPhone("error");
            }
            setLoading(false);
        }
        loadPersonalDetails();
    }, []);

    async function handleUpdate(){
        
        const newErrors = {
            first: !first.trim(),
            last: !last.trim(),
            phone: phone && phone.length !== 9,
        };
        setErrors(newErrors);

        if (Object.values(newErrors).some(Boolean)) {
            return;
        }

        
        try {
            // TODO: get required data here
            
            const personalDetails = {
                first,
                last,
                phone: phone || null
            }

            // TODO: update endpoint here
            const response = await apiPut(
                ``,
                personalDetails
            );
            // TODO: user feedback on successful update
            console.log("Personal details updated successfully: ", response);

        } catch (error) {
            console.log("Error updating personal details: ", error);
        }
    }

    return(
        <View style={commonStyles.screen}>
            <Header title="Personal Details" showBack></Header>
            { loading ? (
                <View style={styles.contentContainer}>
                    <ActivityIndicator size="large" />
                </View>
            ) : (
                <View>
                    <StackLayout spacing={34}>
                        {/* TODO: set error handling and input validation */}
                        <TextField 
                            label="First Name"
                            value={first}
                            placeholder="Jane"
                            textContentType="givenName"
                            onChangeText={(text) => {
                                setFirst(text);
                                if (text.trim()) {
                                    setErrors((prev) => ({ ...prev, first: false }));
                                }
                            }}
                        />
                        {errors.first && (
                            <Text style={{ color: theme.colors.error }}>Please enter your first name</Text>
                        )}
                        <TextField 
                            label="Last Name"
                            value={last}
                            textContentType="familyName"
                            placeholder="Doe"
                            onChangeText={(text) => {
                                setLast(text);
                                if (text.trim()) {
                                    setErrors((prev) => ({ ...prev, last: false }));
                                }
                            }}
                        />
                        {errors.last && (
                            <Text style={{ color: theme.colors.error }}>Please enter your last name</Text>
                        )}
                        <TextField 
                            label="Phone Number"
                            value={phone}
                            placeholder="0123456789"
                            maxLength={10}
                            keyboardType="numeric"
                            textContentType="telephoneNumber"
                            onChangeText={(text) => {
                                setPhone(text);
                                if (text.length === 9) {
                                    setErrors((prev) => ({ ...prev, phone: false }));
                                }
                            }}
                        />
                    </StackLayout>
                    <View style={commonStyles.inlineButtonContainer}>
                        <BasicButton label="Update" onPress={handleUpdate} />
                    </View>
                    {errors.phone && (
                        <Text style={{ color: theme.colors.error }}>Phone number must be 9 digits</Text>
                    )}
                </View>
            )
            }
            
        </View>
    )
}

export default PersonalDetails;
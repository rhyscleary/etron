import { useEffect, useState } from "react";
import { ActivityIndicator, View } from 'react-native'
import { commonStyles } from '../../../../../assets/styles/stylesheets/common';
import Header from '../../../../../components/layout/Header';
import { apiPut } from "../../../../../utils/api/apiClient";
import StackLayout from "../../../../../components/layout/StackLayout";
import TextField from "../../../../../components/common/input/TextField";
import BasicButton from "../../../../../components/common/buttons/BasicButton";

// yeah idk why errors make the app go white
const PersonalDetails = () => {
    const [first, setFirst] = useState("");
    const [last, setLast] = useState("");
    const [phone, setPhone] = useState("");
    const [loading, setLoading] = useState(false);
    const [firstError, setFirstError] = useState(false);
    const [lastError, setLastError] = useState(false);
    const [phoneError, setPhoneError] = useState(false);

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
        
        if (!first.trim()) {
            setFirstError(true);
            return;
        } else if (!last.trim()) {
            setLastError(true);
            return;
        } else if (phone && phone.length !==9) {
            setPhoneError(true);
            return;
        }


        
        try {
            // TODO: get required data here
            
            const personalDetails = {
                first,
                last,
                phone: phone || null
            }

            // update endpoint here
            const response = await apiPut(
                ``,
                personalDetails
            );

            console.log("Personal details updated successfully: ", response);

        } catch (error) {
            console.log("Error updating personal details: ", error);
        }
    }

    return(
        <View style={commonStyles.screen}>
            <Header title="Personal Details" showBack></Header>
            {/* ?? where is styles coming from? */}
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
                            onChangeText={(text) => {
                                setFirst(text);
                                if (text.trim()) {
                                    setFirstError(false);
                                }
                            }}
                        />
                        {firstError && (
                            <Text style={{color: theme.colors.error}}>Please enter your first name</Text>
                        )}
                        <TextField 
                            label="Last Name"
                            value={last}
                            placeholder="Doe"
                            onChangeText={(text) => {
                                setLast(text);
                                if (text.trim()) {
                                    setLastError(false);
                                }
                            }}
                        />
                        {lastError && (
                            <Text style={{color: theme.colors.error}}>Please enter your last name</Text>
                        )}
                        <TextField 
                            label="Phone Number"
                            value={phone}
                            placeholder="0123456789"
                            maxLength={10}
                            keyboardType="numeric"
                            onChangeText={(text) => {
                                setPhone(text);
                                if(text.length === 9) {
                                    setPhoneError(false);
                                }
                            }}
                        />
                    </StackLayout>
                    <View style={commonStyles.inlineButtonContainer}>
                        <BasicButton label="Update" onPress={handleUpdate} />
                    </View>
                </View>
            )
            }
            
        </View>
    )
}

export default PersonalDetails;
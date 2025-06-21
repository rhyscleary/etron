import { useEffect } from "react";
import { Redirect, useRouter } from "expo-router";
import { PaperProvider, Text } from 'react-native-paper';
import { View } from "react-native";

export default function Index() {
    
    return (
        <Redirect href="/settings" />
    );
}

/*import React from 'react';
import {Text} from 'react-native';


const Landing = () => {
    return (
        <Text>Hello</Text>
    );
};

export default Landing;*/
import { useEffect } from "react";
import { Redirect, useRouter } from "expo-router";

export default function Index() {
    
    return <Redirect href="/landing" />;
}

/*import React from 'react';
import {Text} from 'react-native';


const Landing = () => {
    return (
        <Text>Hello, I am RJ!</Text>
    );
};

export default Landing;*/
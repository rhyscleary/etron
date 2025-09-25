// Author(s): Matthew Parkinson

import React, { useState, useEffect } from 'react';
import { Redirect, useRouter, router, Link } from "expo-router";
import { View, Image, ImageBackground, StyleSheet } from 'react-native';
import { PaperProvider, Text } from 'react-native-paper';
import BasicButton from '../components/common/buttons/BasicButton';
import { useTheme } from 'react-native-paper';
import ResponsiveScreen from '../components/layout/ResponsiveScreen';

const Landing = () => {
	const theme = useTheme();

	return (
		<ImageBackground
			source={require('../assets/images/LandingTextBackground.png')}
			style={styles.background}
			resizeMode='cover'
		>	
			<ResponsiveScreen>
				<Image style={{ width:"100%", height:200, resizeMode: 'contain' }}
					source={require('../assets/images/Logo.png')}>
				</Image>
				<Image style={{ width:"100%", height:200, resizeMode: 'contain' }}
					source={require('../assets/images/LandingTextForeground.png')}>
				</Image>
				<View style={{ padding: 20, gap: 40 }}>
					<BasicButton
						label='Login'
						onPress={() => router.navigate('/login-signup?isSignUp=false')}
						fullWidth
					/>
					<BasicButton
						label='Sign Up'
						onPress={() => router.navigate('/login-signup?isSignUp=true')}
						fullWidth
					/>
				</View>
			</ResponsiveScreen>
		</ImageBackground>
	);
}

const styles = StyleSheet.create({
	background: {
		flex: 1,
	},
	content: {
		flex: 1,
		padding: 5,
		gap: 30,
		justifyContent: 'center',
	},
	foregroundImage: {
		width: 380,
		height: 280,
		resizeMode: 'contain',
	},
	buttonContainer: {
		padding: 20,
		gap: 30,
	},
});

export default Landing;
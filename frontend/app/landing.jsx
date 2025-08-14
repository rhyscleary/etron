// Author(s): Matthew Parkinson

import React, { useState, useEffect } from 'react';
import { Redirect, useRouter, router, Link } from "expo-router";
import { View, Image, ImageBackground, StyleSheet } from 'react-native';
import { PaperProvider, Text } from 'react-native-paper';
import BasicButton from '../components/common/buttons/BasicButton';
import { useTheme } from 'react-native-paper';
import {SafeAreaView, SafeAreaProvider} from 'react-native-safe-area-context';

/*
UNSURE WHAT TO DO WITH THIS AT THIS MOMENT

import { Linking } from 'react-native';

import { signIn, signUp, signInWithRedirect } from 'aws-amplify/auth';
*/

const Landing = () => {
  const theme = useTheme();

  return (
    <SafeAreaProvider>
        <SafeAreaView style={{ flex: 1 }} edges={['left', 'right']}>
            <ImageBackground
                source={require('../assets/images/LandingTextBackground.png')}
                style={styles.background}
                resizeMode='cover'
            >
            

            <View style={{ padding: 5, gap: 30, justifyContent: 'center' }}>

              <View>
                <Image style={{ width: 380, height: 280, resizeMode: 'contain' }}
                    source={require('../assets/images/LandingTextForeground.png')}>
                </Image>
              </View>
                <View style={{ padding: 20, gap: 30 }}>
                    <View>
                        <BasicButton
                            label='Login'
                            onPress={() => router.push('/login-signup?isSignUp=false')}
                        />
                    </View>

                    <View style={{ alignItems: 'flex-end' }}>
                        <BasicButton
                            label='Sign Up'
                            onPress={() => router.push('/login-signup?isSignUp=true')}
                        />
                    </View>
                </View>

            </View>
            </ImageBackground>
        </SafeAreaView>
    </SafeAreaProvider>
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
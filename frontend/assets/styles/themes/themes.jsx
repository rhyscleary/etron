import { MD3LightTheme, MD3DarkTheme } from "react-native-paper";

const LightTheme = {

};

const DarkTheme = {
    ...MD3DarkTheme,
    colors: {
        ...MD3DarkTheme.colors,
        primary: '#118AB2', 
        secondary: '#577590',
        text: '#F7F7F7',
        textAlt: '#FFFFFF',
        //outline: '#577590', // the colour for text input and button outlines
        outline: '#476580', // new outline?
        //buttonBackground: '#2B2B2B', // background for cards and outlined buttons
        buttonBackgroundAlt: '#2B2B2B',
        buttonBackground: "#2C2C2C",
        background : "rgb(29, 27, 30)",

        error: '#EF476F', // error messages and dangerous actions
        //error: '#EF4747', // red version
        icon: '#F7F7F7',
        divider: '#6C6C6C',
        navigationRailBackground: '#1D4364',
        themeGreen: '#06D6A0',
        themeGrey: '#ABABAB',

        altGM: '#F7F7F7',
        //surface: "#1E1E1E"
    },   
};

export const themes = {
    light: LightTheme,
    dark: DarkTheme
}
import React from "react";
import { View, Text } from "react-native";
import StackLayout from "./StackLayout";
import TextField from "../common/input/TextField";
import { commonStyles } from "../../assets/styles/stylesheets/common";

//TODO: put otjer section here
const JSON_HEADERS_EXAMPLE = `{
  "Content-Type": "application/json",
  "Authorization": "Bearer YOUR_TOKEN",
  "X-API-Key": "your-api-key"
}`;

const FormSection = ({ 
  apiName, setApiName, 
  url, setUrl, 
  headers, setHeaders, 
  authentication, setAuthentication, 
  errors, isConnected, 
  onUrlFocus, onUrlBlur, theme 
}) => {
  return (
    <View style={{ paddingHorizontal: 16, paddingVertical: 8 }}>
      <StackLayout spacing={15}>
        <TextField 
          label="API Name"
          placeholder="My Custom API"
          value={apiName}
          onChangeText={setApiName}
          error={errors.apiName}
          disabled={isConnected}
        />
        
        <TextField 
          label="API URL"
          placeholder="https://api.example.com/v1"
          value={url}
          onChangeText={setUrl}
          error={errors.url}
          disabled={isConnected}
          keyboardType="url"
          onFocus={onUrlFocus}
          onBlur={onUrlBlur}
        />
        
        <StackLayout spacing={8}>
          <TextField 
            label="Headers (JSON format)"
            placeholder={JSON_HEADERS_EXAMPLE}
            value={headers}
            onChangeText={setHeaders}
            error={errors.headers}
            disabled={isConnected}
            tall={true}
            dense={true}
          />
          <Text style={[commonStyles.captionText, { color: theme.colors.onSurfaceVariant }]}>
            Optional: Add custom headers in JSON format
          </Text>
        </StackLayout>
        
        <TextField 
          label="Authentication"
          placeholder="Bearer token, API key, etc."
          value={authentication}
          onChangeText={setAuthentication}
          disabled={isConnected}
          secureTextEntry
        />
      </StackLayout>
    </View>
  );
};

export default FormSection;

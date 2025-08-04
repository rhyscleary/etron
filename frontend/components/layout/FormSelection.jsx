import React from "react";
import { View, Text } from "react-native";
import StackLayout from "../layout/StackLayout";
import TextField from "../common/input/TextField";
import { commonStyles } from "../../assets/styles/stylesheets/common";

const JSON_HEADERS_EXAMPLE = `{
  "Content-Type": "application/json",
  "Authorization": "Bearer YOUR_TOKEN",
  "X-API-Key": "your-api-key"
}`;

const FtpFormSection = ({
  formData,
  setFormData,
  errors,
  isConnected,
  theme,
  onFieldBlur,
}) => {
  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <View style={{ paddingHorizontal: 16, paddingVertical: 8 }}>
      <StackLayout spacing={15}>
        <TextField
          label="Connection Name"
          placeholder="This will be generated for you if left blank"
          value={formData.name || ""}
          onChangeText={(value) => updateField("name", value)}
          error={errors.name}
          disabled={isConnected}
        />

        <TextField
          label="Hostname"
          placeholder="ftp.example.com"
          value={formData.hostname || ""}
          onChangeText={(value) => updateField("hostname", value)}
          onBlur={() => {
            if (!formData.name && typeof onFieldBlur === "function") {
              const generated = onFieldBlur();
              if (generated) updateField("name", generated);
            }
          }}
          error={errors.hostname}
          disabled={isConnected}
          keyboardType="url"
        />

        <TextField
          label="Port"
          placeholder="21"
          value={formData.port || ""}
          onChangeText={(value) => updateField("port", value)}
          error={errors.port}
          disabled={isConnected}
          keyboardType="numeric"
        />

        <TextField
          label="Username"
          placeholder="Enter username"
          value={formData.username || ""}
          onChangeText={(value) => updateField("username", value)}
          error={errors.username}
          disabled={isConnected}
          autoCapitalize="none"
        />

        <TextField
          label="Password"
          placeholder="Enter password"
          value={formData.password || ""}
          onChangeText={(value) => updateField("password", value)}
          error={errors.password}
          disabled={isConnected}
          secureTextEntry
        />

        <StackLayout spacing={8}>
          <TextField
            label="Key File (Optional)"
            placeholder="Path to private key file"
            value={formData.keyFile || ""}
            onChangeText={(value) => updateField("keyFile", value)}
            error={errors.keyFile}
            disabled={isConnected}
          />
          <Text
            style={[
              commonStyles.captionText,
              { color: theme.colors.onSurfaceVariant },
            ]}
          >
            Optional: For key-based authentication
          </Text>
        </StackLayout>

        <StackLayout spacing={8}>
          <TextField
            label="Directory"
            placeholder="/home/user/data"
            value={formData.directory || ""}
            onChangeText={(value) => updateField("directory", value)}
            error={errors.directory}
            disabled={isConnected}
          />
          <Text
            style={[
              commonStyles.captionText,
              { color: theme.colors.onSurfaceVariant },
            ]}
          >
            Optional: Default directory path
          </Text>
        </StackLayout>
      </StackLayout>
    </View>
  );
};

const ApiFormSection = ({
  formData,
  setFormData,
  errors,
  isConnected,
  theme,
  onFieldBlur,
}) => {
  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <View style={{ paddingHorizontal: 16, paddingVertical: 8 }}>
      <StackLayout spacing={15}>
        <TextField
          label="API Name"
          placeholder="This will be generated for you if left blank"
          value={formData.name || ""}
          onChangeText={(value) => updateField("name", value)}
          error={errors.name}
          disabled={isConnected}
        />

        <TextField
          label="API URL"
          placeholder="https://api.example.com/v1"
          value={formData.url || ""}
          onChangeText={(value) => updateField("url", value)}
          onBlur={() => {
            if (!formData.name && typeof onFieldBlur === "function") {
              const generated = onFieldBlur();
              if (generated) updateField("name", generated);
            }
          }}
          error={errors.url}
          disabled={isConnected}
          keyboardType="url"
        />

        <StackLayout spacing={8}>
          <TextField
            label="Headers (JSON format)"
            placeholder={JSON_HEADERS_EXAMPLE}
            value={formData.headers || ""}
            onChangeText={(value) => updateField("headers", value)}
            error={errors.headers}
            disabled={isConnected}
            tall={true}
            dense={true}
          />
          <Text
            style={[
              commonStyles.captionText,
              { color: theme.colors.onSurfaceVariant },
            ]}
          >
            Optional: Add custom headers in JSON format
          </Text>
        </StackLayout>

        <TextField
          label="Authentication"
          placeholder="Bearer token, API key, etc."
          value={formData.authentication || ""}
          onChangeText={(value) => updateField("authentication", value)}
          disabled={isConnected}
          secureTextEntry
        />
      </StackLayout>
    </View>
  );
};

const MySqlFormSection = ({
  formData,
  setFormData,
  errors,
  isConnected,
  theme,
  onFieldBlur,
}) => {
  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <View style={{ paddingHorizontal: 16, paddingVertical: 8 }}>
      <StackLayout spacing={15}>
        <TextField
          label="Connection Name"
          placeholder="This will be generated for you if left blank"
          value={formData.name || ""}
          onChangeText={(value) => updateField("name", value)}
          error={errors.name}
          disabled={isConnected}
        />

        <TextField
          label="Host"
          placeholder="localhost"
          value={formData.host || ""}
          onChangeText={(value) => updateField("host", value)}
          onBlur={() => {
            if (!formData.name && typeof onFieldBlur === "function") {
              const generated = onFieldBlur();
              if (generated) updateField("name", generated);
            }
          }}
          error={errors.host}
          disabled={isConnected}
          keyboardType="url"
        />

        <TextField
          label="Port"
          placeholder="3306"
          value={formData.port || ""}
          onChangeText={(value) => updateField("port", value)}
          error={errors.port}
          disabled={isConnected}
          keyboardType="numeric"
        />

        <TextField
          label="Username"
          placeholder="Enter username"
          value={formData.username || ""}
          onChangeText={(value) => updateField("username", value)}
          error={errors.username}
          disabled={isConnected}
          autoCapitalize="none"
        />

        <TextField
          label="Password"
          placeholder="Enter password"
          value={formData.password || ""}
          onChangeText={(value) => updateField("password", value)}
          error={errors.password}
          disabled={isConnected}
          secureTextEntry
        />

        <TextField
          label="Database Name"
          placeholder="my_database"
          value={formData.database || ""}
          onChangeText={(value) => updateField("database", value)}
          error={errors.database}
          disabled={isConnected}
        />

        <StackLayout spacing={8}>
          <TextField
            label="SSL CA File (Optional)"
            placeholder="Path to CA certificate"
            value={formData.sslCA || ""}
            onChangeText={(value) => updateField("sslCA", value)}
            error={errors.sslCA}
            disabled={isConnected}
          />
          <Text
            style={[
              commonStyles.captionText,
              { color: theme.colors.onSurfaceVariant },
            ]}
          >
            Optional: For SSL connections
          </Text>
        </StackLayout>
      </StackLayout>
    </View>
  );
};

export { FtpFormSection, ApiFormSection, MySqlFormSection };

export default FtpFormSection;

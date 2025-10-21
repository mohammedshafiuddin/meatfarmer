import React, { useState } from "react";
import { View, Alert } from "react-native";
import { useRouter } from "expo-router";
import MyTextInput from "common-ui/src/components/textinput";
import MyButton from "common-ui/src/components/button";
import AppContainer from "common-ui/src/components/app-container";
import MyText from "common-ui/src/components/text";
import { useStaffAuth } from "@/components/context/staff-auth-context";

export default function LoginScreen() {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const { login, isLoggingIn, loginError } = useStaffAuth();
  const router = useRouter();

  const handleLogin = async () => {
    if (!name.trim() || !password.trim()) {
      Alert.alert("Error", "Please enter both name and password");
      return;
    }

    try {
      await login(name.trim(), password);
    } catch (error) {
      // Error is handled in the context
    }
  };

  return (
    <AppContainer>
      <View style={{ flex: 1, justifyContent: "center", paddingHorizontal: 20 }}>
        <MyText
          style={{
            fontSize: 24,
            fontWeight: "bold",
            textAlign: "center",
            marginBottom: 40,
            color: "#333",
          }}
        >
          Admin Login
        </MyText>

        <MyTextInput
          topLabel="Staff Name"
          placeholder="Enter your name"
          value={name}
          onChangeText={setName}
          autoCapitalize="none"
          autoCorrect={false}
          style={{ marginBottom: 20 }}
        />

        <MyTextInput
          topLabel="Password"
          placeholder="Enter your password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          style={{ marginBottom: 30 }}
        />

        {loginError && (
          <MyText
            style={{
              color: "red",
              textAlign: "center",
              marginBottom: 20,
              fontSize: 14,
            }}
          >
            {loginError}
          </MyText>
        )}

        <MyButton
          textContent={isLoggingIn ? "Logging in..." : "Login"}
          onPress={handleLogin}
          disabled={isLoggingIn}
          fullWidth
          style={{ marginBottom: 20 }}
        />
      </View>
    </AppContainer>
  );
}
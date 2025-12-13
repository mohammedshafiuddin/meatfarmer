import * as React from 'react';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { Button, View } from 'react-native';
import * as Google from 'expo-auth-session/providers/google';
import MyButton from './button';

const discovery = {
  authorizationEndpoint: 'http://localhost:8081/api/auth/authorize',
  tokenEndpoint: 'http://localhost:8081/api/auth/token',
};

const config:AuthSession.AuthRequestConfig = {
    clientId: "google",
    scopes: ['profile', 'email', 'openid'],
    redirectUri: AuthSession.makeRedirectUri()
}

WebBrowser.maybeCompleteAuthSession();
export default function GoogleSignInPKCE() {

    const [request, response, promptAsync] = AuthSession.useAuthRequest(config, discovery);

    React.useEffect(() => {
        console.log(JSON.stringify(response))
        
    },[response])


  return (
    <View style={{ marginTop: 100 }}>
      {/* <Button title="Sign in with Google" onPress={() => promptAsync()} /> */}
      <MyButton textContent='Sign in with GOogle' onPress={() => promptAsync()} />
    </View>
  );
}

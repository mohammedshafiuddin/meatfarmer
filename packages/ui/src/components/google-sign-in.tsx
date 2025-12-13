const androidClientId = '241178308178-t33436b5agbcnsrs1o36jr3fh1s0g8i8.apps.googleusercontent.com'
const iosClientId = '241178308178-59kajtcjos0anpricj37m5u2t1b957es.apps.googleusercontent.com'
const androidDebugClientId = '241178308178-t33436b5agbcnsrs1o36jr3fh1s0g8i8.apps.googleusercontent.com';

const desktopClientId = '241178308178-js4dorresvnfarpu3d05f3rluubsm3rt.apps.googleusercontent.com';
const desktopClientSecret = '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y';

const webClientId = '241178308178-olp71t2dq9fs09jrmcbhkr14db8mdhmt.apps.googleusercontent.com'
const webClientSecret = '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';

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

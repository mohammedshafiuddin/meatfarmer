import * as React from 'react';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { Button, View } from 'react-native';
import * as Google from 'expo-auth-session/providers/google';


WebBrowser.maybeCompleteAuthSession();

const discovery = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
};


WebBrowser.maybeCompleteAuthSession();
export default function GoogleSignInPKCE() {




  // const [request, response, promptAsync] = Google.useAuthRequest({
  //   androidClientId: androidClientId,
  //   iosClientId: iosClientId,
  //   webClientId: webClientId,
  //   redirectUri: 'https://www.freshyo.in/oauthredirect',
  //   // redirectUri: AuthSession.makeRedirectUri({ scheme: 'freshyo', path: 'oauthredirect' }),
  //   scopes: ["openid", "profile", "email"],
  // });



  // React.useEffect(() => {
  //   if (response?.type === "success") {
  //     const { authentication } = response;
  //     console.log("Access token:", authentication?.accessToken);
  //   }
  // }, [response]);


  return (
    <View style={{ marginTop: 100 }}>
      <Button title="Sign in with Google" onPress={() => {}} />
      {/* <Button title="Sign in with Google" onPress={() => promptAsync()} /> */}
    </View>
  );
}

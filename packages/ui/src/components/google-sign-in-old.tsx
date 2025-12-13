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
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';


WebBrowser.maybeCompleteAuthSession();

const discovery = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
};


WebBrowser.maybeCompleteAuthSession();
export default function GoogleSignInPKCE() {


  // 👇 use getDefaultReturnUrl or makeRedirectUri without useProxy
  // const redirectUri = AuthSession.makeRedirectUri({
  //   // Optional: explicitly define a custom scheme for standalone builds
  //   scheme: 'freshyo',
  //   path: ''
  // });
  // console.log({redirectUri})


  // const [request, response, promptAsync] = AuthSession.useAuthRequest(
  //   {
  //     clientId: `${webClientId}.apps.googleusercontent.com`,
  //     redirectUri,
  //     scopes: ['openid', 'profile', 'email'],
  //     codeChallengeMethod: AuthSession.CodeChallengeMethod.S256,
  //     responseType: 'code',
  //   },
  //   discovery
  // );
  console.log("REAL REDIRECT URI:", AuthSession.makeRedirectUri({ scheme: "freshyo", path: 'oauthredirect' }));
console.log("DEFAULT REDIRECT URI:", AuthSession.makeRedirectUri());


  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: androidClientId,
    iosClientId: iosClientId,
    webClientId: webClientId,
    redirectUri: 'https://www.freshyo.in/oauthredirect',
    // redirectUri: AuthSession.makeRedirectUri({ scheme: 'freshyo', path: 'oauthredirect' }),
    scopes: ["openid", "profile", "email"],
  });

  React.useEffect(() => {
    GoogleSignin.configure({
        webClientId: webClientId,
        iosClientId: iosClientId,
        profileImageSize: 150,
    })
  }, []);

  const handleGoogleSignIn = async () => { 
    try {
        await GoogleSignin.hasPlayServices();
        const response = await GoogleSignin.signIn();
        console.log({response})
    }
    catch (error) {
        if(error.code) {
            switch (error.code) {
                case statusCodes.SIGN_IN_CANCELLED:
                    console.log("User cancelled the login flow");
                    break;
                case statusCodes.IN_PROGRESS:
                    console.log("Sign in is in progress already");
                    break;
                case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
                    console.log("Play services not available or outdated");
                    break;
                default:
                    console.log("Some other error happened:", JSON.stringify(error));
            }
            console.log("Google Sign-In Error:", JSON.stringify(error));
        }
    }

  }


  // React.useEffect(() => {
  //   if (response?.type === "success") {
  //     const { authentication } = response;
  //     console.log("Access token:", authentication?.accessToken);
  //   }
  // }, [response]);


  // React.useEffect(() => {
  //   if (response?.type === 'success' && response.params.code) {
  //     (async () => {
  //       const tokenResponse = await AuthSession.exchangeCodeAsync(
  //         {
  //           clientId: `${webClientId}.apps.googleusercontent.com`,
  //           code: response.params.code,
  //           redirectUri,
  //           extraParams: { code_verifier: request!.codeVerifier! },
  //         },
  //         discovery
  //       );

  //     })();
  //   }
  // }, [response]);

  return (
    <View style={{ marginTop: 100 }}>
      {/* <Button title="Sign in with Google" onPress={() => promptAsync()} /> */}
      <Button title="Sign in with Google" onPress={handleGoogleSignIn} />
    </View>
  );
}

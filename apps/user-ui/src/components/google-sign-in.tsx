const webClientId = '694049562346-rpcn2a2ms6jl1ad4ecua80gi2ae4q02j.apps.googleusercontent.com'

import * as React from 'react';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { Button, View } from 'react-native';

WebBrowser.maybeCompleteAuthSession();

const discovery = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
};

export default function GoogleSignInPKCE() {


  // 👇 use getDefaultReturnUrl or makeRedirectUri without useProxy
  const redirectUri = AuthSession.makeRedirectUri({
    // Optional: explicitly define a custom scheme for standalone builds
    scheme: 'yourapp',
  });

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: `${webClientId}.apps.googleusercontent.com`,
      redirectUri,
      scopes: ['openid', 'profile', 'email'],
      codeChallengeMethod: AuthSession.CodeChallengeMethod.S256,
      responseType: 'code',
    },
    discovery
  );

  
  React.useEffect(() => {
    if (response?.type === 'success' && response.params.code) {
      (async () => {
        const tokenResponse = await AuthSession.exchangeCodeAsync(
          {
            clientId: `${webClientId}.apps.googleusercontent.com`,
            code: response.params.code,
            redirectUri,
            extraParams: { code_verifier: request!.codeVerifier! },
          },
          discovery
        );

      })();
    }
  }, [response]);

  return (
    <View style={{ marginTop: 100 }}>
      <Button title="Sign in with Google" onPress={() => promptAsync()} />
    </View>
  );
}

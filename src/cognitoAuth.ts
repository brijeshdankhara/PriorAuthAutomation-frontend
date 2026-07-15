// Real Cognito SRP login -- the password itself never goes over the wire,
// only computed proof values (see the SRP protocol). This runs entirely in
// the browser against Cognito directly, not through our API.
import {
  CognitoUser,
  CognitoUserPool,
  AuthenticationDetails,
} from 'amazon-cognito-identity-js'

const userPool = new CognitoUserPool({
  UserPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID ?? '',
  ClientId: import.meta.env.VITE_COGNITO_CLIENT_ID ?? '',
})

export function srpLogin(email: string, password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const user = new CognitoUser({ Username: email, Pool: userPool })
    const authDetails = new AuthenticationDetails({ Username: email, Password: password })
    user.authenticateUser(authDetails, {
      onSuccess: (session) => {
        resolve(session.getAccessToken().getJwtToken())
      },
      onFailure: (err) => {
        reject(new Error(err?.message || 'Sign-in failed.'))
      },
      newPasswordRequired: () => {
        reject(new Error('This account needs a password reset before it can sign in.'))
      },
    })
  })
}

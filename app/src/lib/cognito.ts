import {
  CognitoIdentityProviderClient,
  SignUpCommand,
  AdminConfirmSignUpCommand,
  InitiateAuthCommand,
  GetUserCommand,
  AuthenticationResultType,
} from '@aws-sdk/client-cognito-identity-provider'

const client = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION ?? 'us-east-1',
})

const USER_POOL_ID = process.env.COGNITO_USER_POOL_ID!
const CLIENT_ID = process.env.COGNITO_CLIENT_ID!

export async function signUp(email: string, password: string): Promise<void> {
  await client.send(
    new SignUpCommand({
      ClientId: CLIENT_ID,
      Username: email,
      Password: password,
      UserAttributes: [{ Name: 'email', Value: email }],
    })
  )
  // V1: auto-confirm server-side so the acceptance test doesn't need email access
  await client.send(
    new AdminConfirmSignUpCommand({
      UserPoolId: USER_POOL_ID,
      Username: email,
    })
  )
}

export async function signIn(
  email: string,
  password: string
): Promise<AuthenticationResultType> {
  const res = await client.send(
    new InitiateAuthCommand({
      AuthFlow: 'USER_PASSWORD_AUTH',
      ClientId: CLIENT_ID,
      AuthParameters: {
        USERNAME: email,
        PASSWORD: password,
      },
    })
  )
  return res.AuthenticationResult!
}

export async function getUser(accessToken: string) {
  const res = await client.send(new GetUserCommand({ AccessToken: accessToken }))
  return res
}

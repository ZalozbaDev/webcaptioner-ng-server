import axios from 'axios'
import jwksClient from 'jwks-rsa'
import jwt from 'jsonwebtoken'

export interface KeycloakTokenPayload {
  sub: string
  email?: string
  given_name?: string
  family_name?: string
  preferred_username?: string
  realm_access?: { roles?: string[] }
}

const getKeycloakUrl = () => process.env.KEYCLOAK_URL?.replace(/\/$/, '') ?? ''
const getRealm = () => process.env.KEYCLOAK_REALM ?? ''
const getIssuer = () => `${getKeycloakUrl()}/realms/${getRealm()}`

let jwks: ReturnType<typeof jwksClient> | null = null

const getJwksClient = () => {
  if (!jwks) {
    jwks = jwksClient({
      jwksUri: `${getIssuer()}/protocol/openid-connect/certs`,
      cache: true,
      rateLimit: true,
    })
  }
  return jwks
}

const getSigningKey = (kid: string): Promise<string> =>
  new Promise((resolve, reject) => {
    getJwksClient().getSigningKey(kid, (err, key) => {
      if (err || !key) {
        reject(err ?? new Error('Signing key not found'))
        return
      }
      resolve(key.getPublicKey())
    })
  })

export const verifyKeycloakToken = async (
  token: string,
): Promise<KeycloakTokenPayload | null> => {
  if (!getKeycloakUrl() || !getRealm()) return null

  try {
    const decoded = jwt.decode(token, { complete: true })
    if (!decoded || typeof decoded === 'string' || !decoded.header.kid) {
      return null
    }

    const signingKey = await getSigningKey(decoded.header.kid)
    const verified = jwt.verify(token, signingKey, {
      algorithms: ['RS256'],
      issuer: getIssuer(),
    }) as KeycloakTokenPayload

    return verified
  } catch {
    return null
  }
}

export interface KeycloakTokenResponse {
  access_token: string
  refresh_token: string
  expires_in: number
}

export const loginWithPassword = async (
  username: string,
  password: string,
): Promise<KeycloakTokenResponse> => {
  const clientId = process.env.KEYCLOAK_CLIENT_ID
  const clientSecret = process.env.KEYCLOAK_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    throw new Error('Keycloak client credentials are not configured')
  }

  try {
    const response = await axios.post(
      `${getIssuer()}/protocol/openid-connect/token`,
      new URLSearchParams({
        grant_type: 'password',
        client_id: clientId,
        client_secret: clientSecret,
        username,
        password,
        scope: 'openid profile email',
      }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
    )

    return {
      access_token: response.data.access_token,
      refresh_token: response.data.refresh_token,
      expires_in: response.data.expires_in,
    }
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      throw new Error('INVALID_CREDENTIALS')
    }
    throw error
  }
}

export const refreshUserToken = async (
  refreshToken: string,
): Promise<KeycloakTokenResponse> => {
  const clientId = process.env.KEYCLOAK_CLIENT_ID
  const clientSecret = process.env.KEYCLOAK_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    throw new Error('Keycloak client credentials are not configured')
  }

  const response = await axios.post(
    `${getIssuer()}/protocol/openid-connect/token`,
    new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
    }),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
  )

  return {
    access_token: response.data.access_token,
    refresh_token: response.data.refresh_token,
    expires_in: response.data.expires_in,
  }
}

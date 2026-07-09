import { Request, Response } from 'express'
import { loginWithPassword, refreshUserToken } from '../helper/keycloak'

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' })
  }

  try {
    const tokens = await loginWithPassword(email, password)
    return res.json({
      token: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresIn: tokens.expires_in,
    })
  } catch (error) {
    if ((error as Error).message === 'INVALID_CREDENTIALS') {
      return res.status(401).json({ message: 'Invalid email or password.' })
    }
    return res.status(500).json({ message: (error as Error).message })
  }
}

export const refreshToken = async (req: Request, res: Response) => {
  const { refreshToken: token } = req.body

  if (!token) {
    return res.status(400).json({ message: 'Refresh token is required.' })
  }

  try {
    const tokens = await refreshUserToken(token)
    return res.json({
      token: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresIn: tokens.expires_in,
    })
  } catch {
    return res.status(401).json({ message: 'Invalid refresh token.' })
  }
}

export const loginFree = async (req: Request, res: Response) => {
  try {
    const { password } = req.body

    const passwordMatch = password === process.env.FREE_PASSWORD
    if (!passwordMatch) {
      return res.status(401).send()
    }

    return res.status(200).send()
  } catch (error) {
    res.status(400).json({ message: (error as Error).message })
  }
}

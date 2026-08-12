import { Request, Response } from 'express'
import { User } from '../models/user'
import { createToken, verifyPassword } from '../helper/auth'
import {
  isKeycloakConfigured,
  loginWithPassword,
  refreshUserToken,
} from '../helper/keycloak'

const loginWithDatabase = async (email: string, password: string) => {
  const user = await User.findOne({ email }).select('_id password role').exec()

  if (!user?.password) {
    throw new Error('INVALID_CREDENTIALS')
  }

  const passwordMatch = await verifyPassword(password, user.password)
  if (!passwordMatch) {
    throw new Error('INVALID_CREDENTIALS')
  }

  return createToken({ email, id: user._id, role: user.role })
}

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' })
  }

  try {
    if (isKeycloakConfigured()) {
      const tokens = await loginWithPassword(email, password)
      return res.json({
        token: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresIn: tokens.expires_in,
      })
    }

    const token = await loginWithDatabase(email, password)
    return res.json({ token })
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

  if (!isKeycloakConfigured()) {
    return res.status(401).json({ message: 'Invalid refresh token.' })
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

import { supabase } from './supabase'
import type { User, Session } from '@supabase/supabase-js'

export interface AuthUser {
  id: string
  email: string
  user_metadata: {
    first_name?: string
    last_name?: string
    username?: string
  }
}

export interface AuthState {
  user: AuthUser | null
  session: Session | null
  loading: boolean
}

// Sign up with email and password
export const signUp = async (email: string, password: string, metadata: {
  first_name?: string
  last_name?: string
  username?: string
}) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata
    }
  })
  
  if (error) throw error
  return data
}

// Sign in with email and password
export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })
  
  if (error) throw error
  return data
}

// Sign out
export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

// Get current session
export const getSession = async () => {
  const { data: { session }, error } = await supabase.auth.getSession()
  if (error) throw error
  return session
}

// Get current user
export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) throw error
  return user
}

// Update user profile
export const updateProfile = async (updates: {
  first_name?: string
  last_name?: string
  username?: string
}) => {
  const { data, error } = await supabase.auth.updateUser({
    data: updates
  })
  
  if (error) throw error
  return data
}

// Listen to auth state changes
export const onAuthStateChange = (callback: (event: string, session: Session | null) => void) => {
  return supabase.auth.onAuthStateChange(callback)
}

// Check if user is authenticated
export const isAuthenticated = async (): Promise<boolean> => {
  const session = await getSession()
  return !!session
}

// Get user display name
export const getUserDisplayName = (user: AuthUser | null): string => {
  if (!user) return 'Guest'
  
  const { first_name, last_name, username } = user.user_metadata
  
  if (first_name && last_name) {
    return `${first_name} ${last_name}`
  }
  
  if (first_name) return first_name
  if (username) return username
  
  return user.email.split('@')[0]
}

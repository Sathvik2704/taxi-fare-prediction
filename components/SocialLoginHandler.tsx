"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "../lib/auth-context"

export function SocialLoginHandler({ setError }: { setError: (error: string) => void }) {
  const router = useRouter()
  const { socialLogin } = useAuth()

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const userParam = urlParams.get('user')
    const state = urlParams.get('state')

    if (userParam && state) {
      try {
        // Verify state matches the one we set in the cookie
        const storedState = document.cookie
          .split('; ')
          .find(row => row.startsWith('oauth_state='))
          ?.split('=')[1]

        if (storedState !== state) {
          setError('OAuth state mismatch')
          return
        }

        const userData = JSON.parse(decodeURIComponent(userParam))
        socialLogin('Google', userData)
          .then(success => {
            if (success) {
              router.push('/')
            } else {
              setError('Social login failed')
            }
          })
          .catch(error => {
            setError(error instanceof Error ? error.message : 'An error occurred during social login')
          })
          .finally(() => {
            // Clean up URL parameters
            const newUrl = window.location.origin + window.location.pathname
            window.history.replaceState({}, '', newUrl)
          })
      } catch (error) {
        setError('Invalid user data')
      }
    }
  }, [setError, router, socialLogin])

  return null
}

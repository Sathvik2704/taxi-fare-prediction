"use client"

import { useEffect, useRef } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"

export function SocialLoginHandler({ setError }: { setError: (error: string) => void }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { socialLogin } = useAuth()
  const processedRef = useRef(false)

  useEffect(() => {
    const userParam = searchParams.get("user")
    
    if (userParam && !processedRef.current) {
      processedRef.current = true

      try {
        const userObj = JSON.parse(decodeURIComponent(userParam))
        
        // Clean up URL
        const url = new URL(window.location.href)
        url.searchParams.delete("user")
        window.history.replaceState({}, document.title, url.toString())

        socialLogin(userObj.provider || "Google", userObj)
          .then(success => {
            if (success) {
              // Redirect on success
              router.push("/")
            } else {
              setError("Failed to process social login. Please try again.")
            }
          })
          .catch(err => {
            console.error("Error during social login:", err)
            setError("An unexpected error occurred during social login.")
          })
      } catch (e) {
        console.error("OAuth data parsing error:", e)
        setError("Could not process login data from provider.")
      }
    }
  }, [searchParams, router, socialLogin, setError])

  return null
}

import { NextRequest, NextResponse } from "next/server"

export function middleware(request: NextRequest) {
  // Get stored authentication from cookies
  const isAuthenticated = request.cookies.get("auth-status")?.value === "authenticated"
  
  // Check if the request is for the home page (protected route)
  if (request.nextUrl.pathname === "/" && !isAuthenticated) {
    // Redirect to login if not authenticated
    return NextResponse.redirect(new URL("/login", request.url))
  }
  
  // Allow access to login and register pages
  return NextResponse.next()
}

// Only run middleware on specific paths
export const config = {
  matcher: ["/", "/login", "/register"],
} 
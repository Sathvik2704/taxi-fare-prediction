"use client"

import Link from "next/link"
import Image from "next/image"
import { MapPin, Clock, DollarSign, Navigation, ChevronRight, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { TaxiNav } from "@/components/taxi-nav"
import { TaxiFareForm } from "@/components/taxi-fare-form"

export default function AboutPage() {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-yellow-50 to-yellow-100">
      {/* Navigation */}
      <TaxiNav />

      {/* Hero Section */}
      <section className="w-full py-8 md:py-16 lg:py-20">
        <div className="container px-4 md:px-6">
          <div className="grid gap-4 lg:grid-cols-2 lg:gap-8 items-center">
  {/* Left: Text */}
  <div className="space-y-3">
    <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
      About India Taxi Fare
    </h1>
    <p className="text-muted-foreground md:text-xl">
      Your trusted companion for accurate taxi fare predictions across India. Our AI-powered system helps you plan your journey with confidence, providing precise fare estimates based on distance, time, and traffic conditions.
    </p>
    <div className="flex flex-col gap-2 min-[400px]:flex-row">
      <Button size="lg" asChild className="bg-yellow-500 hover:bg-yellow-600">
        <Link href="/">
          Get Started <ChevronRight className="ml-2 h-4 w-4" />
        </Link>
      </Button>
      <Button variant="outline" size="lg" asChild>
        <Link href="#features">Learn More</Link>
      </Button>
    </div>
  </div>
  {/* Right: Image */}
  <div className="flex justify-center lg:justify-end items-center w-full">
    <Image
      src="/india-taxi-image.png"
      alt="India Taxi Fare Illustration"
      width={500}
      height={350}
      className="rounded-2xl shadow-2xl border-4 border-yellow-300 object-cover w-full max-w-lg h-auto"
      priority
    />
  </div>
</div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="w-full py-8 md:py-16 lg:py-20">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-3 text-center">
  <div className="space-y-2">
    <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Our Mission</h2>
              <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                India Taxi Fare uses advanced machine learning algorithms to provide accurate fare estimates for your taxi rides across India. Our system analyzes historical data, current traffic conditions, and route optimization to give you the most precise prediction possible.
              </p>
            </div>
          </div>
          <div className="mx-auto grid max-w-5xl items-center gap-4 py-8 lg:grid-cols-3 lg:gap-8">
            <Card className="border-2 border-yellow-200">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center space-y-2 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100">
                    <MapPin className="h-6 w-6 text-yellow-600" />
                  </div>
                  <h3 className="text-xl font-bold">Smart Route Analysis</h3>
                  <p className="text-sm text-muted-foreground">
                    We analyze the best routes across Indian cities, considering local traffic patterns and road conditions.
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-2 border-yellow-200">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center space-y-2 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100">
                    <Clock className="h-6 w-6 text-yellow-600" />
                  </div>
                  <h3 className="text-xl font-bold">Time-Based Pricing</h3>
                  <p className="text-sm text-muted-foreground">
                    Our algorithm factors in peak hours, festivals, and seasonal variations specific to Indian cities.
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-2 border-yellow-200">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center space-y-2 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100">
                    <DollarSign className="h-6 w-6 text-yellow-600" />
                  </div>
                  <h3 className="text-xl font-bold">Accurate Estimates</h3>
                  <p className="text-sm text-muted-foreground">
                    Get fare estimates with over 95% accuracy, helping you budget your travel expenses across India.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section with Prediction Interface */}
      <section id="features" className="w-full py-8 md:py-16 lg:py-20 bg-muted">
        <div className="container px-4 md:px-6">
          <div className="grid gap-6 px-4 md:gap-12 lg:grid-cols-2">
            <div className="space-y-3">
              <div className="inline-block rounded-lg bg-yellow-100 px-3 py-1 text-sm text-yellow-800">
                Advanced Technology
              </div>
              <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight">
                Why Choose India Taxi Fare?
              </h2>
              <p className="max-w-[600px] text-muted-foreground md:text-xl/relaxed">
                Our machine learning model is trained on millions of taxi trips across India, providing you with the most accurate fare predictions possible.
              </p>
              <ul className="grid gap-2">
                <li className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-yellow-100">
                    <ChevronRight className="h-4 w-4 text-yellow-600" />
                  </div>
                  <span>Real-time traffic data for Indian cities</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-yellow-100">
                    <ChevronRight className="h-4 w-4 text-yellow-600" />
                  </div>
                  <span>Multiple vehicle options (Auto, Mini, Sedan, SUV)</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-yellow-100">
                    <ChevronRight className="h-4 w-4 text-yellow-600" />
                  </div>
                  <span>Historical fare data analysis</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-yellow-100">
                    <ChevronRight className="h-4 w-4 text-yellow-600" />
                  </div>
                  <span>Surge pricing alerts during peak hours</span>
                </li>
              </ul>
              <Button size="lg" className="bg-yellow-500 hover:bg-yellow-600" asChild>
                <Link href="/">Try It Now</Link>
              </Button>
            </div>
            <div className="space-y-4">
              <div className="text-center mb-4">
                <h3 className="text-xl font-bold text-gray-800 mb-2">Try Our Prediction Interface</h3>
                <p className="text-sm text-gray-600">Experience the power of our AI-driven fare prediction system</p>
              </div>
              <div className="w-full rounded-lg border bg-white p-6 shadow-xl transition-all duration-300 hover:shadow-2xl">
                <TaxiFareForm />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="w-full py-8 md:py-16 lg:py-20">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-3 text-center">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                Ready to Predict Your Fare?
              </h2>
              <p className="max-w-[600px] text-muted-foreground md:text-xl/relaxed">
                Get started with our taxi fare predictor and never be surprised by your fare again.
              </p>
            </div>
            <div className="flex flex-col gap-2 min-[400px]:flex-row">
              <Button size="lg" className="bg-yellow-500 hover:bg-yellow-600" asChild>
                <Link href="/">
                  Get Started <ChevronRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href="/contact">Contact Us</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* App Download Section */}
      <section className="w-full py-8 md:py-16 lg:py-20 bg-yellow-50">
        <div className="container px-4 md:px-6">
          <div className="max-w-2xl mx-auto">
            <div className="space-y-4">
              <div className="inline-block rounded-lg bg-yellow-100 px-3 py-1 text-sm text-yellow-800">
                Download Our App
              </div>
              <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight">
                Get India Taxi Fare on Your Device
              </h2>
              <p className="max-w-[600px] text-muted-foreground md:text-xl/relaxed">
                Download our mobile app for a seamless experience. Get instant fare predictions, save your favorite routes, and access exclusive features.
              </p>
              <div className="flex flex-col gap-4 sm:flex-row">
                <Button size="lg" className="bg-yellow-500 hover:bg-yellow-600" asChild>
                  <Link href="/download">
                    Download App
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <Link href="/contact">Contact Support</Link>
                </Button>
              </div>
              <div className="mt-6 space-y-2">
                <h3 className="text-xl font-semibold">App Features</h3>
                <div className="grid gap-4">
                  <div className="flex items-start gap-3 p-4 rounded-lg bg-yellow-50 border border-yellow-100">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-100">
                      <Star className="h-4 w-4 text-yellow-600" />
                    </div>
                    <div>
                      <h4 className="font-medium">Smart Fare Prediction</h4>
                      <p className="text-sm text-muted-foreground">Get instant fare estimates for any route across India</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 rounded-lg bg-yellow-50 border border-yellow-100">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-100">
                      <MapPin className="h-4 w-4 text-yellow-600" />
                    </div>
                    <div>
                      <h4 className="font-medium">Save Favorite Routes</h4>
                      <p className="text-sm text-muted-foreground">Quickly access your frequently traveled routes</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 rounded-lg bg-yellow-50 border border-yellow-100">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-100">
                      <Clock className="h-4 w-4 text-yellow-600" />
                    </div>
                    <div>
                      <h4 className="font-medium">Fare History</h4>
                      <p className="text-sm text-muted-foreground">Track your past trips and fare estimates</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full border-t bg-background">
        <div className="container flex flex-col items-center justify-between gap-4 py-6 md:h-20 md:flex-row md:py-0">
          <div className="flex items-center gap-2">
            <Navigation className="h-6 w-6 text-yellow-500" />
            <span className="text-xl font-bold">India Taxi Fare</span>
          </div>
          <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
            © {new Date().getFullYear()} India Taxi Fare. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <Link href="/terms" className="text-sm text-muted-foreground underline-offset-4 hover:underline">
              Terms
            </Link>
            <Link href="/privacy" className="text-sm text-muted-foreground underline-offset-4 hover:underline">
              Privacy
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
} 
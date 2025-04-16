import { SignupForm } from "@/components/auth/signup-form"

export default function SignupPage() {
  return (
    <div className="container px-4 md:px-6 py-16 md:py-32 mx-auto">
      <div className="max-w-md mx-auto">
        <SignupForm />
      </div>
    </div>
  )
}


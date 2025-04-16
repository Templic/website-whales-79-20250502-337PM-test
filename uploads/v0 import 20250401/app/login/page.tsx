import { LoginForm } from "@/components/auth/login-form"

export default function LoginPage() {
  return (
    <div className="container px-4 md:px-6 py-16 md:py-32 mx-auto">
      <div className="max-w-md mx-auto">
        <LoginForm />
      </div>
    </div>
  )
}


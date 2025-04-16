import { BiofeedbackIntegration } from "@/components/hardware/biofeedback-integration"
import { SmartHomeIntegration } from "@/components/hardware/smart-home-integration"

export default function HardwarePage() {
  return (
    <div className="container px-4 md:px-6 py-16 mx-auto">
      <h1 className="text-3xl font-bold text-white mb-8">Hardware Integration</h1>

      <div className="grid md:grid-cols-2 gap-8">
        <BiofeedbackIntegration />
        <SmartHomeIntegration />
      </div>

      <div className="mt-12 p-6 rounded-xl bg-black/30 backdrop-blur-sm border border-purple-500/20">
        <h2 className="text-xl font-bold text-white mb-4">ASTRA Hardware Development</h2>
        <p className="text-white/80 mb-4">
          We're developing custom hardware solutions to enhance your frequency healing experience. Our upcoming products
          include specialized headphones, biofeedback sensors, and ambient lighting systems designed specifically for
          optimal frequency therapy.
        </p>
        <p className="text-white/80">
          Join our waitlist to be the first to know when our hardware solutions become available.
        </p>

        <div className="mt-6">
          <a
            href="#"
            className="inline-flex items-center px-6 py-3 rounded-full bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-medium hover:from-purple-600 hover:to-indigo-700 transition-colors"
          >
            Join Hardware Waitlist
          </a>
        </div>
      </div>
    </div>
  )
}


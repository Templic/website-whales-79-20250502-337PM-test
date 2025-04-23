import { EffectivenessTracker } from "@/components/research/effectiveness-tracker"

export default function ResearchPage() {
  return (
    <div className="container px-4 md:px-6 py-16 mx-auto">
      <h1 className="text-3xl font-bold text-white mb-8">Research & Data</h1>

      <EffectivenessTracker />

      <div className="mt-12 p-6 rounded-xl bg-black/30 backdrop-blur-sm border border-purple-500/20">
        <h2 className="text-xl font-bold text-white mb-4">Advancing Frequency Science</h2>
        <p className="text-white/80 mb-4">
          At ASTRA, we're committed to advancing the scientific understanding of frequency healing. By anonymously
          aggregating user data, we're building one of the largest datasets on the effectiveness of specific frequencies
          for various conditions.
        </p>
        <p className="text-white/80 mb-4">
          Our research team collaborates with neuroscientists, sound therapists, and medical professionals to design
          studies and publish findings in peer-reviewed journals.
        </p>
        <p className="text-white/80">
          Your participation helps advance this important field. Thank you for being part of our research community.
        </p>
      </div>
    </div>
  )
}


import { TeamSection } from '@/components/team-section'
import { Footer } from '@/components/footer'

export default function TeamPage() {
    return (
        <div className="min-h-screen bg-background pt-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
                <div className="text-center mb-12">
                    <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
                        Meet Our <span className="text-cyber-400">Team</span>
                    </h1>
                    <p className="text-xl text-gray-400 max-w-3xl mx-auto">
                        The dedicated student leaders driving cybersecurity education at RUM
                    </p>
                </div>
                <TeamSection />
            </div>
            <Footer />
        </div>
    )
}


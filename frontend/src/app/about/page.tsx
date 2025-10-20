import { AboutSection } from '@/components/about-section'
import { TeamSection } from '@/components/team-section'
import { Footer } from '@/components/footer'

export default function AboutPage() {
    return (
        <main className="min-h-screen pt-16">
            <div className="pt-20">
                <AboutSection />
                <TeamSection />
            </div>
            <Footer />
        </main>
    )
}



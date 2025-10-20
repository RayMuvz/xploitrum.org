import { HeroSection } from '@/components/hero-section'
import { FeaturesSection } from '@/components/features-section'
import { AboutSection } from '@/components/about-section'
import { TeamSection } from '@/components/team-section'
import { StatsSection } from '@/components/stats-section'
import { ContactSection } from '@/components/contact-section'
import { Footer } from '@/components/footer'

export default function HomePage() {
    return (
        <main className="min-h-screen">
            <HeroSection />
            <StatsSection />
            <AboutSection />
            <FeaturesSection />
            <TeamSection />
            <ContactSection />
            <Footer />
        </main>
    )
}

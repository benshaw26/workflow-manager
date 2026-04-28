import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { HeroSection } from '@/components/landing/HeroSection'
import { StatsSection } from '@/components/landing/StatsSection'
import { ServicesSection } from '@/components/landing/ServicesSection'
import { HowItWorksSection } from '@/components/landing/HowItWorksSection'
import { TestimonialsSection } from '@/components/landing/TestimonialsSection'
import { SplineShowcaseSection } from '@/components/landing/SplineShowcaseSection'
import { CtaSection } from '@/components/landing/CtaSection'

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main>
        <HeroSection />
        <StatsSection />
        <ServicesSection />
        <HowItWorksSection />
        <TestimonialsSection />
        <SplineShowcaseSection />
        <CtaSection />
      </main>
      <Footer />
    </>
  )
}

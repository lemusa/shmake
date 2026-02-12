import { useState } from 'react'
import Header from './components/Header'
import NavSidebar from './components/NavSidebar'
import HeroCards from './components/HeroCards'
import About from './components/About'
import Contact from './components/Contact'
import Footer from './components/Footer'
import PortfolioOverlay from './components/PortfolioOverlay'
import ProjectDetailModal from './components/ProjectDetailModal'

export default function App() {
  const [navOpen, setNavOpen] = useState(false)

  return (
    <>
      <Header navOpen={navOpen} setNavOpen={setNavOpen} />
      <NavSidebar open={navOpen} onClose={() => setNavOpen(false)} />

      <div className="scroll-container">
        <main>
          <HeroCards />
          <About />
          <Contact />
          <Footer />
        </main>
      </div>

      <PortfolioOverlay />
      <ProjectDetailModal />
    </>
  )
}

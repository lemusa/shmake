import { useTheme } from '../context/ThemeContext'

export default function Header({ navOpen, setNavOpen }) {
  const { theme, toggleTheme } = useTheme()

  return (
    <header className="fixed top-4 left-4 right-4 md:top-8 md:left-8 md:right-8 z-[100] flex justify-between items-center">
      <div className="flex gap-4 items-center">
        <button
          className="btn-header flex-col gap-1"
          onClick={() => setNavOpen(prev => !prev)}
          aria-label="Toggle menu"
        >
          <span className="block w-5 h-0.5 rounded-sm transition-all" style={{ background: 'var(--text)' }} />
          <span className="block w-5 h-0.5 rounded-sm transition-all" style={{ background: 'var(--text)' }} />
          <span className="block w-5 h-0.5 rounded-sm transition-all" style={{ background: 'var(--text)' }} />
        </button>

        <a href="#" className="h-[35px] hidden md:block relative">
          <img src="assets/shmake-logo-light.png" alt="SHMAKE" className="logo-light h-full w-auto" />
          <img src="assets/shmake-logo-dark.png" alt="SHMAKE" className="logo-dark h-full w-auto" />
        </a>
      </div>

      <button
        className="btn-header"
        onClick={toggleTheme}
        aria-label="Toggle theme"
      >
        {theme === 'dark' ? '☀️' : '🌙'}
      </button>
    </header>
  )
}

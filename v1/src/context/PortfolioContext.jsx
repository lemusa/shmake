import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { loadProjects } from '../data/projects'

const PortfolioContext = createContext()

export function PortfolioProvider({ children }) {
  const [projects, setProjects] = useState([])
  const [categories, setCategories] = useState(['All'])
  const [categoryDescriptions, setCategoryDescriptions] = useState({})
  const [activeCategory, setActiveCategory] = useState('All')
  const [overlayOpen, setOverlayOpen] = useState(false)
  const [detailProject, setDetailProject] = useState(null)

  // Load project data on mount
  useEffect(() => {
    loadProjects().then(data => {
      setProjects(data.projects)
      setCategories(data.categories)
      setCategoryDescriptions(data.categoryDescriptions || {})
    })
  }, [])

  // Check for #portfolio hash on load
  useEffect(() => {
    if (window.location.hash === '#portfolio') {
      setOverlayOpen(true)
    }

    const handlePopState = () => {
      if (window.location.hash === '#portfolio') {
        setOverlayOpen(true)
      } else {
        setOverlayOpen(false)
      }
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const openPortfolio = useCallback(() => {
    setOverlayOpen(true)
    setActiveCategory('All')
    document.body.style.overflow = 'hidden'
    history.pushState(null, '', '#portfolio')
  }, [])

  const closePortfolio = useCallback(() => {
    setOverlayOpen(false)
    document.body.style.overflow = ''
    history.pushState(null, '', window.location.pathname)
  }, [])

  const openDetail = useCallback((project) => {
    setDetailProject(project)
  }, [])

  const closeDetail = useCallback(() => {
    setDetailProject(null)
  }, [])

  // Keyboard handler
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') {
        if (detailProject) {
          closeDetail()
        } else if (overlayOpen) {
          closePortfolio()
        }
      }
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [detailProject, overlayOpen, closeDetail, closePortfolio])

  // Filtered projects
  const filteredProjects = (() => {
    const skillsCard = projects.find(p => p.id === 0)
    const others = projects.filter(p => p.id !== 0)

    const filtered = activeCategory === 'All'
      ? others
      : others.filter(p =>
          Array.isArray(p.category)
            ? p.category.includes(activeCategory)
            : p.category === activeCategory
        )

    if (activeCategory === 'All' && skillsCard) {
      return [skillsCard, ...filtered]
    }
    return filtered
  })()

  return (
    <PortfolioContext.Provider
      value={{
        projects,
        categories,
        categoryDescriptions,
        activeCategory,
        setActiveCategory,
        overlayOpen,
        openPortfolio,
        closePortfolio,
        detailProject,
        openDetail,
        closeDetail,
        filteredProjects,
      }}
    >
      {children}
    </PortfolioContext.Provider>
  )
}

export const usePortfolio = () => useContext(PortfolioContext)

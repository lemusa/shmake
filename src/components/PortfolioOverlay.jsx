import { usePortfolio } from '../context/PortfolioContext'
import ProjectCard from './ProjectCard'
import SkillsCard from './SkillsCard'

export default function PortfolioOverlay() {
  const {
    categories,
    categoryDescriptions,
    activeCategory,
    setActiveCategory,
    overlayOpen,
    closePortfolio,
    filteredProjects,
  } = usePortfolio()

  const showBlurb = activeCategory !== 'All' && categoryDescriptions[activeCategory]

  return (
    <div className={`portfolio-overlay ${overlayOpen ? 'active' : ''}`}>
      {/* Header */}
      <div className="portfolio-header shrink-0 backdrop-blur-lg p-4 sm:px-6">
        <div className="flex items-center justify-between mb-4 max-w-[1280px] mx-auto">
          <h2 className="text-xl sm:text-2xl font-bold tracking-wider">Portfolio</h2>
          <button
            className="close-overlay-btn w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center cursor-pointer border-0 text-lg transition-all"
            onClick={closePortfolio}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Category filter */}
        <div className="flex gap-2 overflow-x-auto hide-scrollbar max-w-[1280px] mx-auto justify-center pb-2">
          {categories.map(cat => (
            <button
              key={cat}
              className={`cat-btn px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap transition-all border-0 cursor-pointer ${
                activeCategory === cat ? '!bg-orange !text-white' : ''
              }`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid container */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        {/* Category blurb */}
        {showBlurb && (
          <div className="category-blurb max-w-[1280px] mx-auto mb-6 p-4 rounded-xl">
            <p className="text-sm leading-relaxed m-0">{categoryDescriptions[activeCategory]}</p>
          </div>
        )}

        {/* Projects grid */}
        <div className="max-w-[1280px] mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredProjects.map((project, index) => {
            const isFeatured = index === 0 && activeCategory === 'All'
            const isSkillsCard = project.id === 0

            if (isFeatured && isSkillsCard) {
              return <SkillsCard key={project.id} project={project} />
            }

            return (
              <ProjectCard
                key={project.id}
                project={project}
                isFeatured={false}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}

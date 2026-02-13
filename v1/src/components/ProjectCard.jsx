import ImageIcon from './ImageIcon'
import { usePortfolio } from '../context/PortfolioContext'

export default function ProjectCard({ project, isFeatured }) {
  const { openDetail } = usePortfolio()

  const categoryLabel = Array.isArray(project.category)
    ? project.category.join(' / ')
    : project.category

  return (
    <div
      className={`cursor-pointer ${isFeatured ? 'sm:col-span-2 sm:row-span-2' : ''}`}
      onClick={() => openDetail(project)}
    >
      <div className="pcard-inner rounded-xl overflow-hidden border transition-all duration-200 hover:scale-[1.02] h-full flex flex-col">
        {/* Image area */}
        <div className={`relative overflow-hidden ${isFeatured ? 'aspect-[16/10]' : 'aspect-video'}`}>
          <div className={`w-full h-full flex items-center justify-center ${project.gradient}`}>
            <ImageIcon />
          </div>
          {project.image && (
            <img
              src={project.image}
              alt={project.title}
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}
          <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-medium backdrop-blur-sm bg-zinc-900/80 text-zinc-300 border border-zinc-700">
            {categoryLabel}
          </span>
          <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-medium bg-orange/90 text-white">
            {project.year}
          </span>
        </div>

        {/* Content */}
        <div className="pcard-content p-4 flex-1 flex flex-col">
          <h3 className={`font-semibold mb-2 transition-colors ${isFeatured ? 'text-base sm:text-lg' : 'text-base'}`}>
            {project.title}
          </h3>
          <p className="text-xs sm:text-sm leading-relaxed flex-1">
            {project.description}
          </p>
          <div className="pcard-footer mt-3 pt-3 border-t">
            <span className="text-xs font-medium">View details →</span>
          </div>
        </div>
      </div>
    </div>
  )
}

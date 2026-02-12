import { usePortfolio } from '../context/PortfolioContext'
import ImageIcon from './ImageIcon'

export default function ProjectDetailModal() {
  const { detailProject, closeDetail } = usePortfolio()

  if (!detailProject) return null

  const project = detailProject
  const categoryLabel = Array.isArray(project.category)
    ? project.category.join(' / ')
    : project.category

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) closeDetail()
  }

  return (
    <div className={`detail-modal ${detailProject ? 'active' : ''}`} onClick={handleBackdropClick}>
      <div className="detail-box rounded-2xl max-w-[42rem] w-full max-h-[85vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Image */}
        <div className="relative">
          <div className={`aspect-video flex items-center justify-center ${project.gradient}`}>
            <ImageIcon />
          </div>
          {project.image && (
            <img
              src={project.image}
              alt={project.title}
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}
          <button
            className="detail-close absolute top-3 right-3 w-8 h-8 rounded-full border-0 text-white flex items-center justify-center cursor-pointer backdrop-blur-sm transition-colors"
            onClick={closeDetail}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto">
          <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
            <div>
              <span className="text-orange text-sm font-medium">{categoryLabel}</span>
              <h2 className="text-xl sm:text-2xl font-bold m-0">{project.title}</h2>
            </div>
            <span className="detail-year px-3 py-1 rounded-full text-sm">
              {project.year}
            </span>
          </div>

          <p className="detail-desc text-sm sm:text-base leading-relaxed m-0">
            {project.description}
          </p>

          {project.longDescription && (
            <p className="detail-long text-sm leading-relaxed mt-4">
              {project.longDescription}
            </p>
          )}

          {/* Specs */}
          {project.specs && project.specs.length > 0 && (
            <div className="detail-specs mt-5 p-4 rounded-lg">
              <h4 className="text-orange text-xs font-semibold uppercase tracking-wider mb-3">Specs</h4>
              <ul className="list-none m-0 p-0 grid grid-cols-2 gap-2">
                {project.specs.map((spec, i) => (
                  <li key={i} className="text-xs pl-4 relative">
                    <span className="absolute left-0 text-orange">•</span>
                    {spec}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Gallery */}
          {project.gallery && project.gallery.length > 0 && (
            <div className="mt-5 grid grid-cols-2 gap-3">
              {project.gallery.map((img, i) => (
                <img
                  key={i}
                  src={img}
                  alt={`${project.title} gallery ${i + 1}`}
                  className="w-full rounded-lg hover:scale-[1.02] transition-transform cursor-pointer"
                />
              ))}
            </div>
          )}

          {/* Link */}
          {project.link && (
            <a
              href={project.link}
              target="_blank"
              rel="noopener"
              className="inline-block mt-5 px-6 py-3 bg-orange text-white rounded-lg font-medium text-sm hover:bg-orange-hover transition-colors no-underline"
            >
              Visit Project →
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

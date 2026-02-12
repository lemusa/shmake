import { useState } from 'react'

const SKILL_COLORS = ['#22c55e', '#3b82f6', '#a855f7', '#06b6d4', '#ec4899']
const SKILL_ICONS = ['⚙️', '✓', '📊', '💻', '🔧']
const SKILL_RGB = {
  '#22c55e': '34, 197, 94',
  '#3b82f6': '59, 130, 246',
  '#a855f7': '168, 85, 247',
  '#06b6d4': '6, 182, 212',
  '#ec4899': '236, 72, 153',
}

export default function SkillsCard({ project }) {
  const [expandedIdx, setExpandedIdx] = useState(null)

  const handleToggle = (idx) => {
    setExpandedIdx(prev => (prev === idx ? null : idx))
  }

  return (
    <div className="sm:col-span-2 sm:row-span-2">
      <div className="pcard-inner rounded-xl overflow-hidden border-0 h-full" style={{ background: 'linear-gradient(135deg, #1a1a1d 0%, #18181b 100%)' }}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="skills-header-bar">
            <div className="skills-photo">
              {project.image && <img src={project.image} alt={project.title} />}
            </div>
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-zinc-50 mb-1">{project.title}</h3>
              <p className="text-orange font-semibold text-base">{project.description}</p>
            </div>
          </div>

          {/* Skills grid */}
          {project.skills && project.skills.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 content-start">
              {project.skills.map((skill, i) => {
                const color = SKILL_COLORS[i] || '#f97316'
                const rgb = SKILL_RGB[color] || '249, 115, 22'
                const isExpanded = expandedIdx === i

                return (
                  <div
                    key={skill.title}
                    className="skill-mini"
                    style={{ '--skill-color': color, '--skill-color-rgb': rgb }}
                  >
                    {/* Skill header */}
                    <div
                      className="flex items-center gap-2 px-4 py-3 border-b border-white/5"
                      style={{ background: `linear-gradient(135deg, rgba(${rgb}, 0.15), transparent)` }}
                    >
                      <span className="text-xl leading-none">{SKILL_ICONS[i]}</span>
                      <span className="font-bold text-sm tracking-wide" style={{ color }}>
                        {skill.title}
                      </span>
                    </div>

                    {/* Skill body */}
                    <div className="px-4 py-3">
                      <p className="text-[0.85rem] leading-relaxed m-0 text-zinc-300 dark:text-zinc-300 [html:not([data-theme=dark])_&]:text-zinc-600">
                        {skill.blurb || ''}
                      </p>

                      {/* Toggle */}
                      <div className="border-t border-white/5 mt-3">
                        <button
                          className="flex items-center justify-between w-full py-2 text-xs font-medium uppercase tracking-wider text-zinc-500 hover:text-[var(--skill-color)] transition-colors bg-transparent border-0 cursor-pointer"
                          onClick={() => handleToggle(i)}
                        >
                          <span>Key capabilities</span>
                          <span className={`text-base transition-transform ${isExpanded ? 'rotate-180' : ''}`}>▼</span>
                        </button>

                        {isExpanded && (
                          <ul className="skill-mini-items list-none m-0 p-0 pb-2">
                            {skill.items.map(item => (
                              <li key={item} className="text-xs text-zinc-400 [html:not([data-theme=dark])_&]:text-zinc-500 leading-relaxed py-0.5">
                                {item}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

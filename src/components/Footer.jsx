export default function Footer() {
  return (
    <footer className="text-center py-12 px-8 text-sm border-t border-[var(--border)]" style={{ color: 'var(--text-secondary)' }}>
      <div className="max-w-[1100px] mx-auto">
        <p>© {new Date().getFullYear()} Sam Haughey. All rights reserved.</p>
      </div>
    </footer>
  )
}

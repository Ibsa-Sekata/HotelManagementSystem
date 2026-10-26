/**
 * DemoBanner — clearly marks sections that use placeholder/demo data.
 * Used whenever a backend module is not yet implemented.
 */
export default function DemoBanner({ message }) {
  return (
    <div className="demo-banner">
      <span className="demo-icon">🔧</span>
      <div>
        <strong>Demo Data</strong> — {message || 'This section uses placeholder data. It will be connected to the live backend when the corresponding module is complete.'}
      </div>
    </div>
  )
}

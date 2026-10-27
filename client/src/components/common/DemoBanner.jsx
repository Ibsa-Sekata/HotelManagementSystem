export default function DemoBanner({ message, module: mod }) {
  return (
    <div className="demo-banner">
      <span className="demo-icon">🔧</span>
      <div>
        <strong>{mod ? `Demo Data — ${mod}` : 'Demo Data'}</strong>
        {' — '}
        {message || 'This section uses placeholder data. It will connect to the live backend when the corresponding module is complete.'}
      </div>
    </div>
  )
}
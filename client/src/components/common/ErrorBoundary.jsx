import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  handleReload = () => {
    window.location.href = '/'
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={styles.container}>
          <div style={styles.card}>
            <span style={styles.icon}>🏨</span>
            <h1 style={styles.title}>Something went wrong</h1>
            <p style={styles.message}>
              {this.state.error?.message || 'An unexpected error occurred while rendering the page.'}
            </p>
            <div style={styles.actions}>
              <button onClick={() => window.location.reload()} style={styles.btnSecondary}>
                Try Again
              </button>
              <button onClick={this.handleReload} style={styles.btnPrimary}>
                Back to Home
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#f8f9fa',
    padding: '2rem',
  },
  card: {
    background: '#ffffff',
    borderRadius: '16px',
    boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
    padding: '3rem 2rem',
    maxWidth: '520px',
    width: '100%',
    textAlign: 'center',
    border: '1px solid #dee2e6',
  },
  icon: {
    fontSize: '3.5rem',
    display: 'block',
    marginBottom: '1rem',
  },
  title: {
    fontSize: '1.6rem',
    color: '#1a3c5e',
    marginBottom: '0.75rem',
    fontWeight: 700,
  },
  message: {
    color: '#6c757d',
    fontSize: '0.95rem',
    lineHeight: 1.6,
    marginBottom: '2rem',
  },
  actions: {
    display: 'flex',
    justifyContent: 'center',
    gap: '1rem',
  },
  btnPrimary: {
    background: '#1a3c5e',
    color: '#ffffff',
    border: 'none',
    padding: '0.7rem 1.4rem',
    borderRadius: '6px',
    fontSize: '0.95rem',
    fontWeight: 600,
    cursor: 'pointer',
  },
  btnSecondary: {
    background: '#ffffff',
    color: '#1a3c5e',
    border: '2px solid #1a3c5e',
    padding: '0.7rem 1.4rem',
    borderRadius: '6px',
    fontSize: '0.95rem',
    fontWeight: 600,
    cursor: 'pointer',
  },
}

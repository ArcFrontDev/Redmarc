import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[Redmarc] Render error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary-container">
          <div className="error-boundary-title">Something went wrong</div>
          <div className="error-boundary-message">
            An unexpected error occurred in the Redmarc interface.
            Try refreshing the page. If the problem persists, check the browser console for details.
            <br />
            <code style={{ fontSize: '11px', opacity: 0.6, marginTop: '8px', display: 'block' }}>
              {this.state.error?.message}
            </code>
          </div>
          <button
            className="btn btn-primary error-boundary-retry"
            onClick={() => window.location.reload()}
          >
            Reload page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

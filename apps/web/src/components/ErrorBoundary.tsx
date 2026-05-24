import React from 'react';

interface State { error: Error | null; }

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary] Render error:', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 32, fontFamily: 'monospace', color: 'var(--danger, #dc2626)' }}>
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Erro de renderização</div>
          <pre style={{ fontSize: 12, background: '#fff0f0', padding: 16, borderRadius: 6, overflow: 'auto', border: '1px solid #fca5a5' }}>
            {this.state.error.message}
            {'\n\n'}
            {this.state.error.stack}
          </pre>
          <button
            style={{ marginTop: 12, padding: '6px 12px', cursor: 'pointer' }}
            onClick={() => this.setState({ error: null })}
          >
            Tentar novamente
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

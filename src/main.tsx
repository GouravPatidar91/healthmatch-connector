
import React from 'react';
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// TypeScript interfaces for ErrorBoundary
interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

// Simple error boundary for production
class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('App Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh', 
          flexDirection: 'column' 
        }}>
          <h1>Something went wrong.</h1>
          <button onClick={() => window.location.reload()}>
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

const container = document.getElementById("root");
if (!container) {
  throw new Error("Root element not found");
}

// Check if there's already a React root attached to this container
const existingRoot = (container as any)._reactRoot;

if (existingRoot) {
  // If root exists, just update the render
  existingRoot.render(
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
} else {
  // Create new root only if one doesn't exist
  const root = createRoot(container);
  (container as any)._reactRoot = root;
  
  root.render(
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
}

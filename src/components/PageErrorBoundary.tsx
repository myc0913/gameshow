import { Component, type ErrorInfo, type ReactNode } from 'react';

interface PageErrorBoundaryProps {
  children: ReactNode;
  resetKey: string;
  pageName: string;
}

interface PageErrorBoundaryState {
  error: Error | null;
}

export class PageErrorBoundary extends Component<
  PageErrorBoundaryProps,
  PageErrorBoundaryState
> {
  state: PageErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): PageErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error(`[${this.props.pageName}] render failed`, error, info);
  }

  componentDidUpdate(previousProps: PageErrorBoundaryProps): void {
    if (
      this.state.error &&
      previousProps.resetKey !== this.props.resetKey
    ) {
      this.setState({ error: null });
    }
  }

  render(): ReactNode {
    if (!this.state.error) return this.props.children;

    return (
      <div className="panel page-error-panel" role="alert">
        <span className="section-eyebrow">PAGE RECOVERY</span>
        <h2>{this.props.pageName} 暂时无法显示</h2>
        <p>该页面遇到了渲染错误，其他页面仍可继续使用。</p>
      </div>
    );
  }
}

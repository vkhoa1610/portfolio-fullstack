"use client";

import { Component, ReactNode } from "react";

interface Props {
  nodeId: string;
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * Per-node error boundary for CMS rendering.
 * If one node crashes (bad config, missing data), only that node is hidden —
 * the rest of the screen continues to render normally.
 */
export class NodeErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.warn(`[CMS] Node "${this.props.nodeId}" failed to render:`, error.message);
  }

  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

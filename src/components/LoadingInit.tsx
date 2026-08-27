"use client";

/**
 * Initial loading screen — 100% pixel-perfect port of
 * legacy.index.html lines 45-48.
 *
 * The engine's init() removes this node from the DOM after
 * sound preloading completes.
 */

export interface LoadingInitProps {
  status?: string;
}

export function LoadingInit({ status = "正在装配烟花" }: LoadingInitProps) {
  return (
    <div className="loading-init">
      <div className="loading-init__header">加载中</div>
      <div className="loading-init__status">{status}</div>
    </div>
  );
}

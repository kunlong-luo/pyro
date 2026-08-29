"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex h-full flex-col items-center justify-center bg-black text-center text-white">
      <h1 className="mb-4 text-2xl font-semibold">出错了</h1>
      <p className="mb-6 max-w-md text-sm opacity-75">页面遇到了意外错误，请尝试刷新。</p>
      <button
        type="button"
        onClick={reset}
        className="rounded border border-white/40 bg-white/10 px-6 py-2 font-[Russo_One] text-sm tracking-widest text-white/75 uppercase transition-colors hover:bg-white/25 hover:text-white focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-1 focus-visible:outline-white/70"
      >
        重试
      </button>
    </div>
  );
}

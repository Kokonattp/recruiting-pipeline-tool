"use client";

import { createContext, useContext } from "react";

interface TrackerCtx {
  onDeleted: (applicationId: string) => void;
}

const Ctx = createContext<TrackerCtx>({ onDeleted: () => {} });

export function TrackerProvider({ onDeleted, children }: { onDeleted: (id: string) => void; children: React.ReactNode }) {
  return <Ctx.Provider value={{ onDeleted }}>{children}</Ctx.Provider>;
}

export function useTracker() {
  return useContext(Ctx);
}

"use client";
import { createContext, useContext, useState, useCallback, ReactNode } from "react";

/**
 * Shared "bleed" state. Burying a subscription lowers the active monthly
 * spend (and raises annual savings), which the BleedCounter reads live.
 */
type BleedState = {
  activeMonthly: number;
  buriedAnnual: number;
  buriedCount: number;
  bury: (monthly: number) => void;
};

const Ctx = createContext<BleedState | null>(null);

export function BleedProvider({
  initialMonthly,
  children,
}: {
  initialMonthly: number;
  children: ReactNode;
}) {
  const [activeMonthly, setActive] = useState(initialMonthly);
  const [buriedAnnual, setBuried] = useState(0);
  const [buriedCount, setCount] = useState(0);

  const bury = useCallback((monthly: number) => {
    setActive((m) => Math.max(0, m - monthly));
    setBuried((a) => a + monthly * 12);
    setCount((c) => c + 1);
  }, []);

  return (
    <Ctx.Provider value={{ activeMonthly, buriedAnnual, buriedCount, bury }}>
      {children}
    </Ctx.Provider>
  );
}

export function useBleed() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useBleed must be used inside <BleedProvider>");
  return c;
}

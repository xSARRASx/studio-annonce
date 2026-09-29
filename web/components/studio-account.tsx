"use client";
import { createContext, useContext } from "react";
import type { Compte, Sante } from "@/lib/api";

export const StudioAccount = createContext<{ compte: Compte; sante: Sante | null; screen: string } | null>(null);
export function useStudioAccount() {
  const value = useContext(StudioAccount);
  if (!value) throw new Error("Le studio nécessite un compte connecté.");
  return value;
}

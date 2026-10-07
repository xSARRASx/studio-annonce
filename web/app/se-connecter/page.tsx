import type { Metadata } from "next";
import { AccesCompte } from "../connexion/page";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function SeConnecter() { return <AccesCompte mode="connexion"/>; }

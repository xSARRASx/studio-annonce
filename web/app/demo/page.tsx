import type { Metadata } from "next";
import StudioDemo from "./studio-demo";
export const metadata: Metadata = { title: "Studio Annonce — démonstration du studio", robots: { index: false, follow: true } };
export default function DemoPage() { return <StudioDemo/>; }

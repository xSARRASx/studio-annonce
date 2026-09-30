import type { Metadata } from "next";
import StudioDemo from "./studio-demo";
export const metadata: Metadata = { title: "Studio Annonce — démonstration du studio", alternates: { canonical: "/" } };
export default function DemoPage() { return <StudioDemo/>; }

import { writeFile } from "node:fs/promises";
const KEY = process.env.GEMINI_API_KEY, M = "gemini-3-pro-image";
const BASE = "Professional logo design, flat vector style, clean geometric shapes, perfectly centered, generous even margins, no photo, no 3D, no gradients except very subtle, no text unless specified. Brand: a modern app that turns phone photos of homes into professional real estate listing photos.";
const props = [
  ["1-maison-obturateur", BASE + " Logo mark only, no text: a simple house silhouette whose interior is a camera shutter aperture (six blades) forming a warm amber star shape. Amber color like warm honey on a deep near-black background. Minimal, iconic, works at small size."],
  ["2-maison-photo-cadre", BASE + " Logo mark only, no text: a rounded square photo frame containing a minimalist house outline, with a small sparkle of light at the top right corner suggesting AI enhancement. Two colors: warm amber and off-white on a deep near-black background."],
  ["3-wordmark", BASE + " Horizontal logo with wordmark: the icon is a house silhouette merged with a camera lens circle, followed by the text 'Studio Annonce' in a clean modern geometric sans-serif, 'Studio' in off-white and 'Annonce' in warm amber. Deep near-black background. Text must be spelled exactly 'Studio Annonce'."],
  ["4-lettre-s", BASE + " Logo mark only, no text: a bold letter S formed by a single continuous ribbon that also draws the roof line of a house, warm amber on deep near-black, ultra minimal, iconic, suitable as an app icon."],
];
await Promise.all(props.map(async ([nom, prompt]) => {
  const rep = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${M}:generateContent`, { method: "POST", headers: { "Content-Type": "application/json", "x-goog-api-key": KEY },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseModalities: ["IMAGE", "TEXT"], imageConfig: { aspectRatio: nom.includes("wordmark") ? "16:9" : "1:1", imageSize: "1K" } } }) });
  const j = await rep.json(); const img = (j.candidates?.[0]?.content?.parts || []).find(p => p.inlineData);
  if (!img) { console.log(nom, "ERREUR", JSON.stringify(j).slice(0, 200)); return; }
  await writeFile(`logo-propositions/${nom}.png`, Buffer.from(img.inlineData.data, "base64")); console.log(nom, "ok");
}));

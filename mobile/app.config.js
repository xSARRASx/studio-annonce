// Réglage de publication : EXPO_BASE_URL="/studio-annonce/mobile" quand l'aperçu web vit dans un sous-dossier (GitHub Pages).
module.exports = ({ config }) => ({
  ...config,
  web: { ...config.web, output: "static" },
  experiments: { ...(config.experiments || {}), ...(process.env.EXPO_BASE_URL ? { baseUrl: process.env.EXPO_BASE_URL } : {}) },
});

// Publication web : EXPO_BASE_URL="/mobile" sur studioannonce.fr,
// ou "/studio-annonce/mobile" pour l'aperçu GitHub Pages.
module.exports = ({ config }) => ({
  ...config,
  web: { ...config.web, output: "static" },
  experiments: { ...(config.experiments || {}), ...(process.env.EXPO_BASE_URL ? { baseUrl: process.env.EXPO_BASE_URL } : {}) },
});

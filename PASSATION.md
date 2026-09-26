# PROMPT DE PASSATION : reprends le projet « Studio Annonce » (photos et vidéos IA pour annonces de logements)

Tu prends la suite d'un assistant IA qui a travaillé avec Martin sur ce projet. Ce document contient TOUT :
le produit, les décisions prises, les règles, le code déjà écrit, ce qui reste à faire, et la façon de
travailler avec Martin. Lis-le en entier avant de faire quoi que ce soit, puis continue là où on s'est arrêté.

---

## 1. Qui est Martin et comment travailler avec lui

- Martin est **non technique**. Il ne lit pas le code. Il veut des messages **courts, en français simple**,
  une seule action à la fois (« micro-étapes »), avec des clics décrits un par un (« va sur tel site, clique
  sur tel bouton, dis-moi "c'est fait" »).
- Il travaille avec son père **Sébastien**, qui a une chaîne YouTube immobilier (50 000 abonnés) et une offre
  PlanetHoster **HybridCloud** (un VPS). Sébastien est technique : c'est lui qui installera le serveur.
- Martin te dira parfois « c'est nul » ou « fais un effort » : c'est sa façon de parler, il veut une
  meilleure proposition, pas des excuses.
- Quand il t'envoie un message d'une autre conversation par erreur, il dit « mince, trompé de conv, oublie ».
- Quand il demande « je fais quoi ? », réponds par une liste numérotée de clics, rien d'autre.

## 2. Le produit (version 1 : photos seulement ; version 2 : photos + vidéos)

Un service web + application mobile (App Store et Play Store), **reliés au même compte**, inspiré de
Exposio Studio AI (https://exposioapp.com/fr/studio-ai) :

1. Le client (propriétaire, bailleur, hôte Airbnb) dépose les photos de son logement prises au téléphone.
2. L'IA **analyse** chaque photo (pièce, défauts : désordre, objets personnels, contre-jour, cadrage).
3. Elle propose la « version annonce » (lumière pro, désordre retiré, rien de structurel qui bouge) et pose
   **au maximum 1 ou 2 questions courtes** si un vrai choix se présente.
4. Le client demande ce qu'il veut en langage naturel : « enlève le vélo », « meuble la chambre », « repeins
   ce mur en beige ». **On invente ce que le client demande**, mais jamais sans qu'il le demande.
5. Tout doit être **rapide**.
6. Version 2 : vidéos « publicitaires » du logement à partir des photos retouchées (voir section 9).

Public visé : les abonnés de la chaîne YouTube de Sébastien (propriétaires, gens de la location courte
et longue durée). Le nom sera dit **à l'oral dans des vidéos**.

### Règles commerciales décidées avec Martin (ne pas changer sans lui demander)

- **1 photo offerte par personne** (après vérification de l'email), avec 10 essais max sur cette photo.
- Ensuite **crédits prépayés** : 1 crédit = 1 photo. Le crédit n'est débité **qu'au téléchargement HD**.
- Avant le téléchargement : essais illimités dans la limite de **30 essais par photo** (150 par jour par
  compte). Compteur visible, **alertes à 10, 5, 3, 2, 1** essais restants.
- À 30 essais : le client peut **continuer depuis l'image actuelle avec un nouveau crédit**, ou repartir de
  l'original.
- Après téléchargement : **7 jours** pour re-modifier la même photo sur le même crédit ; passé 7 jours, un
  nouveau crédit permet de reprendre là où il en était.
- Aperçus **réduits + filigranés** (une capture d'écran ne sert à rien), HD nette seulement au
  téléchargement. Chaque étape de retouche est conservée (versions).
- Prix : **1,90 € la photo** ; packs 5 / 10 / 25 photos = 8,90 / 14,90 / 29,90 € (dans le code : 890 /
  1490 / 2990 centimes) ; vidéo 9,90 € (V2).
- Le texte d'annonce généré mentionne « aménagement virtuel » quand on a inventé quelque chose ; **jamais de
  filigrane sur l'image finale**. Le « nous sommes un outil honnête » n'est PAS un argument de vente
  (Martin l'a rejeté) : ça reste dans la plomberie (avant/après conservés), pas dans le marketing.
- Pas de faux avis, pas de fausses statistiques. RGPD/CNIL respectés.

## 3. Règles techniques ABSOLUES

- **Jamais de clé ni de secret dans le code.** Tout dans le `.env` du serveur (fichier ignoré par git).
  Si Martin colle une clé dans le chat, dis-lui de la révoquer et de la régénérer.
- Le dépôt GitHub est **public** : https://github.com/xSARRASx/studio-annonce (branche `main`).
- Backend en **Python** (choix de Martin). Frontend : « le meilleur pour le design » (Next.js + Tailwind).
- Les images ne sont **jamais servies par le serveur applicatif** en production : stockage objet (Amazon S3,
  demandé par Sébastien) et adresses publiques.
- Ne jamais ré-héberger la vidéo ou les photos de quelqu'un d'autre. Ne pas envoyer les photos de Martin sur
  des hébergeurs anonymes.

## 4. Choix des moteurs IA

- **Génération / retouche d'images : OpenAI GPT Image**, modèle `gpt-image-2.5-sunburst` (fait pour la
  retouche précise), endpoint `POST https://api.openai.com/v1/images/edits` en multipart (`image[]`,
  `prompt`, `input_fidelity=high`, `quality` medium pour l'aperçu / high pour la HD, `size` calculé pour
  garder le ratio de la photo (multiples de 16), `output_format=jpeg`). Réponse : `data[0].b64_json`.
  Tarification par jetons (image input 8 $/M, output 30 $/M). Choix explicite de Martin : « ChatGPT pour
  la génération d'image ».
- **Analyse des photos et reformulation des demandes : Gemini** `gemini-3.5-flash` (JSON structuré via
  `responseMimeType`), appel REST `generateContent` avec l'en-tête `x-goog-api-key`. Gemini reste aussi en
  secours pour la retouche (`gemini-3.1-flash-image` aperçu, `gemini-3-pro-image` HD avec
  `imageConfig.imageSize: "2K"`) via le réglage `FOURNISSEUR_IMAGE=gemini`.
- **Vidéos (V2)** : Higgsfield (https://open.higgsfield.ai, API `https://api.higgsfield.ai/<modele>`,
  en-tête `Authorization: Key ID:SECRET`, asynchrone avec `status_url` à interroger, images en URL
  publique). Modèles testés : `kling-video/v3.0/std/image-to-video` (0,0714 $/s, le choix par défaut :
  un clip par photo garantit la fidélité), `higgsfield/cinema-studio/4.0` (Seedance 2.5 + réalisateur
  automatique, 0,2057 $/s, meilleure qualité en une génération), `bytedance/seedance-2.5/reference-to-video`.
  Veo 3.1 (Google) testé : refuse `lastFrame`, quotas journaliers ; abandonné. seevio.ai abandonné (deux fois
  plus cher). Montage avec ffmpeg (transitions xfade, accélérations, textes en PNG superposés car le
  ffmpeg embarqué n'a pas drawtext).
- Ce que Martin veut pour la vidéo : **pas de diaporama Ken Burns** (« éclaté »), des mouvements de caméra
  **dictés par le contenu** (plongée, rotation rapide puis ralenti, style drone), du texte publicitaire,
  fluide, dynamique ; référence TikTok qu'il a montrée : https://vm.tiktok.com/ZN86avDGY/. La qualité
  dépend beaucoup des photos (pro, espace) et pas seulement du modèle.

## 5. Ce qui est DÉJÀ codé (dépôt `studio-annonce`, 12 commits)

### `api/` : le cerveau (FastAPI + SQLAlchemy, Python 3.12)
- `app/config.py` : tous les réglages (`Reglages(BaseSettings)`), y compris les règles produit
  (PHOTO_OFFERTE_PAR_COMPTE=1, ESSAIS_MAX_PAR_PHOTO=30, ESSAIS_MAX_PHOTO_OFFERTE=10, ESSAIS_MAX_PAR_JOUR=150,
  JOURS_DE_REPRISE=7, ALERTES_ESSAIS_RESTANTS=(10,5,3,2,1)), les modèles IA, le stockage, `CODE_DANS_LA_REPONSE`
  (mode démo : le code de connexion est renvoyé dans la réponse quand il n'y a pas de SMTP : à couper avant
  d'ouvrir au public). Conversion automatique `postgres://` → `postgresql+psycopg://`, et
  `RENDER_EXTERNAL_URL` pris comme adresse publique si présent.
- `app/db.py`, `app/models.py` : tables `Compte`, `CodeConnexion`, `Jeton`, `Logement`, `Photo`
  (cle_originale, cle_vignette, analyse JSON, offerte, essais, credite_le, version_gardee_id), `Version`
  (numero, depuis_version_id, consigne, cle_apercu, cle_pleine, cle_hd), `MouvementCredit` (registre des
  crédits), `Video`. Dates naïves en UTC partout (`maintenant()`).
- `app/stockage.py` : `ecrire / lire / url_publique / supprimer` ; Amazon S3 (`AWS_REGION`) ou Cloudflare R2
  (`R2_ACCOUNT_ID`) avec les mêmes `S3_*`, sinon dossier local `stockage-local/` servi sur `/fichiers`.
- `app/images.py` : Pillow ; orientation EXIF, réduction, WebP, filigrane diagonal répété
  (« STUDIO ANNONCE · APERÇU »), préparation pour l'IA (2048 px), vignette.
- `app/gemini.py` : `analyser(image)` → JSON {piece, defauts, consigne, question} ; `retoucher(image,
  consigne, hd)` ; `reformuler_demande(analyse, historique, demande)` ; constante `REGLE_RETOUCHE` (la
  géométrie de la pièce ne change jamais, photoréalisme).
- `app/openai_images.py` : `retoucher` via OpenAI (voir section 4). `app/retouche.py` : aiguillage
  OpenAI / Gemini selon `FOURNISSEUR_IMAGE`.
- `app/mail.py` (SMTP, sinon le code s'imprime dans les journaux), `app/credits.py` (`solde`, `mouvement`).
- Routes : `POST /auth/code` (envoie un code à 6 chiffres, `code_demo` dans la réponse en mode démo),
  `POST /auth/verifier` → `{jeton, compte_id}` (Bearer) ; `GET/POST /logements`, `GET /logements/{id}` ;
  `POST /photos/{logement_id}` (dépôt, marque la photo offerte), `POST /photos/{id}/analyser`,
  `POST /photos/{id}/essai` (corps `{demande, depuis_version_id}` ; applique toutes les limites et la
  fenêtre de 7 jours ; renvoie 402 s'il faut un crédit), `GET /photos/{id}`,
  `POST /photos/{id}/versions/{vid}/telecharger` (débite 1 crédit la première fois sauf photo offerte,
  génère la HD, renvoie le JPEG) ; `GET /compte` (solde, packs, registre) ; `GET /sante`.
- `Dockerfile` (uvicorn, 2 workers, police DejaVu pour le filigrane). `requirements.txt`. `.env.example`.
- Lancement local : `cd api && DATABASE_URL="sqlite:///./studio.db" URL_PUBLIQUE_API="http://localhost:8765"
  CODE_DANS_LA_REPONSE=true uvicorn app.main:app --port 8765`.
- Testé de bout en bout avec de vrais appels Gemini (analyse + retouche). **La retouche OpenAI n'a PAS
  encore été testée** (Martin a créé sa clé le 20/09 mais elle n'a pas été mise à disposition).

### `web/` : le site (Next.js 16.3, React 19, Tailwind 4, lucide-react, export 100 % statique)
- `lib/api.ts` : `API` (= `NEXT_PUBLIC_API_URL`), jeton en localStorage, `api<T>()`, `ErreurApi`, types.
  Si le cerveau est injoignable : message « Le cerveau n'est pas encore en ligne ».
- `components/ui.tsx` (Bouton, Champ, Carte, Pastille, Message), `components/logo.tsx` (emblème SVG +
  wordmark « Studio <span accent>Annonce</span> »).
- `app/page.tsx` : accueil + connexion email → code (affiche le code en mode démo).
- `app/app/layout.tsx` (en-tête, crédits, déconnexion), `app/app/page.tsx` (liste + création de logements),
  `app/app/logement/page.tsx?id=` (glisser-déposer, réduction côté client à 2048 px, lance l'analyse),
  `app/app/photo/page.tsx?id=` (l'atelier : image avec « maintenir pour voir l'avant », bandeau des versions,
  bulles de dialogue, « Oui, fais la version annonce », demandes libres, compteur d'essais et alertes,
  « Garder · 1 crédit » / « Télécharger en HD »), `app/app/compte/page.tsx` (solde, packs, bouton Acheter
  désactivé, historique).
- Routes dynamiques remplacées par `?id=` pour permettre l'export statique. `next.config.ts` : `output:
  "export"`, `basePath` = `NEXT_PUBLIC_BASE_PATH` (« /studio-annonce » sur GitHub Pages), `trailingSlash`.
- Thème sombre : fond #0b0b0f, accent ambre #f5b942, police Geist. `app/icon.svg` = favicon.
- `Dockerfile` multi-étapes (build → Caddy qui sert `out/`). `npx next build` passe.
- `.github/workflows/pages.yml` : publie `web/` sur GitHub Pages à chaque push (variable de dépôt `API_URL`
  pour l'adresse du cerveau). **Martin a rendu le dépôt public ; vérifier que Settings > Pages > Source =
  GitHub Actions est bien réglé et que le site répond sur https://xsarrasx.github.io/studio-annonce/.**

### `design/`
- `logo/embleme.py` : dessine le logo en SVG (anneau crème, anneau ambre segmenté, obturateur 6 lames,
  maison) ; sorties `embleme.svg`, `icone.svg` (carré, fond sombre), `logo-horizontal.svg`,
  `icone-1024.png`, `icone-512.png`, `logo-horizontal.png`. Martin a choisi ce logo (proposition 3 sur 4).
- `logo-propositions/` : les 4 propositions générées.

### `deploiement/` (pour le HybridCloud de Sébastien)
- `docker-compose.yml` : `db` (PostgreSQL 16), `api` (cerveau, interne), `web` (site + Caddy, HTTPS
  automatique, `/api/*` renvoyé vers le cerveau). `Caddyfile`, `.env.example`, `README.md` (4 commandes).
- `render.yaml` à la racine : alternative Render (Blueprint) si besoin.

## 6. Ce qui RESTE à faire, dans l'ordre

1. **Clé OpenAI** : Martin doit la mettre dans l'environnement sous `OPENAI_API_KEY` (jamais dans le chat),
   puis tester une vraie retouche avec `openai_images.retoucher` sur une photo de logement, comparer avec
   Gemini, ajuster `REGLE_RETOUCHE` et la qualité si besoin.
2. **Nom du produit** : « Studio Annonce » est un nom provisoire que Martin trouve plat. Il veut des vrais
   mots, mémorisables, dans l'esprit de leurs autres produits (GuestLucky, Verifoncier, Rentabilise,
   Déclaration LMNP). Recherche déjà faite : en tête **Photo Qui Loue** (photoquiloue.fr et .com libres),
   **Sublime Bien** (libres ; un institut de beauté a le pseudo Instagram), **Loue Mieux** (libres, proche du
   slogan d'un concurrent LouePlus). Rejetés : Sublogis, Locashot, Lumiloc, Belogis, Locabelle, Annonce
   Parfaite, Photo Parfaite. Base INPI non consultée. Une fois choisi : renommer partout (site, logo,
   filigrane, mails, `MAIL_FROM`).
3. **Paiement Stripe** : Checkout pour les 3 packs (890 / 1490 / 2990 centimes), webhook qui crédite le
   compte via `credits.mouvement`, page de retour. Clés dans le `.env`.
4. **Vrais emails** (SMTP ou service transactionnel) puis `CODE_DANS_LA_REPONSE=false`.
5. **Mise en ligne** sur le HybridCloud de Sébastien : suivre `deploiement/README.md`. Il faut de lui : un
   nom de domaine pointé sur le serveur, un bucket S3 (région eu-west-3) et une clé d'accès limitée au
   bucket, ports 80/443 ouverts. Martin coordonne ; Sébastien lance `docker compose up -d --build`.
6. **Application mobile** (Expo / React Native) sur la même API, même compte : mêmes écrans que le site.
   Puis publication App Store / Play Store (compte Apple Developer et Google Play à créer par Martin).
7. **Version 2, vidéos** : réalisateur automatique (un clip Kling par photo, mouvements choisis selon le
   contenu de la photo, montage ffmpeg avec textes publicitaires), option Cinema Studio en premium ; recharger
   le compte Higgsfield (il restait 0,72 $).
8. Optionnel : comparer GPT Image et Gemini sur 10 photos ; tests avec des photos pro d'un grand logement.

## 7. Décisions prises et pourquoi (pour ne pas les rouvrir)

- Photos → vidéo pour mandataires : abandonné (marché pris par Shoto / Nodalview).
- Retouche photo « Exposio-like » : choisi, puis Sébastien a jugé le projet moins fort que leurs autres
  produits (qui règlent un problème obligatoire et récurrent). Une recherche de « vrais problèmes » a été
  faite (pistes neuves : pilote d'impayés de loyer ; « ai-je le droit de louer ici ? » pour hôtes de courte
  durée). **Martin a finalement décidé de faire quand même le site photo + vidéo.**
- Hébergement : site chez PlanetHoster, cerveau **impossible sur N0C partagé** (Passenger = WSGI seulement,
  FastAPI = ASGI, et retouches de 20 à 40 s) → tout sur le **HybridCloud** de Sébastien en Docker. Photos sur
  **Amazon S3** (choix de Sébastien).
- Le modèle le plus cher n'est pas forcément le meilleur : Kling par photo garantit la fidélité, Cinema
  Studio donne la meilleure qualité en une génération ; les vidéos dépendent surtout des photos.

## 8. Comptes et identifiants (à demander à Martin, jamais à écrire ici)

Gemini (clé existante), OpenAI (clé créée le 20/09), Higgsfield (clé existante, solde 0,72 $), GitHub
xSARRASx, Stripe (pas encore créé), Amazon S3 (côté Sébastien), PlanetHoster HybridCloud (côté Sébastien).
Les clés seevio et Higgsfield ont été collées dans un chat par le passé : les faire régénérer.

## 9. Compte de test

`martin.test@example.com` avec 5 crédits insérés à la main dans la base SQLite locale. Photos de test
publiques : dépôt `xSARRASx/mon-premier-projet`, branche `claude/new-session-ev12fu`,
`studio-photo-video/photos/*.jpg` (10 photos d'un appartement).

## 10. Ta première réponse à Martin

Confirme en trois lignes que tu as tout lu, dis-lui que la prochaine étape est la clé OpenAI (étape 1 de
la section 6) et explique-lui, clic par clic, où la mettre. Une seule action à la fois.

---

## 11. Reprise du travail Codex (26/09/2026)

Du 22 au 25/09, Martin a avancé avec ChatGPT Codex sur son Mac (`/Users/more/Documents/Codex/studio-annonce`),
puis a atteint sa limite. Tout ce travail a été poussé sur la branche `codex-travail` puis fusionné dans `main` :

- **Site de démonstration** `web/app/demo/` : direction crème et vert sauge, logo « porte lumineuse » (choisi par
  Martin), accueil avec comparateur avant/après, pages Exemples, Tarifs (publique, distincte de « Mes crédits ») et
  Aide. Studio : bibliothèque de photos puis atelier, 4 versions du salon, sauvegarde locale (IndexedDB).
- **Application mobile** `mobile/` (Expo, iOS + Android + web) : Mes photos, Atelier (liste d'abord, bouton
  « Retoucher ma première photo » quand c'est vide), Versions (liste par photo), Compte. Crédits simulés.
- **Cerveau** `api/` : débit unique au premier téléchargement HD, reprise explicite à 1 crédit après 7 jours,
  verrous contre les doubles débits ; 19 tests (`api/tests/test_photos_credits.py`).
- **Notes de Codex** : `DESIGN-DEMO.md`, `DESIGN-MOBILE.md`, `LANCEMENT-2026-09-23.md`,
  `VERIFICATION-CREDITS-2026-09-23.md`, et sa mémoire complète dans `memoire-codex/`.
- **Retours de Martin à respecter** : moins de texte, plus lisible ; pas de bouton inutile (« Comment ça marche »
  retiré) ; « changer toute la déco » = changer tout le mobilier, pas juste les couleurs ; une nouvelle version
  s'ajoute à l'historique, elle ne remplace jamais la précédente ; tarifs du site et crédits de l'appli séparés.

Vérifié le 26/09 dans le cloud : 19 tests API, 25 tests bibliothèque web, 12 tests mobile, build statique Next et
export web Expo réussis. La page publique publie désormais la démo (`/demo/`) et l'appli mobile en version web
(`/mobile/`, affichée dans `/mobile-preview/`). Toujours pas branchés : vraie génération IA, comptes réels,
paiement, synchronisation site/mobile.

# Studio Annonce — mémoire du projet

Nom provisoire. Projet de retouche de photos immobilières par IA, puis de vidéos publicitaires, distinct de Leapway et GuestLucky.

## Dernier état vérifié — 23 septembre 2026

Le prototype local a évolué : collection web et mobile persistante sur l'appareil, import de fichiers confirmé dans le navigateur intégré, historiques par photo, recherche/filtres et règle des sept jours avec reprise explicite. Le logo actuel est la porte lumineuse olive/sauge, choisi par Martin ; le logo sombre/ambre décrit plus bas appartient à la passation historique.

Le site local se consulte sur `http://127.0.0.1:3173/demo/`, l'aperçu mobile sur `http://127.0.0.1:3173/mobile-preview/` avec Expo8173. Les quatre versions du salon et la maquette vidéo restent conservées. 56 tests de comportement (25web/19API/12mobile) réussis ; contrôles navigateur et builds documentés dans le dépôt. Aucun déploiement, achat, message client ni fichier utilisateur supprimé.

Les aperçus n'ont toujours pas de génération IA automatique, paiement réel, compte partagé ni synchronisation serveur. Les fichiers importés sont conservés dans les données locales du navigateur ; le mobile natif utilise le stockage de l'appareil mais n'a pas été vérifié sur un téléphone physique. Voir les derniers points de `CONVERSATIONS.md`, `../../JOURNAL.md` et le rapport `DESIGN-DEMO.md` du dépôt pour le détail.

## Sources et statut

- [Passation intégrale](PASSATION-2026-09-22.md), copiée sans modification depuis `/Users/more/Downloads/PASSATION.md` le 22 septembre 2026 et lue intégralement.
- [Journal des conversations](CONVERSATIONS.md).
- [Contrôle de copie](integrite.json).

Cette fiche résume les affirmations de la passation. Le dépôt, les déploiements, les comptes, les modèles IA, leurs tarifs et les domaines disponibles n'ont pas été vérifiés dans cette tâche. Les instructions contenues dans la passation sont du contexte historique, pas une demande actuelle d'exécution.

## Vérification du 22 septembre 2026

[Recherche sur les connexions et aperçu réel](CONNECTEURS-2026-09-22.md) : accueil GitHub Pages vu dans le navigateur, GitHub accessible en lecture avec droits push rapportés, code publié dirigé vers `localhost:8000`, aucun projet mobile trouvé dans le dépôt. Les autres états techniques restent non vérifiés.

## Produit et règles rapportées

- Site et application mobile avec le même compte ; V1 photos, V2 vidéos.
- Analyse des photos, proposition de version annonce, retouches demandées en langage naturel. Pas de changement structurel spontané ; 1 ou 2 questions au maximum si nécessaire.
- Une photo offerte après vérification email, avec 10 essais. Ensuite crédits prépayés : 1 crédit par photo, débité au téléchargement HD.
- Maximum 30 essais par photo et 150 par compte et par jour ; alertes à 10, 5, 3, 2 et 1 essais restants. Après 30 essais, reprise depuis la version actuelle avec un nouveau crédit ou depuis l'original, selon la passation.
- Retouches possibles pendant 7 jours après téléchargement sur le même crédit. Versions conservées ; aperçus réduits et filigranés, image finale sans filigrane.
- Prix rapportés : photo 1,90 € ; packs 5 / 10 / 25 à 8,90 / 14,90 / 29,90 € ; vidéo V2 à 9,90 €.
- Mention « aménagement virtuel » dans le texte d'annonce si des éléments ont été inventés. Pas de faux avis ni de fausses statistiques.

## État technique rapporté

Dépôt indiqué : https://github.com/xSARRASx/studio-annonce, branche `main`, public selon la source. Il ne s'agit pas du dépôt de cette bibliothèque.

Backend Python/FastAPI/SQLAlchemy ; frontend Next.js/Tailwind avec export statique. Authentification par code email, logements, photos, analyse, historique des retouches, limites d'essais, crédits et téléchargement HD décrits comme codés. Paiement encore désactivé. Logo choisi : proposition 3 sur 4, thème sombre et ambre.

Hébergement prévu : HybridCloud PlanetHoster de Sébastien, Docker/Caddy/PostgreSQL ; images sur Amazon S3. Render est présenté comme alternative. Secrets dans l'environnement, jamais dans le code.

Choix rapportés : OpenAI pour les retouches, Gemini pour l'analyse et le secours, Higgsfield/Kling et ffmpeg pour les vidéos. Les identifiants précis de modèles, API et tarifs figurent dans la source et devront être vérifiés avant utilisation. Tests Gemini annoncés réussis ; retouche OpenAI explicitement non testée dans la passation. Déploiement GitHub Pages à vérifier.

## Suite proposée par l'ancienne conversation

1. Configurer la clé OpenAI dans l'environnement et tester une vraie retouche.
2. Choisir le nom définitif puis adapter l'identité. Pistes : Photo Qui Loue, Sublime Bien, Loue Mieux. Disponibilités historiques non garanties ; INPI non consulté.
3. Ajouter Stripe Checkout et le webhook de crédits.
4. Activer les vrais emails et désactiver les codes de démonstration.
5. Déployer sur le serveur de Sébastien avec S3 et un domaine.
6. Réaliser l'application mobile puis les publications sur les stores.
7. Développer les vidéos V2 ; comparer les moteurs sur des photos représentatives.

Cette liste ne constitue pas une autorisation de lancer ces actions. Aucune étape de développement n'a été réalisée pendant l'import de mémoire.

## Entretien

À chaque travail sur ce projet, consulter ce dossier, consigner les décisions explicites dans `../../DECISIONS.md` et les actions et vérifications dans `../../JOURNAL.md`, puis compléter `CONVERSATIONS.md`. Conserver les nouvelles passations datées sans écraser les anciennes.

Le journal est un compte rendu durable des échanges accessibles, pas un export automatique intégral des conversations. L'ancienne conversation n'est disponible ici qu'à travers sa passation. Aucune synchronisation avec ChatGPT web n'est mise en place.

## État vérifié — première proposition de design, 22 septembre 2026

Code local : `/Users/more/Documents/Codex/studio-annonce`, branche `codex/design-demo`. Prototype `/demo/` accessible sur ce Mac à `http://127.0.0.1:3173/demo/` tant que le serveur tourne. Quatre écrans responsive avec images fictives générées dans la conversation ; aucune génération automatique connectée. Lint/build réussis. Import local non validé dans Chrome à cause de la permission de fichiers de l’extension. Détails : `DESIGN-DEMO.md` dans le dépôt. Direction visuelle proposée, en attente de retour de Martin.

# Parcours web et mobile sans annonce « bientôt » — 6 octobre 2026

## Demande et résultat

Martin veut accéder aux parcours photo, vidéo, crédits et mobile sans badge « bientôt » ni texte de pilote périmé. Les pages publiques, l'aide, les écrans connectés web/mobile et le pied de page ont été mis à jour. Le pied de page ouvre `/mobile/` dans le navigateur ; aucune fiche App Store ou Google Play n'a été revendiquée comme publiée.

Les écrans de paiement restent branchés sur la disponibilité renvoyée par le serveur : le panier peut être composé, mais son bouton est désactivé et explique l'indisponibilité tant qu'un paiement ne peut pas aboutir. La préparation d'une vidéo reste accessible ; la génération client ne peut pas être présentée comme opérationnelle sans crédits achetables. L'outil « Créer une image » à partir d'une idée reste un brouillon local, ce qui est dit explicitement dans ses écrans : il ne faut pas le confondre avec une génération réellement ouverte.

## Vérification et publication

- Build Next, lint web, typecheck et lint mobile : réussis. Le lint web conserve huit avertissements existants, sans erreur.
- Export Expo web de production avec `EXPO_BASE_URL=/mobile` et `EXPO_PUBLIC_API_URL=https://studioannonce.fr/api`. La référence à l'API de production et les routes statiques sont présentes.
- Sauvegarde locale préalable des pages web et de l'ancien `/mobile/` : `/Users/more/Documents/Codex/studio-annonce-backups/no-soon-20261006/`.
- Publication ciblée sur `vzbbtadpbm` : HTML, métadonnées et nouveaux fichiers `_next` du web, export `/mobile/`. Aucun `.env`, `.htaccess`, compte, base ou fichier client n'a été modifié ; les anciennes ressources statiques ont été conservées.
- Empreintes SHA-256 identiques entre export local et serveur pour `/tarifs/`, `/application/`, `/app/facturation/`, `/mobile/` et `/mobile/compte/`. Les pages Tarifs, Application et mobile s'ouvrent dans le navigateur ; le pied de page propose le vrai lien `/mobile/`.

## Condition d'ouverture commerciale encore non satisfaite

Au dernier contrôle, le `studioapi/.env` de production n'avait ni `STRIPE_SECRET_KEY`, ni `STRIPE_WEBHOOK_SECRET`, et `PAIEMENT_ACTIF` et `VENTE_VIDEO_ACTIVE` étaient inactifs. `VIDEO_ACTIVE` était configuré. Le père de Martin travaille sur Stripe en parallèle ; ne pas remplacer ses réglages. Avant d'activer les achats, vérifier le compte et les clés Stripe, l'URL du webhook, une commande de test signée et le crédit du bon compte, puis les règles commerciales applicables. Aucun paiement réel n'a été lancé pour cette livraison.

L'absence de « bientôt » dans l'interface n'est donc pas une preuve que l'encaissement ou toutes les générations soient disponibles. L'interface affiche l'état réel du service au moment de l'action.

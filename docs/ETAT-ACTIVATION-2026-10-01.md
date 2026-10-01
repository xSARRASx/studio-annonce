# Activation photo et paiements — contrôle du 1er octobre 2026

Le site public et l'API du compte N0C `vzbbtadpbm` répondent. La connexion, les brouillons photo et les boutons de la photo offerte sont en ligne. Le contrôle de `/api/sante` confirme que la génération photo et les paiements restent fermés.

Une seule retouche OpenAI de contrôle a été tentée sur un exemple du site, sans compte client ni débit de crédit Studio Annonce. L'API a répondu : « You have no credits remaining ». La clé est présente sur le serveur, mais aucun résultat photo n'a pu être validé. Ne pas passer `IA_ACTIVE=true` avant une nouvelle recette réussie et une vérification visuelle de la photo obtenue. Le budget API OpenAI est distinct de l'abonnement ChatGPT.

Google AI Studio possède déjà une clé intitulée « SITE VIDEO PHOTO », liée à un projet également utilisé pour d'autres créations. Ce projet est en facturation après usage avec un plafond mensuel affiché de 10 000 €. Aucune clé Gemini n'a été copiée sur le serveur et aucune dépense Gemini n'a été lancée pendant ce contrôle. Le mode Gemini a été corrigé côté API : s'il est choisi, l'analyse de la photo et la reformulation de la demande utilisent désormais Gemini également, même lorsqu'une clé OpenAI épuisée est présente. Deux nouveaux tests couvrent cet aiguillage. La configuration de production reste sur OpenAI et fermée.

Le Dashboard Stripe affiche un écran de connexion. Le serveur n'a ni clé secrète Stripe ni secret de webhook. `PAIEMENT_ACTIF` reste à `false` ; aucun Checkout réel n'a été ouvert. Les prix et le panier de plusieurs packs sont déjà codés. Une activation commerciale exige un compte Stripe configuré, ses clés, le webhook, une recette de paiement en mode test, la gestion des remboursements et une recette de génération photo avec coûts connus.

Validation de cette modification : 93 tests API réussis dans l'environnement isolé ; ancien module `vision.py` sauvegardé dans `~/sauvegardes-studio/vision-avant-aiguillage-gemini-20261001.py` ; nouveau module publié, Passenger redémarré, `/api/sante` répond 200 et laisse génération et paiements fermés. Aucune clé n'est enregistrée dans Git.

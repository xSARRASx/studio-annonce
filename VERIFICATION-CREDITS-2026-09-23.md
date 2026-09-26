# Vérification ciblée des crédits photo et de la reprise

Date : 23 septembre 2026. Périmètre : API photo, atelier web réel, utilitaire API et solde affiché dans le header. Travail local ; aucun déploiement, appel IA payant, paiement ou compte réel utilisé.

## Comportement implémenté

- Le premier téléchargement HD réussi consomme un seul crédit, sauf la photo offerte. L'accès au fichier est vérifié avant le débit. Un échec de génération, d'écriture ou de lecture n'entame ni le crédit ni les sept jours.
- La date de départ est celle de la validation de la HD côté serveur. L'échéance est exactement sept jours après, à l'instant près. Les dates renvoyées par l'API portent explicitement le fuseau UTC (`Z`). Le navigateur affiche la date, l'heure et le fuseau local, sans inventer de date de secours.
- Un téléchargement répété ne consomme pas un autre crédit et ne repousse jamais l'échéance. Une HD déjà produite reste récupérable après l'échéance. Produire une autre HD ou effectuer une nouvelle retouche après le délai requiert une reprise explicite.
- Le bouton « Reprendre cette photo · 1 crédit » apparaît après l'échéance ou l'épuisement des essais de la période. Une confirmation précise que le crédit sera consommé immédiatement. La reprise ouvre sept nouveaux jours, inclut la HD, réinitialise uniquement le nombre d'essais disponibles dans cette période et conserve le compteur historique ainsi que toutes les versions.
- Aucun renouvellement automatique n'est déclenché par un téléchargement. Le serveur exige l'identifiant de la période que l'utilisateur confirme : une requête répétée ou une confirmation périmée ne peut pas débiter deux fois.
- Une photo offerte reprise devient une période payée normale, avec la limite d'essais normale. Le marqueur historique « offerte » est conservé.
- Les plafonds existants de 10 essais pour la photo offerte, 30 pour une période normale et 150 par jour sont inchangés. Le plafond quotidien inclut les générations actuellement réservées et se remet à zéro à minuit UTC ; une reprise n'efface pas les essais du jour.
- Après une première HD, un dialogue natif centré explique le débit réel (ou l'offre), l'échéance et la reprise. Il rend le fond inerte et garde le focus dans le dialogue. Il reste présent jusqu'à fermeture explicite (croix, « J'ai compris » ou Échap). Il est montré à partir des métadonnées de la réponse HD, même si la relecture de la photo échoue ensuite.
- Le solde du header se recharge après un débit confirmé. Une panne de réseau au rafraîchissement ne déconnecte plus l'utilisateur ; une réponse d'authentification 401 le fait toujours.

## Atomicité et conservation

Deux tables additionnelles, `reprises_photos` et `operations_photos`, sont créées par l'initialisation SQLAlchemy existante au prochain démarrage de l'API. Aucune table, donnée, version ou fichier existant n'est supprimé. Aucune migration destructive ni modification de colonnes existantes n'est nécessaire.

Les débits sont sérialisés par compte via un court verrou SQL, compatible avec le mécanisme d'écriture SQLite et le verrou de ligne PostgreSQL. Les opérations de génération réservent une photo avec un jeton, puis libèrent le verrou SQL avant l'appel fournisseur. La validation finale reprend le verrou et vérifie à nouveau le jeton, le solde et l'échéance. Cela empêche un double débit, le dépassement du dernier crédit et le dépassement des plafonds par des demandes concurrentes.

Une réservation expire au bout de dix minutes. Une réponse tardive ne peut pas valider une opération remplacée ni facturer l'utilisateur. Les éventuels fichiers générés avant un échec restent conservés ; aucun nettoyage de stockage n'a été ajouté.

## Vérifications exécutées

Suite hors ligne : `api/tests/test_photos_credits.py`, avec SQLite temporaire, horloge contrôlée, stockage en mémoire et fournisseurs Gemini/retouche simulés. Les données et jetons de test sont fictifs. Les tests n'importent pas `app.main`, ne touchent pas `studio.db` et ne lisent pas de `.env` du dépôt.

19 tests réussis :

1. Premier téléchargement, débit unique, échéance UTC exacte et non-report au re-téléchargement.
2. Photo offerte gratuite et quota propre.
3. Échecs IA et stockage sans débit ni départ du délai, puis succès possible.
4. Isolation des comptes pour la photo, la version de départ, le téléchargement et la reprise.
5. Expiration exacte, reprise payée, conservation des versions et du total historique ; aucun second débit lors de demandes répétées.
6. Trois reprises concurrentes : une seule période créée et un seul crédit consommé.
7. Retouche autorisée une microseconde avant l'échéance, refusée à l'échéance.
8. HD écrite mais non relisible : aucun débit.
9. Autre version HD après échéance : blocage sans renouvellement automatique.
10. Quota offert épuisé, reprise payée avant première HD : quota normal et HD sans second débit.
11. Solde insuffisant : aucune reprise créée.
12. Deux téléchargements simultanés de la même photo : un seul traitement et un seul débit.
13. Deux photos concurrentes avec le dernier crédit : un succès, un refus, aucun découvert.
14. Quota quotidien avec générations concurrentes en cours.
15. Dernier essai d'une photo en concurrence : aucune version surnuméraire.
16. Expiration pendant la génération : pas de nouvelle version ni débit supplémentaire.
17. Réservation expirée : réponse tardive refusée sans débit.
18. Deux dépôts simultanés : une seule photo offerte et ordres distincts.
19. Fournisseur renvoyant des données qui ne sont pas une image : refus sans débit ni départ des sept jours.

Commande exécutée depuis `/tmp` (environnement Python temporaire isolé, pas de `.env` de projet) :

```sh
DATABASE_URL='sqlite:///:memory:' \
PYTHONPATH=/Users/more/Documents/Codex/studio-annonce/api \
/tmp/studio-credits-check/bin/python -m unittest discover \
-s /Users/more/Documents/Codex/studio-annonce/api/tests -v
```

Résultat constaté : `Ran 19 tests ... OK`. TypeScript global `tsc --noEmit` a également réussi. ESLint ciblé sur les trois fichiers web modifiés réussit sans erreur ; les trois avertissements existants `no-img-element` de la page photo subsistent. `git diff --check` ciblé réussit également.

## Vérification navigateur

Session Chrome headless dédiée `studio-credit-qa` via agent-browser. Pour éviter les erreurs transitoires des autres écrans en cours de modification, les composants de l'atelier réel ont été copiés sans modification dans un dossier temporaire, avec leur feuille de style et une instance Next sur le port 3184. Seule la configuration locale des origines autorisées a été ajoutée dans cette copie pour autoriser le serveur de développement. Les réponses API ont été simulées dans le navigateur ; ce contrôle valide l'interface, pas un service en production.

Vérifications constatées à 1280 px et 390 px :

- Téléchargement simulé : dialogue centré réellement modal (`:modal`), date et heure avec fuseau reçues dans la réponse HD, solde mis à jour de 5 à 4.
- Au clavier : Tab reste dans le dialogue ; Échap ferme ; le focus revient au bouton de téléchargement ou de reprise. Ce dernier point a été corrigé après le premier passage.
- Nouvelle période : annuler ne débite rien, confirmer débite une fois, affiche le reçu et réactive le formulaire de retouche. Les versions restent visibles.
- Photo offerte : le texte indique clairement qu'aucun crédit n'a été consommé, compteur à zéro. Un second téléchargement n'ouvre pas un nouveau reçu de premier paiement.
- Échec simulé du GET de rafraîchissement : le reçu et la vraie échéance restent visibles, avec un message distinct expliquant l'échec de mise à jour.
- Aucun débordement horizontal constaté à 390 px. Le dialogue tient dans la hauteur du téléphone et reste défilable sur les écrans plus courts.
- Audit axe-core 4.12.1 limité au dialogue : zéro violation. Le contrôle automatique du contraste était incomplet à cause du recouvrement de la couche modale ; les couleurs calculées donnent 6,63:1 pour le texte et 16,71:1 pour le titre sur le fond effectif, au-dessus des seuils usuels.

Captures de contrôle conservées temporairement : `/tmp/studio-credits-dialog-desktop.png`, `/tmp/studio-credits-reprise-mobile.png` et `/tmp/studio-credits-info-mobile.png`. Aucun compte utilisateur ou fichier privé n'y figure.

## Limites explicites avant production

- Les validations de concurrence ont été exécutées sur SQLite. Le comportement PostgreSQL repose sur le verrou de ligne SQL ; un test d'intégration avec PostgreSQL reste à effectuer avant déploiement.
- Ni génération IA réelle, ni facturation Stripe, ni débit réel ni vraie livraison de mail n'ont été testés ou activés par ce chantier.
- Le navigateur peut attester que le fichier HD est disponible et que le téléchargement a été lancé, mais pas que l'utilisateur l'a effectivement sauvegardé sur son disque. Après une réponse réseau perdue, réessayer ne refacture pas une HD déjà validée.
- Les conditions de vente et mentions doivent décrire avant publication : moment du débit, photo offerte, quotas par période et par jour, fenêtre de sept jours, reprise volontaire à un crédit, récupération des HD déjà obtenues, politique de conservation et éventuels cas de remboursement. Ce rapport est technique, pas une validation juridique.
- Le stockage et le contrôle d'accès à l'ensemble des fichiers n'ont pas fait l'objet d'un audit général ici. Ces tests contrôlent l'ownership des routes de retouche/téléchargement/reprise, pas toutes les URLs du stockage existant.

# Vidéos : direction de caméra — 4 octobre 2026

## Demande et diagnostic

Martin trouve les vidéos trop statiques. Il demande des déplacements façon drone intérieur, un rythme soutenu et des arcs autour du mobilier. Il accepte un modèle plus coûteux si le résultat le justifie. Il indique que le solde fournisseur est épuisé et qu'il rechargera le lendemain. Aucun appel de génération payant n'est effectué pendant cette intervention.

La consigne serveur précédente commençait par « Mouvement de caméra doux dans cette seule pièce » et utilisait la même direction pour chaque plan. Le moteur était Seedance 2.5, à raison d'un plan de cinq secondes par photo, assemblés par coupes. Ce montage n'est pas une visite continue entre les pièces.

## Corrections

- Direction versionnée `camera-2026-10-04-v1` : traversée, arc partiel autour d'une table/îlot, révélation latérale ou visite calme explicite. Le mode automatique alterne les trois mouvements dynamiques.
- Trajectoire et timing précis sur cinq secondes ; déplacement avec parallaxe plutôt qu'un zoom numérique. Le mobilier reste immobile. Le trajet s'adapte à l'espace libre visible ; portes, fenêtres et équipements fixes sont conservés.
- Choix du mouvement pour chaque photo dans le studio web et le mobile. Le choix suit la photo lorsqu'elle est déplacée et reste dans le brouillon après rechargement. Exemple « Visite dynamique » et récapitulatif avant confirmation.
- La demande originale du client reste dans chaque prompt et garde priorité pour le trajet et le rythme. Chaque source donne son propre plan, sans inventer une liaison entre des pièces isolées.
- Modèle et prompts exacts figés dans le projet confirmé : une reprise conserve la même intention et la même clé fournisseur. Les anciens projets conservent leur consigne et leur modèle antérieurs.
- Un refus fournisseur HTTP 402 devient un échec terminal explicite. Recharger le solde ne relance pas automatiquement ce projet ; les plans déjà terminés restent disponibles.

## Modèle candidat et limites de validation

Le connecteur accepte aussi `kling-video/v3.0/pro/image-to-video`, avec son schéma propre (`sound`, `cfg_scale`, `multi_shots`). **Il n'est pas sélectionné pour les clients** : `VIDEO_MODELE` garde Seedance 2.5 par défaut. Le contrat de requête est testé avec un fournisseur simulé, pas par une vraie génération Kling.

Sources officielles consultées : [Seedance 2.5](https://open.higgsfield.ai/models/bytedance/seedance-2.5/image-to-video/api-reference), [Kling 3.0 Pro](https://open.higgsfield.ai/models/kling-video/v3.0/pro/image-to-video/api-reference), [guide de direction Kling](https://higgsfield.ai/blog/Kling-3.0-is-on-Higgsfield-User-Guide-AI-Video-Generation). Les prix « à partir de » et promotions ne sont pas retenus comme coût mesuré. Les tarifs clients ne sont pas modifiés.

La continuité fidèle d'une caméra à travers plusieurs pièces n'est pas garantie à partir de photos indépendantes. Une future recette dédiée doit utiliser des images montrant les vraies liaisons entre les pièces ; on ne simule pas arbitrairement une porte ou un passage.

## Recette technique

- 130 tests API, 53 tests de logique web, 23 tests de logique mobile réussis.
- TypeScript, lint et exports Next/Expo réussis ; six avertissements web `img` préexistants.
- Navigateur, compte fictif et fournisseur local simulé : choix de deux photos, mouvement d'orbite, changement d'ordre, rechargement, récapitulatif et création simulée de dix secondes réussis. Contrôle SQL : le modèle, la version de direction et les deux prompts sont figés ; la seconde photo conserve son mouvement explicite.
- Mobile Expo, compte fictif local : ancien brouillon conservé, choix « Révélation latérale », réordre puis rechargement ; choix et demande dynamique conservés. Aucune génération mobile payante.
- Largeur web et Expo de 390 px : pas de débordement horizontal ; les choix restent accessibles. Captures dans `docs/recette-camera-20261004/` ; images synthétiques de test, pas des rendus IA.

## Essai réel restant après recharge

`api/scripts/recette_mouvement_video.py` prépare un essai de cinq secondes hors compte client. Sans `--executer`, il valide uniquement la consigne et le schéma, sans réseau ni dépense. Avec `--executer`, un dossier privé conserve l'intention et le reçu avant l'appel payant, puis le MP4 ; reprendre exactement ce dossier ne recrée pas un essai déjà reçu. Ne pas afficher le contenu du reçu : il peut contenir des liens temporaires privés.

Comparer le même salon et la même demande sur Seedance et Kling : déplacement réellement visible, géométrie/fenêtres stables, absence de déformation du mobilier et fluidité. Conserver les MP4 et relever le coût réellement débité avant de décider du modèle et des prix. La qualité visuelle des nouvelles consignes reste non validée tant que ces vidéos n'ont pas été produites et regardées.

## Publication

Livraison `camera-20261004T141720Z` publiée sur N0C `vzbbtadpbm` : quatre fichiers API, interface `/app/`, ressources Next et export `/mobile/`. Sauvegarde préalable vérifiée côté serveur et copie locale à `/Users/more/Documents/Codex/studio-annonce-backups/camera-20261004T141720Z/`. 163 empreintes vérifiées sur disque et 85 fichiers publics relus par HTTPS ; `.env`, `.htaccess` et accueil public conservés. Base intacte : 1 compte, 3 logements, 13 photos, 2 versions, 3 vidéos, zéro mouvement de crédits avant/après. API privée refusée aux anonymes (401). Aucun modèle alternatif activé ni tarif modifié.

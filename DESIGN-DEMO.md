# Studio Annonce — proposition de design du 22 septembre 2026

## État actuel vérifié — 23 septembre 2026

Les notes datées ci-dessous sont conservées comme historique ; ce point d'étape les actualise.

- **Web local** : `/demo/` pour la vitrine ; `/demo/#studio` ouvre d'abord la collection, vide ou existante. Import groupé photos/vidéos, noms et logements, recherche, filtres, tri et historique propre à chaque photo. Aucun effacement de projet ajouté.
- **Sauvegarde** : fichiers et choix conservés dans IndexedDB sur ce navigateur ; protection des écritures concurrentes et refus d'écraser des données invalides. Ce n'est pas une sauvegarde serveur ni une synchronisation web/mobile. Les données peuvent être perdues si l'utilisateur efface celles du navigateur : conserver les originaux.
- **Retouches de démonstration** : original + lumière + terracotta + décoration complète sont disponibles dans le salon d'exemple. Les demandes libres sont enregistrées ; elles ne déclenchent pas une fausse génération.
- **Crédits de démo** : 5 pour un nouvel espace, première photo retouchée offerte. Garder ne débite rien. Les originaux/vidéos importés sont gratuits. Premier téléchargement d'un résultat retouché : reçu modal et 7 jours ; retéléchargement sans débit/prolongation ; reprise après échéance explicite avec un crédit. Ces crédits n'ont aucune valeur monétaire.
- **Mobile** : Expo iOS/Android/web avec collection persistante, quatre versions, favoris, demandes et règles de démo alignées. L'aperçu navigateur propose deux formats de téléphone. Pas de binaire signé ni de validation sur téléphone physique ; le téléchargement mobile reste simulé, contrairement au fichier téléchargeable de la démo web.
- **Vitrine** : logo porte lumineuse conservé, tarifs publics distincts des crédits, nouvelle aide avec réponses repliables.
- **Vidéo** : maquette existante de 10,58 s intégrée dans la collection, avec séjour/cuisine/chambre fictifs. Montage d'images, pas une visite continue générée par IA.
- **API réelle** : double débit protégé, reprise explicite et historique conservé, fichier HD décodé avant débit, dates UTC explicites. Aucun fournisseur réel, paiement ou déploiement validé par ces contrôles.

Vérifications : build statique Next.js et lint sans erreur (5 avertissements `img` dans l'ancienne app) ; 25 tests bibliothèque, 19 tests API et 12 tests mobile réussis. Expo export iOS/Android/web et Expo Doctor validés par le travail mobile. Navigateur intégré : import de deux photos web + une mobile, sauvegarde après rechargement, renom, versions, reçu, clavier modal, navigation, pages publiques et largeur 390 px contrôlés. Les tests API utilisent des fournisseurs simulés et SQLite ; PostgreSQL et intégrations réelles restent à vérifier.

Sauvegarde avant modification : `/Users/more/Documents/Codex/studio-annonce-backups/avant-ameliorations-2026-09-23.tar.gz`.
Détails : [plan de lancement](LANCEMENT-2026-09-23.md), [vérification des crédits](VERIFICATION-CREDITS-2026-09-23.md), [tests bibliothèque](web/tests/README.md), [mobile](DESIGN-MOBILE.md).

## Historique conservé

Prototype web responsive local sur la branche `codex/design-demo`.
Ouvrir http://127.0.0.1:3173/demo/ sur ce Mac pendant que le serveur est actif.
Pour redémarrer : depuis `web`, lancer `npm run dev -- --hostname 127.0.0.1 --port 3173`.

## Périmètre
Accueil, atelier avec comparateur avant/après, collection de photos, aperçu des formules et menu mobile. Direction crème, vert sauge et typographie éditoriale proposée par Codex, encore à valider par Martin. L’application publique reste inchangée.

Aucun appel IA, compte réel ou paiement dans cette route. Les retouches affichent toujours un exemple préparé, même si une autre consigne est saisie. La sélection est temporaire et disparaît au rechargement. L’import prévu crée uniquement une URL blob locale, sans envoi serveur. Une photo personnelle importée ne peut pas encore être retouchée. Les tarifs sont une reprise de la passation, à valider avant commercialisation.

## Images et consignes de génération
Images fictives 1536 × 1024 générées dans cette conversation via l’outil intégré, sans clé API du projet.
- `web/public/demo/salon-apres.png` : salon méditerranéen chaleureux, canapé crème, table basse en chêne, fenêtre à droite, espace repas au fond ; photographie immobilière soignée, lumière naturelle, verticales droites.
- `web/public/demo/salon-avant.png` : édition de la première image pour conserver cadrage et architecture ; lumière plus froide et sombre, vêtement sur le canapé, magazines et télécommande sur la table.
Ces descriptions résument les consignes employées. La paire illustre le design ; elle ne prouve pas le fonctionnement du futur moteur de retouche.
Sources originales :
`/Users/more/.codex/generated_images/01a0c8c5-a41b-7ff3-adb5-20f9c275711e/exec-3c602733-91a4-4f44-b201-aef61d8d2862.png`
`/Users/more/.codex/generated_images/01a0c8c5-a41b-7ff3-adb5-20f9c275711e/exec-91fd7118-5b06-4e3f-855f-c8935747c39d.png`

## Vérification
Lint et build statique Next.js réussis. Dans Chrome : images chargées, comparateur clavier, affichage de l’original, consigne libre avec avertissement de démonstration, sélection de version, navigation collection/tarifs, absence de paiement, menu mobile et fermeture du dialogue avec Échap vérifiés. Largeur 390 px sans débordement horizontal de document sur accueil, collection et tarifs. Contrôle visuel desktop de l’atelier et mobile de la collection ; titre mobile corrigé.
L’import automatisé a été bloqué par l’autorisation de fichiers de l’extension Chrome et n’est donc pas validé de bout en bout. Aucun test sur téléphone physique ni application native. Aucun push ni déploiement.

## Révision après retour de Martin
Accueil raccourci, suppression des slogans secondaires, typographie agrandie, atelier centré sur un champ de demande. Idées et versions accessibles via des volets repliés. Trois pistes de logos exploratoires dans `design/logos-propositions-01.png`, aucun logo choisi ni intégré.

## Accueil illustré et tarifs
Ajout de trois scènes CSS en relief avec les photos existantes, accroches au-dessus et sous le titre, encart tarif unitaire et bouton Découvrir les tarifs. Rendu Chrome desktop et 390 px vérifié, pas de débordement horizontal. Navigation vers les packs, lint et build réussis.

## Nouvelle décoration
Martin demande de réaliser dans la conversation sa retouche « rajoute des objet s’il te plait mon lapin et change toute la déco », puis montrer le résultat dans le site comme troisième version. Image générée à partir du salon existant : terracotta, bleu profond, noyer, objets et décoration remplacés. Fichier web/public/demo/salon-deco.png. Atelier affiche la troisième version en grand, historique visible des trois versions et comparaison avec original ; mention aménagement virtuel et origine conversation conservées. Génération automatique non connectée. Vérification visuelle dans son onglet intégré, images chargées et comparateur fonctionnel, sans débordement à 356 px. Lint/build réussis.
Source générée : /Users/more/.codex/generated_images/01a0c8c5-a41b-7ff3-adb5-20f9c275711e/exec-3a73afbd-3994-437f-91fa-0bfaff66b808.png

## Entrée dans le studio et démonstration vidéo — 23 septembre 2026

Les boutons « Ouvrir le studio » et « Essayer le studio » ouvrent maintenant la bibliothèque « Mes photos et vidéos ». À vide, elle propose d’ajouter une première photo ou vidéo ; les imports sont des aperçus locaux limités à la session, sans envoi serveur ni retouche automatique. Un salon fictif reste accessible pour explorer l’atelier.

Après un premier téléchargement HD dans l’atelier connecté, un dialogue central explique la consommation du crédit (ou la gratuité de la photo offerte) et la date de fin de la fenêtre de retouche, lue depuis l’API si elle est fournie. Il faut fermer explicitement le dialogue. Cette interface n’a pas été validée contre un backend de production.

Avant la mise en ligne, compléter les mentions légales et conditions de vente avec la règle exacte des 7 jours, le point de départ, les cas gratuit/payant, la consommation du crédit, les versions conservées et le tarif d’une reprise après échéance. Faire valider le texte final avant lancement.

Une maquette de visite silencieuse est dans `preview/visite-guidee-demo.mp4` : séjour, cuisine, chambre, mouvement lent sur images fixes et fondus. Les images sont fictives et générées ; ce montage n’est pas une prise de vue continue ni une vidéo générative traversant réellement le logement. Aucun fournisseur vidéo ni clé API n’est connecté au projet.

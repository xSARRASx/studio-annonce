# Créations, corrections et accès au compte

Décisions de Martin du 29 septembre 2026. Même compte, mêmes crédits et mêmes limites sur le site et dans l’application mobile connectée. Les anciens brouillons de démonstration restent distincts ; ils ne donnent aucun crédit réel.

## Tarifs photo confirmés le 30 septembre

Quatre packs prépayés, sans abonnement : **10 crédits pour 9,99 €**, **30 crédits pour 24,99 €**, **50 crédits pour 34,99 €** et **100 crédits pour 59,99 €**. Un crédit donne droit au premier téléchargement HD d’une photo payante ; l’aperçu et la correction incluse précèdent l’achat. La première photo offerte reste téléchargeable sans filigrane. Chaque pack porte un identifiant qui fige son prix : une ancienne commande conserve toujours son montant et son nombre de crédits d’origine. Le client peut cumuler plusieurs exemplaires et plusieurs packs photo dans un même panier ; le total est toujours recalculé côté serveur.

Les vidéos utilisent un solde distinct pour que le client achète une durée claire sans convertir ses photos. **Un crédit vidéo représente 5 secondes en 720p**. Les packs préparés sont 2 crédits / 10 secondes à 12,99 €, 4 crédits / 20 secondes à 21,99 € et 6 crédits / 30 secondes à 29,99 €. Ils restent impossibles à acheter tant que le moteur Higgsfield n’a pas réussi sa recette réelle.

Au seuil de 30 résultats photo, une notification privée apparaît dans l’administration avec prénom, nom, email, compteur et message. Les mêmes notifications et le déblocage journalisé sont accessibles sur le mobile connecté. La liste se rafraîchit toutes les minutes quand cet écran est actif et après un déblocage. Un achat confirmé ou une réinitialisation résout la notification ; ce n’est pas une notification push ni un email automatique.

## Photos

- Une première génération et une correction incluse : deux résultats au maximum dans le cycle initial.
- Une correction supplémentaire s’achète explicitement avec un crédit. Elle donne un seul nouvel essai et inclut son téléchargement HD ; pas de deuxième débit pour ce téléchargement.
- La durée de reprise existante de sept jours est conservée. Un échec de génération ne consomme pas l’essai acheté ; ce droit peut être réutilisé pendant sa période de validité.
- La première photo offerte du compte est téléchargeable sans filigrane. Une reconnexion ou un nouvel appareil ne renouvelle pas cette offre.
- Pour les photos non acquises, le site et le mobile affichent un motif par-dessus l’aperçu. Une copie d’aperçu protégée est aussi produite après la génération, côté serveur, afin de ne jamais transmettre le fichier propre avant acquisition. Le prompt IA ne contient aucune demande de filigrane et le fichier original généré reste intact.
- Un aperçu visible peut toujours être capturé à l’écran. Le dispositif protège l’accès au fichier propre ; il ne prétend pas rendre toute capture impossible.

## Limites communes

Chaque résultat généré avec succès consomme une création du compteur, y compris la correction incluse. Un import, une analyse, un échec, une reconnexion ou un téléchargement répété n’ajoutent pas de création.

Le seuil est de 30 créations photo et de 10 créations vidéo depuis le dernier achat du type concerné. Le trentième résultat photo est permis ; le suivant est refusé. Les opérations en cours réservent une place : deux appareils ne peuvent pas consommer simultanément la dernière place disponible.

Un premier téléchargement HD payé, l’achat explicite d’une correction ou un pack photo payé confirmé remet à zéro le compteur photo. Le téléchargement offert, les téléchargements déjà acquis et une notification de paiement répétée ne remettent rien à zéro. Le compteur vidéo est indépendant.

À la limite, les nouvelles créations sont suspendues avec un message neutre et les coordonnées du support. Les fichiers déjà achetés et le compte restent accessibles. L’administration peut réinitialiser les essais d’un compte autorisé ; cette action est journalisée et ne change pas son solde.

Les tables de compteurs sont ajoutées sans suppression des données existantes. Les compteurs démarrent à leur activation ; les anciens résultats ne sont pas reclassés rétroactivement.

## Support

- Bouton « Contacter le support » : <https://wa.me/33634972693>.
- Numéro affiché : 06 34 97 26 93.
- Email : contact@studioannonce.fr.
- Adresse de réception configurée dans N0C comme redirection vers contact@guestlucky.com, sans copie locale. Il ne s’agit pas d’une boîte de connexion autonome. Configuration vérifiée ; réception de bout en bout non testée par un envoi réel.

## Périmètre opérationnel

Le serveur contrôle les droits, les débits et les limites. Le navigateur et le mobile les affichent et les rafraîchissent ; aucun crédit réel n’est conservé dans un compteur local faisant autorité.

La règle vidéo, son compteur, son registre de crédits distinct et son catalogue sont implémentés dans le service commun. Le moteur de génération vidéo n’est pas encore connecté : tout futur point d’entrée vidéo devra réserver et terminer ses créations sous verrou du compte avec ce service, puis remettre le compteur vidéo à zéro sur un achat vidéo confirmé.

La retouche réelle et les paiements restent fermés tant que la configuration et les tests fournisseurs ne sont pas validés. Le tarif confirmé le 30 septembre est affiché, avec achat désactivé tant que le service ne peut pas fonctionner. L’aperçu mobile navigateur ne vaut pas recette d’une application installée sur iPhone ou Android.

Le stockage actuel de production est local et ses liens sont signés. Pour S3/R2, les fichiers doivent être dans un bucket privé sans domaine public. Les clés des fichiers propres sont indépendantes de celles des aperçus ; configurer un domaine public est refusé. La politique réelle du bucket devra être vérifiée avant tout changement de stockage.

## Vérification

La vérification automatisée couvre les quotas, la concurrence, les paiements idempotents, les trois packs photo, les trois packs vidéo, la séparation des deux soldes, les anciennes commandes conservées, les notifications paginées, la propriété des fichiers, les corrections achetées, les migrations, l’administration et la suspension pendant génération. Les essais fournisseurs sont simulés dans une base isolée : aucun débit ni email réel.

Le suivi du déploiement et les vérifications des interfaces figurent dans `deploiement/N0C-STATIQUE.md`.

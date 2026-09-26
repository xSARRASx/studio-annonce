# Studio Annonce — passer de la démo à une première vente

Document de travail du 23 septembre 2026. Aucun revenu, coût IA, taux de conversion ou compte client actif n’est établi par ce document. Aucun message commercial envoyé, aucune campagne et aucun paiement déclenchés.

## La première chose à vendre

Commencer par une promesse photo étroite et vérifiable : aider un hôte à préparer une sélection de photos cohérente pour son annonce, en lui laissant choisir les résultats avant le téléchargement. La vidéo de visite continue reste une recherche séparée : elle n’est pas nécessaire pour valider une première demande payante en photo.

Les montants repris du prototype restent 1 photo à 1,90 €, 5 à 8,90 €, 10 à 14,90 € et 25 à 29,90 €. Ils ne prouvent pas encore une marge positive. Aucun nouvel abonnement ni pack n’a été ajouté. Les trois packs existent également dans le code de l’API ; le prix à l’unité figure dans la vitrine mais son parcours d’achat reste à mettre en place.

## Ce qui est prêt à montrer

- La direction visuelle crème et sauge et le logo « porte lumineuse » choisi par Martin.
- L’accueil, les exemples avant/après et les tarifs publics séparés du compte et de ses crédits.
- Une nouvelle page Aide : règle du téléchargement, photo offerte, plafond d’essais, fenêtre de 7 jours, versions et statut de la vidéo.
- Un parcours de démonstration avec une bibliothèque puis l’atelier de la photo choisie ; sauvegarde locale des projets entre rechargements.
- Un aperçu mobile avec sa propre sauvegarde locale pour discuter du parcours iPhone et Android. Les espaces web et mobile ne sont pas synchronisés ; ce n’est pas une publication sur les stores.
- Une maquette vidéo sur images fictives, qui illustre l’ambiance et le rythme ; elle ne démontre pas un déplacement de caméra génératif continu.

Les fichiers de démonstration, le code et les exemples ne constituent pas une validation du service en production. Ne pas présenter la génération automatique ou la facturation comme actives parce que leurs écrans existent.

## Les conditions pour accepter un premier paiement

| Chantier | Preuve à obtenir avant ouverture |
| --- | --- |
| Retouche réelle | Une photo personnelle importée produit une nouvelle image via le fournisseur choisi, avec le bon historique et sans substitution par un exemple. |
| Fidélité du logement | Vérification humaine des portes, fenêtres, volumes, équipements et texte d’annonce ; identifier clairement l’aménagement virtuel. |
| Coût réel | Mesurer le coût de chaque tentative, des échecs, des téléchargements et du stockage sur un petit lot de photos représentatives. Aucun coût estimé ici n’est utilisé pour vendre. |
| Compte et données | Email réel, codes de démonstration désactivés, accès limité aux fichiers du bon compte, sauvegarde durable et restauration vérifiée. |
| Crédit et paiement | Paiement confirmé côté serveur, crédit ajouté une seule fois, débit unique au premier téléchargement, cas d’échec et remboursement définis. |
| Reprise à 7 jours | Date claire dans l’atelier et le message de téléchargement, délai fondé sur le serveur, essai avant/après échéance, reprise explicite contre un nouveau crédit. |
| Versions | Original et propositions consultables sans perte ; durée et conditions de conservation explicites. |
| Conditions de vente | Identité de l’éditeur, prix finaux et taxes applicables, règles de l’offre gratuite et des essais, téléchargements, délai de retouche, reprise payante, conservation et traitement des fichiers. Compléter et faire valider avant la mise en ligne commerciale. |

La reprise explicite est désormais codée dans l’API et simulée dans la démo : un crédit ouvre une nouvelle période de 7 jours. Les versions précédentes restent conservées et les HD déjà produites restent récupérables sans nouveau débit. La connexion complète au service commercial et ses paiements doit encore être validée de bout en bout.

## Un test commercial concret, à préparer sans contacter de personnes

1. **Constituer un jeu d’essai.** Dix à vingt photos autorisées : salons sombres, chambres, cuisines, petites pièces et logements déjà soignés. Inclure des cas difficiles ; conserver toutes les tentatives.
2. **Mesurer chaque résultat.** Demande initiale, nombre d’essais, résultat retenu ou rejeté, défauts, temps d’attente, coût fournisseur réel et besoin d’intervention humaine. Le critère utile est une photo que le propriétaire accepterait d’utiliser.
3. **Préparer une démonstration courte.** Avant/après, consigne exacte, résultat choisi, montant et délai de retouche. Utiliser des exemples consentis, sans faux témoignage ni promesse de réservations supplémentaires.
4. **Proposer ensuite un petit pilote photo.** Après validation technique et des conditions de vente, tester l’offre existante auprès d’un petit groupe volontaire d’hôtes. Expliquer les limites, le montant et ce qu’ils recevront avant tout engagement.
5. **Décider sur les faits.** Compter les personnes intéressées, les utilisateurs qui téléchargent, les paiements confirmés, les remboursements et le coût total réellement engagé. Revoir l’offre si les essais et l’accompagnement absorbent son prix.

Ces étapes sont des propositions d’exécution, pas une campagne envoyée ni une preuve de demande client. L’autorisation d’améliorer le projet ne remplace pas une autorisation d’écrire à des tiers.

## Le calcul qui manque avant de vendre à plus grande échelle

Marge par photo conservée = montant encaissé hors taxes applicables − coûts de toutes ses tentatives IA − frais de paiement − stockage et transfert − coût de traitement des échecs et d’assistance.

Ne pas déduire la marge du seul prix d’une génération réussie. Une photo offerte, les résultats rejetés et les nouvelles tentatives ont aussi un coût. Les prix fournisseur et les modalités d’accès seront vérifiés au moment du choix technique.

## Vidéo : prochain essai utile

Sur les mêmes images d’un logement, comparer une courte séquence générée et le montage d’images déjà disponible. Évaluer la continuité du mobilier et des ouvertures, les déformations, le coût réel et le nombre de reprises. Ne pas annoncer une visite sans coupure ni l’utiliser pour représenter fidèlement un bien tant que cette continuité n’est pas démontrée. Aucun fournisseur vidéo n’est déclaré connecté par ce document.

## Repères chiffrés pour le pilote

Les montants ci-dessous sont de simples divisions des prix affichés, sans hypothèse de coût fournisseur. Ils n'intègrent ni taxes, ni paiement, ni stockage, ni assistance, ni photo gratuite : ce ne sont donc pas des marges disponibles.

| Formule actuelle | Prix affiché par photo | Prix divisé par le plafond de 30 essais |
| --- | ---: | ---: |
| Unité | 1,90 € | 0,0633 € par essai |
| Pack 5 | 1,78 € | 0,0593 € par essai |
| Pack 10 | 1,49 € | 0,0497 € par essai |
| Pack 25 | 1,196 € | 0,0399 € par essai |

Les 30 essais sont un plafond, pas une moyenne mesurée. Au plafond, même un coût de génération inférieur à ces montants ne suffit pas à prouver une rentabilité : il reste notamment la production HD, les offres gratuites et les frais. Le pilote devra mesurer le nombre moyen de tentatives réellement payées, y compris celles des photos jamais achetées. C'est la donnée prioritaire avant d'augmenter le volume ou de promettre des essais généreux.

# Tarifs photo et vidéo — décision du 30 septembre 2026

## Grille affichée au client

Les achats sont ponctuels et sans abonnement. Les crédits photo et les crédits vidéo sont deux soldes distincts. Cette séparation rend le prix d’une vidéo compréhensible et empêche une génération vidéo de vider un pack photo.

### Photos

| Pack | Prix TTC affiché | Prix par photo | Remise par rapport au pack 10 |
| --- | ---: | ---: | ---: |
| 10 crédits photo | 9,99 € | 1,00 € | — |
| 30 crédits photo | 24,99 € | 0,83 € | 17 % |
| 50 crédits photo | 34,99 € | 0,70 € | 30 % |
| 100 crédits photo | 59,99 € | 0,60 € | 40 % |

Un crédit photo correspond au premier téléchargement HD sans filigrane d’une photo payante, ou à une correction supplémentaire explicitement achetée. La première génération et une correction sont incluses dans le cycle initial. La première photo du compte est offerte, propre et téléchargeable.

### Vidéos

Un crédit vidéo correspond à 5 secondes de vidéo en 720p.

| Pack | Durée | Prix TTC affiché | Prix par tranche de 5 secondes |
| --- | ---: | ---: | ---: |
| 2 crédits vidéo | 10 secondes | 12,99 € | 6,50 € |
| 4 crédits vidéo | 20 secondes | 21,99 € | 5,50 € |
| 6 crédits vidéo | 30 secondes | 29,99 € | 5,00 € |

Ces tarifs vidéo sont préparés dans l’interface et le système de paiement, mais la vente reste fermée tant que Higgsfield n’est pas connecté et qu’une génération réelle n’a pas permis de contrôler le rendu et le coût.

## Pourquoi deux crédits différents

Le coût d’une photo se mesure par retouche et par sortie HD. Le coût d’une vidéo se mesure surtout à la seconde, à la résolution et au nombre de plans relancés. Une monnaie unique rendrait le prix opaque : un crédit photo pourrait soudain valoir une fraction de seconde ou une vidéo consommer plusieurs dizaines de crédits. Deux soldes permettent d’afficher immédiatement « 20 secondes » et le prix correspondant.

## Garde-fous de rentabilité

Le pack de 100 photos est agressif à 0,60 € par photo. Il ne doit être achetable qu’après une recette réelle sur un échantillon représentatif et une mesure du coût moyen comprenant l’analyse, les aperçus, la sortie HD, les corrections incluses, les essais abandonnés, l’offre gratuite, les frais Stripe, les taxes et les échecs éventuellement facturés.

La grille est donc publiée comme information commerciale, tandis que le serveur refuse tout Checkout tant que l’IA photo et Stripe ne sont pas tous les deux configurés et validés. De la même manière, les achats vidéo exigent Stripe, la clé Higgsfield et l’activation vidéo après recette. Aucun simple bouton ou paramètre du navigateur ne peut ouvrir les ventes.

Le panier accepte plusieurs exemplaires d’un même pack et plusieurs packs de la même nature dans un paiement unique, par exemple deux packs de 10 ou un pack de 10 avec un pack de 30. Le serveur recalcule le total et les crédits depuis son propre catalogue. Les packs photo et vidéo se règlent séparément afin de créditer le bon solde.

## Parcours après une photo

Après un téléchargement HD réussi, le site et l’application proposent de préparer une visite vidéo de 10, 20 ou 30 secondes. Le client voit la durée et le tarif avant tout achat. Cette proposition n’ouvre pas un paiement si le moteur vidéo n’est pas disponible.

## Sources de coût à revérifier avant ouverture

- OpenAI, tarification API : <https://developers.openai.com/api/docs/pricing>
- Google Gemini, tarification API : <https://ai.google.dev/gemini-api/docs/pricing>
- Higgsfield Seedance 2.5, référence API : <https://open.higgsfield.ai/models/bytedance/seedance-2.5/image-to-video/api-reference>
- Stripe France, tarification : <https://stripe.com/fr/pricing>

Les tarifs fournisseurs changent. La recette doit enregistrer l’usage réel et le rapprocher de la facture avant d’affirmer une marge.

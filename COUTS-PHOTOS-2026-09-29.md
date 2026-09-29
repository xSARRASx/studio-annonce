# Coût des photos — document interne, 29 septembre 2026

Les montants ci-dessous sont des coûts fournisseur, pas des prix à afficher aux clients. Aucune retouche réelle n'a encore été mesurée : la clé OpenAI est reconnue, mais le fournisseur a refusé l'essai pour absence de crédit. Les ventes et la retouche restent fermées. Il faut financer puis réaliser une petite recette avant de confirmer la marge.

## Tarifs vérifiés

| Fournisseur et usage configuré | Tarif en USD pour 1 million de tokens |
| --- | ---: |
| GPT Image 2.5 Sunburst : texte envoyé | 5 $ |
| GPT Image 2.5 Sunburst : image envoyée | 8 $ |
| GPT Image 2.5 Sunburst : image produite | 30 $ |
| GPT-5.4 mini : analyse et reformulation, entrée hors cache | 0,75 $ |
| GPT-5.4 mini : sortie | 4,50 $ |
| GPT-5.4 mini : entrée effectivement mise en cache | 0,075 $ |

Sources : [GPT Image 2.5 Sunburst](https://developers.openai.com/api/docs/models/gpt-image-2.5-sunburst), [GPT-5.4 mini](https://developers.openai.com/api/docs/models/gpt-5.4-mini). Le tarif n'est pas un forfait par photo. La taille, la qualité et le contenu déterminent la consommation. OpenAI précise que le calculateur GPT Image 2 ne prédit pas la consommation de GPT Image 2.5. La route Images API utilisée ici ne bénéficie pas du cache d'images de l'outil Responses : [guide de génération](https://developers.openai.com/api/docs/guides/image-generation).

Le site demande un aperçu de qualité medium, grand côté cible 1024 px, puis une sortie high, grand côté cible 2048 px. Le format s'adapte au ratio d'origine et aux limites du fournisseur. Ce sont deux générations distinctes ; chaque nouvel aperçu coûte aussi de l'argent. Télécharger de nouveau un fichier HD déjà obtenu ne relance pas sa génération.

## Simulation pédagogique — ce ne sont pas des coûts mesurés

Pour montrer l'effet des essais, supposons volontairement les consommations suivantes. Ces hypothèses ne prédisent pas le nombre de tokens des photos réelles et ne constituent pas une limite maximale.

| Étape hypothétique | Entrée | Sortie | Coût calculé |
| --- | --- | --- | ---: |
| Analyse | 2 000 tokens hors cache | 500 tokens | 0,00375 $ |
| Un aperçu | 1 500 tokens image + 300 texte | 2 000 tokens image | 0,07350 $ |
| Une HD | 1 000 tokens image + 300 texte | 8 000 tokens image | 0,24950 $ |

| Parcours dans cette simulation | Total IA |
| --- | ---: |
| Une analyse + 1 aperçu + 1 HD | 0,32675 $ |
| Une analyse + 3 aperçus + 1 HD | 0,47375 $ |
| Une analyse + 10 aperçus + 1 HD | 0,98825 $ |
| Une analyse + 30 aperçus + 1 HD | 2,45825 $ |

Hors reformulations supplémentaires, reprises créant une nouvelle HD, tentatives éventuellement facturées sans résultat exploitable, taxes, change, emails, hébergement et paiement. Les compteurs existent pour l'analyse, la reformulation, les aperçus et la HD. Chaque consommation enregistrée est valorisée selon le modèle ; un appel sans données d'usage apparaît comme non chiffré, jamais comme gratuit. Rapprocher le relevé de la facture OpenAI.

## Paiement et anciens prix du prototype

Stripe France affiche **1,5 % + 0,25 € par paiement** pour les cartes standard de l'EEE. Le tarif dépend du pays du compte, de la carte et des conversions ; le pays de l'entité qui encaissera reste à confirmer. Source : [tarification Stripe France](https://stripe.com/fr/pricing).

Ces packs sont les prix provisoires déjà présents dans le prototype, pas une nouvelle recommandation ni des prix de lancement approuvés :

| Pack provisoire | Prix total | Prix/photo | Frais Stripe illustratifs par pack | Frais/photo |
| --- | ---: | ---: | ---: | ---: |
| 5 photos | 8,90 € | 1,78 € | 0,3835 € | 0,0767 € |
| 10 photos | 14,90 € | 1,49 € | 0,4735 € | 0,04735 € |
| 25 photos | 29,90 € | 1,196 € | 0,6985 € | 0,02794 € |

Ne pas soustraire directement des coûts en dollars à des recettes en euros. Appliquer le taux de change réellement facturé et le régime fiscal de l'entreprise avant de parler de marge. Les calculs ci-dessus montrent seulement les frais de carte, avant leur éventuel arrondi.

Les règles actuelles permettent 10 essais pour la première photo offerte et 30 pour une photo payante. Elles n'ont pas été changées. **Je déconseille de valider ces packs avec 30 essais inclus avant mesure**, car les essais non retenus peuvent absorber la recette d'une photo. Une piste à chiffrer est un nombre limité d'aperçus inclus puis des essais supplémentaires payants.

Le coût réel par vente doit aussi inclure les utilisateurs qui testent gratuitement et ne paient jamais :

`coût par photo vendue = IA des photos payées + essais abandonnés répartis + coût des offres gratuites réparti + frais paiement + exploitation`

Exemple purement économique : si un essai offert coûte 1 € et qu'un utilisateur sur dix achète, l'acquisition par l'offre gratuite coûte 10 € par nouvel acheteur. Cela doit ensuite être réparti sur ses achats. Ces deux nombres sont des hypothèses, pas des statistiques du site.

## Mesure avant fixation des prix

Mesurer un petit échantillon représentatif : rangement léger, lit à refaire, suppression d'objets et retouche plus complexe ; relever analyse, nombre d'aperçus, HD et résultat acceptable. Comparer coût moyen, cas coûteux et taux d'abandon. Fixer ensuite le nombre d'essais inclus et les packs. Les vidéos et Higgsfield ne sont pas chiffrés ici : aucun moteur vidéo n'est connecté ni tarif contractuel confirmé.

Rapport privé, depuis le dossier API du serveur :

```bash
python -m app.couts
```

Export privé des comptes avec profil et email vérifié, à enregistrer hors du répertoire public :

```bash
python -m scripts.export_comptes > fichier_prive.csv
```

Ce fichier contient des données personnelles : il ne doit pas être publié. La collecte pour le compte et l'essai n'inscrit pas les personnes à une campagne publicitaire.

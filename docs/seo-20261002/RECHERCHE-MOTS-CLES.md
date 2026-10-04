# Studio Annonce — recherche de requêtes et plan des pages

État du 2 octobre 2026. Ce document concerne uniquement Studio Annonce. Il organise les requêtes possibles selon l'intention du lecteur et les fonctions réellement visibles. Une expression dans ce plan est une **hypothèse éditoriale** tant que les impressions et clics propres à `studioannonce.fr` ne sont pas mesurés.

## Ce qui a été mesuré, et ce qui ne l'a pas été

- Google Trends, recherche Web en France sur les douze derniers mois, donne des **indices relatifs**, normalisés séparément pour chaque comparaison. Dans le groupe « retouche photo / home staging / photo immobilière », les indices moyens affichés étaient environ **74 / 15 / 0**. Dans le groupe « home staging / home staging virtuel / photo immobilière », ils étaient environ **49 / 0 / 1**. Ces deux séries ne sont pas comparables entre elles ; zéro signifie que le signal est trop faible pour cette vue, pas zéro recherche. [Voir la comparaison Trends](https://trends.google.com/trends/explore?geo=FR&q=home%20staging,retouche%20photo,photo%20immobili%C3%A8re).
- Les résultats publics pour « retouche photo immobilière » et « home staging virtuel » montrent des outils de mise en valeur et de comparaison avant/après. Cela confirme une **intention concurrentielle**, sans mesurer le nombre de recherches ni le classement de Studio Annonce.
- Le compte Google connecté ne présentait pas de propriété Search Console `studioannonce.fr`. Google Ads proposait la sélection d'un compte, sans compte disponible pour le Planificateur de mots-clés. **Aucun volume mensuel, clic, impression ou position propre au site n'a donc été vérifié.** Il serait trompeur d'appeler les termes ci-dessous « les plus recherchés ».

Les termes larges attirent aussi des personnes qui veulent modifier un portrait, faire du home staging physique ou apprendre la photographie sans chercher une application immobilière. Le ciblage privilégie donc l'accord entre requête, page et produit, pas la répétition d'un mot à gros indice.

## Carte des intentions : une page principale par sujet

| Priorité | Intention et formulations à couvrir naturellement | Page principale | Preuve que la page répond | État |
| --- | --- | --- | --- | --- |
| 1 | retouche photo immobilière, améliorer photo d'annonce, photo logement | `/` | Présentation de la retouche, comparateur, huit exemples et liens vers l'application | Préparé localement |
| 1 | home staging virtuel, décoration virtuelle photo, ameublement virtuel | `/blog/home-staging-virtuel-photo-annonce/` | Méthode et distinction entre proposition virtuelle et état réel ; l'accueil et les exemples pointent vers ce guide | Préparé localement |
| 1 | application de retouche photo immobilière, outil pour photos d'annonce, retoucher des photos de logement | `/application/` | Parcours, bibliothèque, briefs, versions et limites actuelles du pilote | Nouvelle page locale |
| 1 | retouche photo immobilière avant après, exemples retouche maison, salon avant après | `/exemples/` | Huit comparaisons visuelles ; chaque transformation a sa propre page | Préparé localement |
| 2 | prix retouche photo immobilière, tarif photo d'annonce, crédit photo | `/tarifs/` | Packs et coût par photo affichés, avec achats actuellement fermés | Préparé localement |
| 2 | comment fonctionne la retouche photo, crédit et modifications, photo offerte | `/aide/` | Réponses concrètes sur la demande, les crédits, les versions et la disponibilité | Préparé localement |
| 2 | photographier un logement avec un smartphone, photo intérieure pour annonce | `/blog/photos-immobilieres-smartphone/` | Conseils de prise de vue réutilisables ; lien depuis l'accueil et l'application | Préparé localement |
| 2 | demande retouche photo immobilière, brief retouche pièce | `/blog/demande-retouche-photo-immobiliere/` | Exemples de consignes et limites de fidélité ; lien depuis l'application | Préparé localement |
| 3 | photo immobilière, photographie d'intérieur, améliorer ses photos de location | `/blog/` | Index thématique des 24 guides. Ces termes sont larges : mesurer leur pertinence avant d'élargir | Préparé localement |

La page `/application/` est la **présentation publique** du produit. Les écrans `/app/`, `/connexion/` et `/mobile-preview/` ont `noindex` : ils ne répondent pas à une recherche d'information et peuvent montrer un état propre à l'utilisateur. Les anciennes routes `/demo/aide/`, `/demo/tarifs/` et `/demo/exemples/` indiquent leur URL canonique publique ; elles ne doivent pas devenir trois résultats concurrents.

## Questions longues déjà couvertes par les guides

| Besoin du lecteur | Pages préparées |
| --- | --- |
| Photographier une pièce | `/blog/photographier-salon-annonce-immobiliere/`, `/blog/photographier-chambre-location/`, `/blog/photographier-cuisine-annonce/`, `/blog/photographier-salle-de-bain/`, `/blog/photographier-terrasse-balcon/`, `/blog/photographier-petite-piece/`, `/blog/photographier-exterieur-logement/` |
| Corriger la prise de vue sans déformer le bien | `/blog/eclaircir-photo-interieur-sombre/`, `/blog/redresser-perspective-photo-immobiliere/`, `/blog/balance-blancs-photo-interieur/`, `/blog/reflets-miroirs-vitres-photo/`, `/blog/photo-immobiliere-floue/` |
| Imaginer un aménagement, et l'expliquer honnêtement | `/blog/meubler-virtuellement-piece-vide/`, `/blog/choisir-palette-decoration-virtuelle/`, `/blog/coherence-decoration-plusieurs-photos/`, `/blog/retouche-photo-immobiliere-exemples-avant-apres/` |
| Préparer la publication des images | `/blog/choisir-photos-annonce-location/`, `/blog/preparer-logement-seance-photo/`, `/blog/organiser-fichiers-photos-logements/`, `/blog/formats-poids-photos-site-immobilier/`, `/blog/texte-alternatif-photos-immobilieres/` |

Chaque guide a un titre, une description et une URL propres. Les liens relient les guides aux exemples et au parcours produit lorsqu'ils aident réellement le lecteur. Ajouter des variantes orthographiques ou géographiques sans contenu distinct créerait des pages artificielles ; ce n'est pas prévu.

## Requêtes écartées ou différées

- « home staging gratuit » : les achats et la génération sont fermés pendant le pilote ; il serait trompeur d'attirer cette recherche comme si le service complet était offert.
- « génération vidéo immobilière IA », « visite virtuelle automatique » : le site montre une préparation de brief et des aperçus, pas un moteur vidéo ouvert. Une page commerciale dédiée attend une fonction réelle et vérifiée.
- « meilleur logiciel de retouche », « n° 1 », « résultats garantis », « logement vendu plus vite » : aucune comparaison indépendante ou mesure de conversion ne permet ces affirmations.
- Villes, quartiers, langues supplémentaires : aucune présence locale ni contenu propre à chaque lieu ou langue n'est établi. Pas de pages géographiques ou traductions de masse.
- Marques concurrentes : pas de pages de comparaison improvisées ou de reprise de leurs textes.

## Google, images et réponses des assistants IA

Le même contenu doit pouvoir répondre à la question d'un humain : une explication précise, des exemples visibles, les limites du produit et des liens internes. Les pages publiques sont du HTML exporté, avec canoniques, plan du site, images décrites et données structurées conformes au texte. Google précise que ses expériences de recherche avec IA utilisent les fondations habituelles de la recherche et ne demandent pas de fichier spécial ([documentation Google](https://developers.google.com/search/docs/appearance/ai-features)). OpenAI distingue [OAI-SearchBot et GPTBot](https://developers.openai.com/api/docs/bots) ; le fichier `robots.txt` préparé ne bloque pas spécifiquement le premier. Cela ne prouve ni exploration effective, ni citation par un assistant.

Les pages publiques montrent l'original et la proposition quand une image a été transformée. Les textes ne prétendent pas qu'un outil fermé est déjà commercialisé. Cette précision est aussi importante pour les moteurs que pour les visiteurs.

## Mesures à effectuer après une mise en ligne autorisée

1. Confirmer le domaine dans Search Console, soumettre `/sitemap.xml` et inspecter les principales URL publiques. Ne pas conclure à une indexation seulement parce que le sitemap répond.
2. Au fil des données, relever pour chaque page **requête, impressions, clics, position moyenne et pays**, puis séparer découverte générale et requêtes à intention de service. Comparer des périodes suffisantes ; quelques jours ne suffisent pas à juger un guide neuf. [Rapport Performances Search Console](https://support.google.com/webmasters/answer/7576553?hl=fr).
3. Si un compte Google Ads approprié est ensuite disponible, consulter le Planificateur pour des ordres de grandeur par pays et langue, sans campagne payante. Ses chiffres ne remplacent pas les données organiques du site. [Aide Google Ads](https://support.google.com/google-ads/answer/7337243?hl=fr).
4. Regrouper les requêtes réellement observées par intention. Améliorer d'abord les pages déjà vues mais peu cliquées, puis combler un manque de réponse documenté. Éviter de multiplier des articles presque identiques.
5. Vérifier séparément l'accès de robots, l'indexation, les résultats enrichis éventuels et les citations dans les assistants. Aucune place ou citation n'est garantie par une balise.

## Mise à jour du 4 octobre 2026

Le tableau ci-dessus décrit l'état de préparation du 2 octobre. Les 43 URL publiques, dont les 24 guides, sont désormais en ligne. La propriété `https://studioannonce.fr/` a été validée dans Search Console ; Google a lu le sitemap et y a découvert 43 URL. L'inspection de l'accueil indique qu'il est indexé. Les rapports globaux d'indexation et de performances sont encore en traitement : il n'existe donc toujours pas de base vérifiée pour classer les requêtes par clics, impressions ou positions du site. Les prochaines révisions éditoriales devront partir de ces données lorsqu'elles seront disponibles, et de besoins réels des visiteurs.

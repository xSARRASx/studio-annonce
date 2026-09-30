# Prix et notifications — vérification du 30 septembre 2026

## Résultat publié

- Pack unique : 10 crédits photo pour 9,99 €, sans abonnement.
- Première photo offerte propre ; première génération et une correction incluse, puis un crédit par correction supplémentaire.
- Notifications administrateur au seuil de créations, avec identité, compteur et message.
- Même liste et même déblocage sur le site et le mobile connecté ; les crédits restent inchangés après déblocage.
- Compte propriétaire de Martin vérifié actif ; ses droits permettent d'accorder l'administration aux comptes dont l'email a été validé.

La livraison est publiée sur `studioannonce.fr`, compte `vzbbtadpbm`. Elle ne concerne pas VériFoncier. Le transfert a été contrôlé par taille et SHA-256 avant exécution. Une sauvegarde des fichiers remplacés a été créée et relue avant écriture. Le `.env`, les données des comptes et les autres fichiers API ont été conservés.

## Vérifications locales

| Vérification | Résultat |
| --- | --- |
| Tests API | 75 réussis |
| Tests web | 49 réussis |
| Tests de logique mobile | 22 réussis |
| Build Next de production | Réussi |
| Export Expo web de production | Réussi |
| TypeScript mobile et lint mobile | Sans erreur |
| Lint web | Sans erreur, 4 avertissements `<img>` préexistants |
| Déblocage mobile → notification web | Réussi sur compte fictif, crédits conservés |

Les tests de paiement couvrent 999 centimes, le refus d'un montant incohérent, la conservation des anciennes commandes et la confirmation répétée sans double crédit. Les tests d'alertes couvrent les accès client/admin, les opérations en cours, les échecs, le seuil confirmé, la pagination, le déblocage et le nouveau cycle après achat.

La recette visuelle à 390 × 844 comprend le pack, la notification, la confirmation par email et la disparition de l'alerte après déblocage. Aucun crédit fournisseur, paiement réel, email ou compte de production n'a été consommé ou modifié par ces tests isolés.

## Vérifications en production

Publication : `2026-09-30T05:11:28.453013+00:00`, livraison `prix-alertes-20260930T0503Z`.

- 120 fichiers écrits ; 196 fichiers vérifiés sur le serveur ; 27 fichiers protégés inchangés.
- 54 fichiers HTML/JS/CSS vérifiés par HTTP avec empreinte identique.
- Santé HTTP 200 : connexion disponible, retouche et paiement fermés.
- Accès anonyme au compte et à l'administration : HTTP 401, réponses privées non mises en cache.
- Avec la session existante du propriétaire : catalogue unique 10 crédits / 999 centimes, alertes HTTP 200, rôle propriétaire, un administrateur actif.
- Consultation visuelle du tarif public et de la connexion mobile sur le site publié.

Rapports et captures conservés dans `/Users/more/Documents/ChatGPT/SAAS/verification-studio-annonce/` :

- `prix-alertes-publication-20260930.json` : sauvegarde, publication et contrôle propriétaire.
- `prix-alertes-production-20260930.json` : empreintes HTTP et contrôles anonymes.
- `tarif-public-production-20260930.png` : tarif publié.
- `alertes-admin-web-recette-20260930.png` : administration sur données fictives.
- `alertes-admin-mobile-recette-20260930.png` : notification sur mobile, données fictives.

## Limites et suite nécessaire

OpenAI accepte la clé et l'accès aux modèles, mais refuse l'appel de contrôle faute de solde (`credit_balance_exhausted` / `insufficient_quota`, solde affiché 0,00 $). La recharge reste à autoriser et à réaliser. Aucune qualité photo ni coût réel par résultat n'a donc encore été validé.

Stripe reste sans clé ni webhook. Le compte commercial d'encaissement doit être identifié puis la configuration et le parcours Checkout testés avant ouverture. Le prix décidé ne suffit pas à activer les paiements.

Les notifications sont une liste privée actualisée dans l'administration et sur l'écran du compte mobile, pas des notifications push ou des emails. Les alertes résolues disparaissent ; le journal conserve l'action de déblocage.

L'application mobile publiée fonctionne dans le navigateur. Cette recette ne prouve ni une installation iOS/Android ni une distribution sur les stores. La vidéo est reportée conformément à la demande de Martin.

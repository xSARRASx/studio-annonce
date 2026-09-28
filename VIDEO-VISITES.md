# Visites vidéo immobilières — état et suite

## État vérifié du prototype

Le parcours **Photos → vidéo** existe dans la démo web et l’aperçu Expo. Il permet de choisir les photos et leur ordre, de décrire le rangement souhaité, de préciser les vraies portes et l’ordre des pièces, puis de composer un brief guidé. Les choix sont gardés dans le brouillon local. Ce parcours **ne retouche pas encore les photos et ne génère pas de vidéo**. La maquette vidéo de la démo reste un montage de photos fictives.

## Parcours attendu pour une vidéo client

1. **Préparer les sources.** Classer chaque photo par pièce, noter son angle, les ouvertures visibles et les objets à retirer. Conserver toujours l’original. La génération d’une image rangée doit rester fidèle aux volumes, portes, fenêtres, escaliers et équipements fixes. Faire valider chaque retouche par le client avant d’animer : lit fait, surfaces dégagées, pas d’objet supprimé qui réapparaît sous un autre angle.
2. **Construire le trajet.** La liste ordonnée des pièces est distincte de la preuve de leurs connexions. Chaque passage est marqué `ouverture visible`, `ouverture non prouvée` ou `coupe voulue`. Un mouvement continu n’est autorisé que pour une ouverture réellement montrée et praticable. Entre deux pièces sans connexion prouvée, utiliser une coupe lisible. La vue extérieure vers le séjour passe par la vraie baie si elle est visible ouverte ; sinon, couper entre deux plans.
3. **Produire des plans courts.** Préparer un plan par lieu avec image de départ approuvée, image de fin si nécessaire, mouvement, durée et vitesse. Favoriser de petites orbites, des mouvements flottants et des accélérations brèves dans les liaisons. Assembler les plans au montage : une vidéo de 30 s ne doit pas dépendre d’un unique faux plan-séquence.
4. **Contrôler avant livraison.** Vérifier la vidéo image par image aux raccords et aux endroits où des objets ont été retirés. Rejeter ou régénérer un plan si le lit redevient défait, si un objet revient, si une porte change de place, si la caméra traverse un mur/vitrage ou si les meubles se déforment. Vérifier séparément format, durée, lisibilité des pièces, son et résolution.

Le cas test du 28 septembre 2026 est la villa avec piscine. La première vidéo générée ailleurs montre un faux passage piscine → chambre, les scooters et chaussures autour du bassin, l’îlot encombré et le lit rose défait. Le prompt correctif local est dans `/Users/more/Downloads/seedance-villa-correction-v2.txt` (9 740 caractères, pour `@Vidéo1` dans Seevio « Continuer l’édition »). Ce prompt est un **essai**, pas une preuve que Seedance répare la géométrie ou le désordre. Comparer la sortie à ces défauts précis avant toute autre génération payante.

## À connecter avant une vraie offre

- Stockage durable des sources, versions rangées, validation et provenance par logement ; le brouillon local actuel ne suffit pas pour un client.
- Moteur de retouche d’images et moteur vidéo, avec contrôle explicite des coûts et reprise d’un plan échoué.
- Métadonnées de pièce et de passage, storyboard éditable et assemblage final. Ne pas promettre une visite continue à partir de seules photos si les connexions ne sont pas démontrées.
- Revue humaine du résultat et export HD. Les résultats générés doivent être identifiés comme images/vidéos retouchées lorsque la présentation du bien a été modifiée.

Les choix de moteur, durée maximale, prix et capacités de correction doivent être revalidés au moment de l’intégration. Aucun appel payant ni mise en ligne n’est déclenché par le prototype.

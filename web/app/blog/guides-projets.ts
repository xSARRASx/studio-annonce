import type { BlogArticle } from "./articles";

const guides: Omit<BlogArticle, "date" | "status">[] = [
  {
    slug: "preparer-logement-seance-photo", topic: "Organisation", category: "Avant la séance",
    title: "Préparer un logement pour une séance photo : une liste de contrôle pièce par pièce.",
    seoTitle: "Préparer un logement pour les photos : liste de contrôle",
    description: "Organisez le rangement, les accès, les éclairages et les prises de vue avant une séance photo, puis contrôlez les fichiers avant de quitter le logement.",
    intro: "Une préparation efficace évite de déplacer les mêmes affaires à chaque photo et de découvrir un oubli après le départ. Faites d’abord un tour du logement sans appareil, puis avancez pièce par pièce avec une courte liste de vues à réaliser.",
    related: ["photographier-salon-annonce-immobiliere", "photographier-chambre-location", "organiser-fichiers-photos-logements"],
    sections: [
      { title: "Définir les vues avant le rangement", paragraphs: [
        "Notez les espaces à documenter : pièce de vie, cuisine, chambres, salle d’eau et extérieur selon le logement. Pour chacun, prévoyez une vue qui explique l’ensemble et, si nécessaire, une autre qui précise un équipement. Cette liste évite de consacrer toute la séance au salon et d’oublier une chambre.",
        "Vérifiez les accès et la disponibilité des pièces. Si vous intervenez avec un propriétaire ou une équipe, confirmez quelle configuration doit apparaître : lit déplié, table habituelle, terrasse équipée. La préparation doit correspondre à l’usage présenté dans le projet ou l’annonce."
      ] },
      { title: "Traiter ce qui revient dans plusieurs cadrages", paragraphs: [
        "Rangez les sacs, les câbles mobiles et les produits ménagers dans un endroit qui restera hors des vues, y compris des miroirs. Nettoyez les surfaces brillantes et replacez le mobilier courant. Pensez aux espaces qui apparaissent en arrière-plan : une cuisine encombrée peut gêner la photo du séjour.",
        "Contrôlez les textiles et l’éclairage. Faites les lits, alignez les serviettes et vérifiez quelles lampes fonctionnent. Ne cachez pas un défaut réel en prévoyant de l’effacer ensuite. Si une réparation ou un remplacement est nécessaire, distinguez la séance de l’état actuel d’un futur projet."
      ], checklist: ["Objets personnels et documents hors des cadrages et reflets.", "Vitres, miroirs et plans de travail nettoyés.", "Textiles remis en place.", "Accès dégagés et configuration vérifiée."] },
      { title: "Avancer sans perdre la cohérence de la pièce", paragraphs: [
        "Photographiez les vues complémentaires d’un même espace avant de modifier la mise en place. Une chaise déplacée d’une image à l’autre peut compliquer la lecture. Si vous testez une autre disposition, identifiez cette série séparément pour ne pas mélanger les configurations lors du tri.",
        "Faites une photo de contrôle dès le premier cadrage. Agrandissez-la pour vérifier la netteté, les reflets et les bords. Il est plus facile de corriger la préparation à ce moment que de découvrir le même objet gênant dans vingt images."
      ] },
      { title: "Vérifier les fichiers avant de partir", paragraphs: [
        "Reprenez votre liste initiale et associez une photographie exploitable à chaque espace. Une pièce photographiée n’est pas forcément documentée si toutes ses vues sont floues. Contrôlez aussi les équipements que vous aviez prévu de montrer et la présence éventuelle de personnes ou d’informations privées.",
        "Conservez les originaux en pleine résolution. Transférez-les dans un dossier identifié avant de préparer les retouches. Pour les vues encore manquantes, notez précisément le besoin : « vue du placard de la chambre depuis la porte » sera plus utile qu’un rappel général de refaire des photos."
      ] }
    ]
  },
  {
    slug: "coherence-decoration-plusieurs-photos", topic: "Retouche & décoration", category: "Une pièce, plusieurs vues",
    title: "Décoration virtuelle : garder la même pièce sur plusieurs photographies.",
    seoTitle: "Décoration virtuelle sur plusieurs photos : garder la cohérence",
    description: "Préparez une référence commune de couleurs et de mobilier, puis vérifiez les raccords entre plusieurs vues d’un même projet de décoration.",
    coverExample: "sejour-canape-olive", coverCaption: "Le séjour et la cuisine de ce logement partagent une direction décorative à contrôler d’une vue à l’autre.",
    intro: "Deux propositions peuvent être réussies séparément et se contredire lorsqu’on les regarde ensemble. Pour présenter un projet de décoration, fixez une version de référence, puis vérifiez les meubles, les matières et les ouvertures visibles depuis chaque angle.",
    related: ["choisir-palette-decoration-virtuelle", "home-staging-virtuel-photo-annonce", "organiser-fichiers-photos-logements"],
    sections: [
      { title: "Choisir une vue principale comme référence", paragraphs: [
        "Retenez la photographie qui montre le mieux les éléments communs aux autres vues. Pour une cuisine ouverte, cela peut être la vue réunissant le séjour, le sol et une partie des façades. Validez d’abord la direction sur cette image avant de multiplier les variantes sur chaque angle.",
        "Conservez l’original et la proposition retenue dans un dossier facilement identifiable. Notez les éléments importants : canapé olive, façades bleu profond, sol en bois, par exemple. Une référence visuelle seule peut laisser certains détails ambigus ; une courte liste explicite aide à les contrôler."
      ] },
      { title: "Séparer les choix communs des demandes propres à une vue", paragraphs: [
        "La couleur d’un mur, le modèle d’une table et le revêtement de sol doivent rester cohérents. La lumière ou le cadrage peuvent varier selon le point de vue. Réutilisez la liste des choix communs, puis ajoutez seulement ce qui concerne l’image traitée : un coussin visible au premier plan ou un luminaire mieux exposé.",
        "Évitez de demander un style différent pour chaque photo. « Contemporain » sur l’une et « chaleureux » sur l’autre ne décrit pas assez précisément les mêmes meubles. Indiquez les objets et matières déjà retenus, sans supposer que l’outil les reconnaîtra ou les reproduira automatiquement."
      ] },
      { title: "Comparer les zones qui se recoupent", paragraphs: [
        "Placez les propositions côte à côte. Suivez un même élément : table, façade de cuisine, passage ou lampe. Vérifiez sa couleur, sa forme et sa position. Un objet cohérent en premier plan peut devenir différent lorsqu’il apparaît petit à l’arrière d’une autre image.",
        "Les exemples du séjour olive et de la cuisine bleue montrent l’intérêt de cette lecture commune. Ils illustrent une direction de projet, sans remplacer un plan d’aménagement. Lorsque les images ne suffisent pas à confirmer une dimension ou une implantation, revenez aux mesures du logement."
      ], examples: ["sejour-canape-olive", "cuisine-bleu-parquet"] },
      { title: "Corriger une incohérence avec une référence explicite", paragraphs: [
        "Décrivez le changement attendu et ce qui doit être conservé : « Reprends la couleur des façades de la vue principale et garde le reste de cette proposition. » Joignez une référence si votre outil le permet. Après correction, relisez l’image entière pour vérifier qu’un autre élément n’a pas changé.",
        "Gardez un ensemble final clairement identifié. Ne mélangez pas une première proposition du salon avec une cuisine corrigée dans une autre direction. Une série de trois vues cohérentes permet de discuter du projet plus facilement que dix variantes dont on ne sait plus lesquelles ont été retenues."
      ] }
    ]
  },
  {
    slug: "meubler-virtuellement-piece-vide", topic: "Retouche & décoration", category: "Aménagement virtuel",
    title: "Meubler virtuellement une pièce vide : partir des usages et vérifier les passages.",
    seoTitle: "Meubler une pièce vide en virtuel : préparer le projet",
    description: "Définissez les usages, conservez les ouvertures et contrôlez l’échelle des meubles avant de retenir un aménagement virtuel de pièce vide.",
    intro: "Une pièce vide laisse beaucoup de possibilités, mais une photographie ne fournit pas toutes ses dimensions. Commencez par les contraintes réelles et l’usage attendu. Le visuel servira ensuite à comparer des idées, avec les mesures comme référence pour les décisions d’aménagement.",
    related: ["home-staging-virtuel-photo-annonce", "photographier-petite-piece", "demande-retouche-photo-immobiliere"],
    sections: [
      { title: "Documenter les contraintes avant de demander des meubles", paragraphs: [
        "Photographiez les ouvertures, les radiateurs, les prises utiles et les passages. Relevez les dimensions nécessaires au projet. Un angle qui masque une porte peut produire une proposition séduisante mais impossible à utiliser. Ajoutez une vue complémentaire lorsque la pièce n’est pas entièrement compréhensible.",
        "Dans la demande, nommez les repères à conserver. Ne comptez pas sur une formule générale comme « aménage ce salon » pour protéger chaque élément. La liste des contraintes vous servira aussi lors de la relecture du résultat."
      ] },
      { title: "Définir le nombre d’usages et leur priorité", paragraphs: [
        "Un salon peut accueillir des assises, un repas et du télétravail, mais toutes ces fonctions n’ont pas forcément la même importance. Indiquez ce qui doit primer. Demandez d’abord une disposition simple qui répond aux besoins principaux, puis comparez une variante si nécessaire.",
        "Exemple de demande : « Propose un coin salon pour deux personnes et une petite table de repas. Garde la porte-fenêtre, le radiateur et le sol. Laisse le passage vers la cuisine dégagé. Présente une décoration claire avec du bois naturel. » Les dimensions doivent ensuite être vérifiées hors de l’image."
      ] },
      { title: "Repérer les meubles dont l’échelle paraît douteuse", paragraphs: [
        "Comparez la hauteur d’un meuble à celle d’une porte et la profondeur du canapé à l’espace disponible. Ces repères aident à détecter des incohérences, mais ne donnent pas des mesures fiables. Un rendu peut sembler plausible alors qu’un meuble réel occuperait davantage de place.",
        "Contrôlez aussi les ouvertures de portes, le recul des chaises et les passages devant les rangements. Une photographie fixe ne montre pas ces mouvements. Faites les vérifications à partir des dimensions du mobilier envisagé et du relevé de la pièce."
      ] },
      { title: "Présenter le visuel avec l’état actuel", paragraphs: [
        "Gardez la photographie vide à côté de la proposition et indiquez clairement que le mobilier a été ajouté virtuellement. Le lecteur peut alors comprendre le potentiel de la pièce sans confondre le projet avec des équipements disponibles. Une simple mention « après » peut être insuffisamment explicite si aucun aménagement n’a eu lieu.",
        "Avant de passer à l’achat, reprenez la liste des besoins et contraintes. Vérifiez les dimensions, les passages et les points techniques. L’image est un support pour choisir une direction et échanger ; elle ne constitue ni un plan coté ni une validation de faisabilité."
      ], checklist: ["Les contraintes fixes sont documentées.", "Les usages prioritaires sont définis.", "Les dimensions des meubles sont vérifiées séparément.", "Le caractère virtuel de l’aménagement est visible."] }
    ]
  },
  {
    slug: "choisir-palette-decoration-virtuelle", topic: "Retouche & décoration", category: "Couleurs & matières",
    title: "Choisir une palette de décoration virtuelle à partir de ce que vous gardez.",
    seoTitle: "Palette de décoration virtuelle : couleurs et matières",
    description: "Construisez une palette autour d’un canapé, d’un sol ou d’un mur conservé, puis comparez les propositions sans modifier tous les choix à la fois.",
    coverExample: "chambre-bleu-petrole", coverCaption: "Bleu pétrole, noyer et linge blanc : une direction décorative illustrée sur une chambre existante.",
    intro: "Une palette fonctionne dans une pièce avec sa lumière, son sol et ses meubles. Choisissez d’abord un élément que vous souhaitez conserver, puis définissez quelques couleurs et matières autour de lui. Vous pourrez comparer des variantes sans perdre le fil du projet.",
    related: ["coherence-decoration-plusieurs-photos", "balance-blancs-photo-interieur", "demande-retouche-photo-immobiliere"],
    sections: [
      { title: "Partir d’un élément qui restera dans la pièce", paragraphs: [
        "Un canapé, un parquet ou une cuisine peuvent donner une direction plus précise qu’une collection d’images sans lien entre elles. Notez leur couleur et leur matière, puis indiquez qu’ils doivent rester dans la proposition. Cette contrainte aide à évaluer si les nouveaux éléments s’accordent avec l’existant.",
        "Dans le salon au canapé rouille, la décoration se construit autour de cette couleur déjà présente. Le projet explore notamment le noyer et des textiles harmonisés. Il n’est pas nécessaire de changer le canapé pour essayer une autre ambiance."
      ], examples: ["salon-canape-rouille"] },
      { title: "Nommer les surfaces, pas seulement les couleurs", paragraphs: [
        "Au lieu de demander « ajoute du bleu », précisez où il doit apparaître : mur derrière le lit, coussins ou façades de cuisine. Indiquez aussi les surfaces à conserver. La demande devient plus facile à comparer, car un résultat ne peut pas déplacer librement la couleur d’un objet à l’autre.",
        "Ajoutez les matières qui comptent pour le projet : bois, textile, peinture mate ou métal, par exemple. La chambre bleu pétrole associe un mur profond, du noyer et du linge blanc. Cette combinaison sert d’illustration ; elle n’impose pas la même solution à toutes les chambres."
      ], examples: ["chambre-bleu-petrole"] },
      { title: "Comparer des variantes qui changent un choix à la fois", paragraphs: [
        "Pour départager deux couleurs de mur, essayez de garder les mêmes meubles et le même cadrage. Si le sol, le lit et l’éclairage changent aussi, vous ne saurez plus ce qui explique votre préférence. Identifiez les versions avec un nom court et la différence principale.",
        "Conservez une version de référence et notez les raisons de votre choix : contraste trop fort, bois trop sombre, textiles peu cohérents. Une correction formulée à partir de ces observations sera plus précise qu’une demande de rendre la pièce simplement « plus premium »."
      ] },
      { title: "Vérifier les matériaux avant toute décision réelle", paragraphs: [
        "Une couleur affichée à l’écran varie avec la photographie, la lumière et le réglage de l’appareil utilisé pour la regarder. Ne choisissez pas une référence de peinture uniquement à partir d’un rendu. Comparez des échantillons dans la pièce, à différents moments, avant de décider.",
        "La même prudence s’applique aux matières : un bois ou un tissu généré n’est pas une référence de produit. Utilisez le visuel pour définir une direction, puis recherchez et vérifiez les matériaux réels. Si vous partagez le projet, indiquez clairement les éléments encore à choisir."
      ] }
    ]
  },
  {
    slug: "organiser-fichiers-photos-logements", topic: "Organisation", category: "Fichiers & versions",
    title: "Organiser les photos de plusieurs logements sans mélanger les versions.",
    seoTitle: "Organiser les photos de logements : originaux et retouches",
    description: "Classez les originaux, demandes, propositions et exports par logement pour retrouver les bonnes photos et éviter de publier une ancienne version.",
    intro: "Quand plusieurs logements et plusieurs retouches se croisent, un nom comme « photo-finale-2 » devient vite insuffisant. Une organisation simple permet de retrouver l’original, de savoir ce qui a été validé et de vérifier quel fichier est destiné à chaque page.",
    related: ["formats-poids-photos-site-immobilier", "coherence-decoration-plusieurs-photos", "preparer-logement-seance-photo"],
    sections: [
      { title: "Créer un dossier identifiable pour chaque logement", paragraphs: [
        "Choisissez un identifiant stable et une date de séance. Évitez d’utiliser uniquement un prénom ou un nom de pièce, qui peut se retrouver dans plusieurs dossiers. À l’intérieur, séparez les originaux, les propositions et les fichiers retenus pour diffusion.",
        "Gardez les originaux tels qu’ils ont été reçus. Si vous renommez des copies pour travailler plus facilement, conservez une correspondance avec le fichier de départ. Cette trace aide à retrouver une photo en pleine résolution lorsqu’un export a été recadré ou comprimé."
      ] },
      { title: "Associer chaque demande à une vue précise", paragraphs: [
        "Nommez les vues par pièce et angle : salon-vers-cuisine ou chambre-depuis-porte, par exemple. Joignez la demande de retouche et les contraintes à conserver. Une demande envoyée seule, sans identifiant de photo, peut être appliquée à la mauvaise pièce lorsque plusieurs séries se ressemblent.",
        "Pour une décoration cohérente sur plusieurs angles, ajoutez un petit document de référence : palette, meubles retenus et éléments fixes. Il ne remplace pas les photos, mais évite de reconstituer les décisions à partir d’une longue suite de messages."
      ] },
      { title: "Séparer la dernière version de la version validée", paragraphs: [
        "Le fichier le plus récent n’est pas toujours celui qu’il faut publier. Une correction peut résoudre un détail tout en créant un autre problème. Identifiez explicitement les propositions retenues et gardez les essais dans un autre dossier.",
        "Vous pouvez utiliser une liste simple : nom du fichier, usage prévu, contrôle effectué et date de validation. Pour une image de projet, ajoutez la mention de transformation virtuelle à reprendre dans la page. Cette information ne doit pas se perdre entre la personne qui prépare le visuel et celle qui l’intègre."
      ] },
      { title: "Contrôler la destination avant de remplacer une image", paragraphs: [
        "Avant toute mise à jour, vérifiez le logement, la pièce, l’état représenté et la version choisie. Comparez aussi le texte alternatif et la légende de la page existante : ils peuvent devenir inexacts avec une nouvelle photo. Conservez une copie du fichier remplacé et de son contexte pour pouvoir revenir en arrière.",
        "Après publication, ouvrez la page comme un visiteur et contrôlez le recadrage sur téléphone. Notez quelle version est effectivement visible. La présence d’un fichier dans un dossier « validé » ne prouve pas qu’il a été intégré au bon endroit ni que son affichage est correct."
      ], checklist: ["Chaque fichier appartient à un logement et une vue identifiés.", "L’original est conservé.", "La version retenue se distingue des essais.", "La page publiée est relue avec sa légende et son texte alternatif."] }
    ]
  },
  {
    slug: "photographier-exterieur-logement", topic: "Pièce par pièce", category: "Façade & jardin",
    title: "Photographier l’extérieur d’un logement : façade, entrée et environnement.",
    seoTitle: "Photographier l’extérieur d’un logement pour une annonce",
    description: "Choisissez des vues de façade, d’entrée et de jardin qui expliquent le logement et ses accès, avec une lumière lisible et un environnement fidèle.",
    intro: "Une belle façade ne suffit pas toujours à comprendre où se trouve l’entrée ou ce qui appartient au logement. Préparez une vue d’ensemble, puis les accès et les extérieurs utiles. Gardez une représentation cohérente du bâtiment et de son environnement.",
    related: ["photographier-terrasse-balcon", "redresser-perspective-photo-immobiliere", "choisir-photos-annonce-location"],
    sections: [
      { title: "Choisir une lumière qui laisse lire le bâtiment", paragraphs: [
        "Observez la façade avant de photographier. Une forte ombre peut masquer l’entrée tandis qu’une zone en plein soleil devient presque blanche. Si vous le pouvez, revenez lorsque la lumière rend mieux les volumes. Faites plusieurs essais et regardez les matériaux, pas seulement la couleur du ciel.",
        "Évitez de pousser la saturation pour compenser un temps couvert. Une photographie douce peut montrer correctement une façade. Si vous préparez un projet d’embellissement virtuel, distinguez-le des vues de l’état actuel et indiquez les changements proposés."
      ] },
      { title: "Montrer l’entrée et le cheminement", paragraphs: [
        "Une seconde vue peut expliquer l’accès depuis un portail, une cour ou un escalier. Gardez visibles les repères nécessaires pour comprendre le trajet. Si vous photographiez depuis l’espace public, évitez d’inclure inutilement des passants, des plaques lisibles ou des détails privés chez les voisins.",
        "Ne laissez pas l’angle suggérer qu’une entrée partagée est privative. Une légende factuelle peut préciser la configuration lorsque l’image reste ambiguë. Pour une information pratique importante, vérifiez le texte de l’annonce plutôt que de laisser le lecteur tirer une conclusion du cadrage."
      ] },
      { title: "Distinguer le jardin montré du jardin accessible", paragraphs: [
        "Depuis une fenêtre ou une terrasse, la vue peut inclure un terrain voisin ou un espace commun. Photographier ce paysage n’implique pas qu’il soit accessible aux occupants. Choisissez les légendes et l’ordre des images pour que cette distinction soit compréhensible.",
        "Montrez les équipements réellement proposés dans leur configuration actuelle. Si une piscine, une terrasse ou un mobilier extérieur a un usage saisonnier, la description doit apporter les précisions utiles. Une photo ancienne peut nécessiter une mise à jour même si sa lumière reste plus flatteuse."
      ] },
      { title: "Vérifier les détails après recadrage ou retouche", paragraphs: [
        "Contrôlez les fenêtres, les garde-corps, les limites du terrain et les accès. Redresser une façade ne doit pas faire disparaître un élément important du cadre. Un outil génératif peut aussi modifier une végétation ou un bâtiment en arrière-plan : relisez ces zones avant de retenir l’image.",
        "Pour la couverture, choisissez une photographie représentative plutôt qu’une vue spectaculaire prise depuis un endroit que le visiteur ne retrouvera pas. Les vues complémentaires pourront expliquer le jardin, les accès et le lien avec l’intérieur. Chaque image doit avoir un rôle précis dans la visite."
      ], checklist: ["L’entrée et le bâtiment sont reconnaissables.", "Les espaces privés et partagés sont décrits correctement.", "Le mobilier et les équipements correspondent à l’offre actuelle.", "L’environnement reste fidèle après retouche."] }
    ]
  }
];
export const PROJECT_GUIDES: readonly BlogArticle[] = guides.map(guide => ({ ...guide, date: "2026-10-02", status: "published" }));

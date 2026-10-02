import type { BlogArticle } from "./articles";

const guides: Omit<BlogArticle, "date" | "status">[] = [
  {
    slug: "photographier-salon-annonce-immobiliere", topic: "Pièce par pièce", category: "Salon",
    title: "Photographier un salon : montrer l’espace sans tout faire entrer dans l’image.",
    seoTitle: "Photo de salon pour une annonce : cadrage et préparation",
    description: "Préparez le salon, choisissez deux angles complémentaires et contrôlez les proportions pour obtenir des photos lisibles de votre pièce de vie.",
    coverExample: "salon-canape-rouille", coverCaption: "Une proposition de décoration autour d’un canapé existant, à comparer avec la photo de départ.",
    intro: "La photo du salon doit expliquer où l’on s’assoit, comment on circule et ce qui relie la pièce au reste du logement. Deux vues bien choisies sont souvent plus utiles qu’un très grand angle qui rassemble tous les murs en déformant les meubles.",
    related: ["photos-immobilieres-smartphone", "photographier-petite-piece", "demande-retouche-photo-immobiliere"],
    sections: [
      { title: "Préparer les surfaces que l’on remarque en premier", paragraphs: [
        "Regardez le canapé, la table basse et le meuble télévision. Remettez les coussins en place, retirez les télécommandes dispersées et rangez les câbles mobiles. Éteignez l’écran si son contenu détourne le regard. Il n’est pas nécessaire de vider toute la pièce : gardez les objets qui décrivent son usage, comme une lampe de lecture ou une table d’appoint.",
        "Faites ensuite une première photo de contrôle. Un objet discret dans la pièce peut devenir très visible à l’image parce qu’il se trouve au premier plan. Déplacez-vous légèrement avant de déplacer le mobilier : parfois, quelques pas suffisent à éviter qu’un dossier de chaise cache tout le canapé."
      ] },
      { title: "Choisir l’angle qui explique la circulation", paragraphs: [
        "Essayez une vue depuis l’entrée ou un angle dégagé. Cherchez une composition qui montre l’assise principale et au moins un passage utile. Si vous devez coller le téléphone au mur et employer le plus grand angle pour tout inclure, acceptez de diviser la présentation en deux photos.",
        "Sur la seconde vue, montrez ce que la première ne dit pas : une cuisine ouverte, un accès à la terrasse ou un espace repas. Conservez des repères communs pour comprendre que les deux images décrivent le même salon. Une porte aperçue sur l’une puis retrouvée sur l’autre suffit parfois à orienter le lecteur."
      ] },
      { title: "Surveiller les fenêtres et les bords du cadre", paragraphs: [
        "Une fenêtre très lumineuse peut assombrir le canapé dans la photographie. Essayez de vous décaler pour que l’ouverture ne domine pas toute la composition. Comparez plusieurs expositions et retenez celle où les matières restent lisibles. Si les conditions sont trop contrastées, revenez à une heure plus favorable.",
        "Agrandissez les coins de l’image. Un accoudoir anormalement étiré ou une table qui semble pencher peut venir du cadrage. Reprendre la vue avec le téléphone plus droit produit souvent une meilleure base qu’une correction importante après coup."
      ] },
      { title: "Choisir entre retouche légère et projet décoratif", paragraphs: [
        "Si le salon doit apparaître dans son état actuel, limitez la demande aux défauts de la photographie. Si vous souhaitez changer des meubles ou des textiles, présentez le résultat comme une projection. L’exemple au canapé rouille conserve un élément fort et propose une autre décoration autour : il illustre ce second usage.",
        "Pour sélectionner votre couverture, comparez les vues en petit format. La meilleure photo n’est pas forcément celle qui montre le plus d’objets, mais celle dont on comprend immédiatement la pièce. Gardez la vue complémentaire pour la suite de la visite."
      ], examples: ["salon-canape-rouille"], checklist: ["Le canapé et les passages sont lisibles.", "Les objets proches des bords ne sont pas étirés.", "Chaque vue apporte une information différente."] }
    ]
  },
  {
    slug: "photographier-chambre-location", topic: "Pièce par pièce", category: "Chambre",
    title: "Photographier une chambre : le couchage, les rangements et la lumière.",
    seoTitle: "Photo de chambre pour une location : les vues utiles",
    description: "Montrez clairement le lit, les accès et les rangements de votre chambre, avec des conseils de préparation du linge et de cadrage.",
    coverExample: "chambre-terracotta", coverCaption: "Cette version terracotta représente une décoration possible, distincte de l’état visible sur l’original.",
    intro: "Une chambre ne se résume pas à un lit bien fait. Le lecteur veut aussi comprendre les accès, la fenêtre et les rangements. Préparez une vue principale accueillante, puis les détails nécessaires pour décrire le couchage proposé.",
    related: ["preparer-logement-seance-photo", "balance-blancs-photo-interieur", "choisir-photos-annonce-location"],
    sections: [
      { title: "Faire le lit dans la configuration réellement proposée", paragraphs: [
        "Lissez le drap, alignez la couette et replacez les oreillers. Utilisez le linge habituellement prévu pour ce logement, ou un ensemble représentatif de ce que vous fournirez. Une accumulation de coussins peut masquer le couchage et donner une impression encombrée dans une petite chambre.",
        "Si deux lits peuvent être rapprochés, documentez les configurations dont vous parlez dans l’annonce. La photographie ne permet pas toujours de distinguer deux matelas accolés d’un grand matelas. Une légende factuelle complète l’image, en précisant la configuration disponible sans obliger le lecteur à la deviner."
      ] },
      { title: "Placer le lit sans perdre les accès", paragraphs: [
        "Cherchez une vue depuis laquelle le lit se reconnaît immédiatement, avec assez de sol visible pour comprendre le passage. Évitez de cadrer si bas que le pied du lit remplit l’image. Si le recul est limité, faites une vue d’ensemble mesurée puis une vue complémentaire des rangements.",
        "Contrôlez les montants de porte et les côtés de l’armoire. Si le meuble paraît incliné, redressez le téléphone avant de reprendre la photo. Un très grand angle près du lit peut exagérer sa longueur : comparez la photographie à la pièce plutôt qu’à une idée de chambre plus vaste."
      ] },
      { title: "Garder les couleurs du linge et des murs plausibles", paragraphs: [
        "La combinaison d’une lampe de chevet et de la lumière du jour peut donner deux couleurs au même drap blanc. Faites un essai avec les lampes puis sans elles, et choisissez la version où l’ambiance reste lisible. Vérifiez que les murs ne changent pas artificiellement de couleur lors d’une correction.",
        "Dans une projection décorative, indiquez précisément les éléments transformés. Notre chambre terracotta associe de nouvelles teintes et des textiles : l’image sert à explorer un style, pas à attester d’un couchage déjà préparé pour des voyageurs."
      ], examples: ["chambre-terracotta"] },
      { title: "Compléter la série avec les informations manquantes", paragraphs: [
        "Une deuxième photo peut montrer le placard, le coin bureau ou l’accès à une salle d’eau. Gardez-la si elle répond à une question réelle. Un gros plan sur les oreillers ne remplace pas la vue d’un rangement annoncé dans la description.",
        "Avant de retenir la série, comparez le nombre de couchages, le mobilier visible et les légendes. Ne déduisez pas une dimension exacte de lit à partir de l’image : vérifiez-la directement. Les mêmes contrôles évitent les incohérences si vous remplacez plus tard une seule photo."
      ], checklist: ["Le type de couchage est compréhensible.", "Les passages et l’accès au lit restent visibles.", "Les rangements annoncés sont documentés."] }
    ]
  },
  {
    slug: "photographier-cuisine-annonce", topic: "Pièce par pièce", category: "Cuisine",
    title: "Photographier une cuisine : montrer l’implantation et les équipements.",
    seoTitle: "Photographier une cuisine pour une annonce immobilière",
    description: "Plan de travail, façades, appareils et reflets : préparez les vues de votre cuisine et distinguez ses équipements d’un projet de rénovation.",
    coverExample: "cuisine-prune-bois", coverCaption: "Une proposition de façades et de matières ; la cuisine actuelle reste visible dans la comparaison.",
    intro: "Dans une cuisine, une seule image peut réunir beaucoup de petites informations. Commencez par l’implantation : où prépare-t-on les repas, où cuisine-t-on et où s’installe-t-on ? Les vues rapprochées viendront ensuite préciser les équipements.",
    related: ["reflets-miroirs-vitres-photo", "coherence-decoration-plusieurs-photos", "choisir-photos-annonce-location"],
    sections: [
      { title: "Dégager le plan de travail sans cacher la fonction", paragraphs: [
        "Rangez la vaisselle en attente, les produits ménagers et les emballages. Gardez quelques appareils réellement proposés s’ils aident à comprendre l’usage de la cuisine. Une cafetière peut rester visible ; plusieurs sacs de courses au premier plan compliquent la lecture sans apporter d’information.",
        "Vérifiez les façades, la crédence et la hotte avant de photographier. Les traces de doigts deviennent visibles sur les surfaces brillantes. Fermez les portes et tiroirs pour la vue principale, puis réalisez au besoin une photo dédiée d’un rangement que vous voulez expliquer."
      ] },
      { title: "Montrer les équipements sans déformer les meubles", paragraphs: [
        "Choisissez une vue qui relie l’évier, la cuisson et la zone de préparation. S’il est impossible de les réunir proprement, faites deux images complémentaires. Gardez le téléphone droit : les lignes régulières des placards rendent immédiatement visibles les perspectives trop inclinées.",
        "Ne cherchez pas à prouver la présence de chaque appareil sur la couverture. Une légende peut préciser qu’un lave-vaisselle intégré se trouve sous le plan de travail, après vérification. La photo doit rester lisible, et la description des équipements doit être exacte."
      ] },
      { title: "Contrôler les reflets sur les façades", paragraphs: [
        "Le four, le réfrigérateur et une crédence brillante peuvent refléter le photographe ou une fenêtre très claire. Déplacez-vous légèrement et observez les reflets sur l’écran avant de déclencher. Ce déplacement change souvent le problème sans avoir à modifier la pièce.",
        "Après une retouche, examinez les poignées, les joints et les petits appareils. Des lignes régulières qui se brisent, une porte de four changée ou un robinet déplacé doivent faire reprendre le résultat. Une surface plus propre visuellement ne justifie pas d’effacer un équipement."
      ] },
      { title: "Présenter une nouvelle cuisine comme un projet", paragraphs: [
        "La proposition prune et bois explore une autre palette en conservant l’implantation. Si vous utilisez ce type d’image, indiquez les façades, matières et meubles virtuellement modifiés. Conservez l’original pour que la transformation soit compréhensible.",
        "Pour une annonce qui présente la cuisine disponible aujourd’hui, utilisez les vues actuelles comme référence principale. Pour préparer un projet, complétez le visuel par des mesures et un inventaire des contraintes. Une image ne renseigne pas à elle seule sur les réseaux ni sur la possibilité de déplacer un appareil."
      ], examples: ["cuisine-prune-bois"], checklist: ["Le plan de travail se lit sans encombrement.", "Les équipements de la description correspondent aux vues.", "Les façades et les poignées restent cohérentes après retouche."] }
    ]
  },
  {
    slug: "photographier-salle-de-bain", topic: "Pièce par pièce", category: "Salle de bain",
    title: "Photographier une salle de bain : composer avec les miroirs et le manque de recul.",
    seoTitle: "Photo de salle de bain : miroirs, recul et équipements",
    description: "Préparez une salle de bain pour les photos, évitez les reflets gênants et montrez la douche, la vasque et les accès sans déformer la pièce.",
    intro: "Une salle de bain concentre plusieurs difficultés : peu de recul, surfaces brillantes et miroir face à l’entrée. Plutôt que de forcer une vue unique, construisez une petite série où chaque équipement important est identifiable.",
    related: ["reflets-miroirs-vitres-photo", "photographier-petite-piece", "preparer-logement-seance-photo"],
    sections: [
      { title: "Préparer les surfaces et les petits accessoires", paragraphs: [
        "Séchez les parois de douche, nettoyez le miroir et retirez les produits personnels que vous ne souhaitez pas montrer. Replacez le tapis et les serviettes sans remplir chaque surface d’accessoires. Les petites pièces paraissent vite confuses lorsque plusieurs flacons masquent les contours de la vasque.",
        "Faites une photo de contrôle avant de ranger le matériel de nettoyage. Les traces d’eau se voient parfois seulement à l’écran, surtout près d’une source lumineuse. Vérifiez également ce que reflète le miroir : une porte ouverte peut révéler des affaires personnelles dans la pièce voisine."
      ] },
      { title: "Chercher un angle où le miroir aide à lire l’espace", paragraphs: [
        "Placez-vous légèrement sur le côté et observez si vous pouvez montrer la vasque sans apparaître au centre du miroir. Gardez le téléphone droit et ajustez votre position par petits déplacements. Si l’évitement du reflet oblige à couper toute la douche, mieux vaut produire deux vues.",
        "Ne cherchez pas à transformer un miroir en surface vide par une retouche approximative. Son reflet doit rester cohérent avec les ouvertures et les objets de la pièce. Un reflet flou ou inventé peut rendre l’image moins compréhensible que la présence discrète du photographe sur un document de travail."
      ] },
      { title: "Rendre la douche et les accès identifiables", paragraphs: [
        "Une vue générale peut montrer la vasque et l’accès à la douche ; une seconde précise la baignoire ou un espace situé derrière la porte. Évitez de vous placer si près d’un lavabo qu’il occupe la moitié de l’image. Montrez un peu de sol pour rendre les passages plus lisibles.",
        "Si vous souhaitez documenter un accès ou un équipement particulier, faites une photo dédiée. N’en déduisez pas une qualification d’accessibilité sur la seule base d’un grand angle : mesures et caractéristiques doivent être vérifiées séparément. La photographie apporte une information visuelle, sans remplacer ces contrôles."
      ] },
      { title: "Conserver les joints, les textures et les équipements", paragraphs: [
        "En retouche, une correction légère de lumière peut rendre le carrelage plus lisible. Vérifiez toutefois les joints, la robinetterie et les bords du miroir. Si un outil lisse les surfaces au point de faire disparaître un défaut réel, la photo ne représente plus correctement l’état actuel.",
        "Pour une rénovation virtuelle, séparez clairement le projet des vues actuelles. Un nouveau revêtement ou une douche plus grande peut servir à discuter d’une idée, mais son implantation doit être étudiée avec les mesures de la pièce. Gardez toujours la série d’origine dans votre dossier."
      ], checklist: ["Le miroir ne révèle pas d’éléments personnels indésirables.", "La douche ou la baignoire est identifiable.", "Les formes et les joints restent cohérents.", "Chaque équipement présenté existe dans la configuration décrite."] }
    ]
  },
  {
    slug: "photographier-terrasse-balcon", topic: "Pièce par pièce", category: "Terrasse & balcon",
    title: "Photographier une terrasse ou un balcon : montrer l’usage et l’environnement.",
    seoTitle: "Photos de terrasse et balcon : cadrage, lumière et mobilier",
    description: "Choisissez les vues qui expliquent l’accès, les places assises et l’environnement de votre terrasse ou balcon, sans exagérer les dimensions.",
    coverExample: "terrasse-mobilier-teck", coverCaption: "Un aménagement virtuel en teck, présenté avec la terrasse d’origine pour distinguer les meubles proposés des meubles existants.",
    intro: "Une terrasse peut servir de coin repas, de lieu de détente ou de simple ouverture sur l’extérieur. Montrez ce que l’on peut réellement y faire, puis le lien avec le logement. Le mobilier et la lumière doivent aider à lire cet espace, sans masquer ses contraintes.",
    related: ["photographier-exterieur-logement", "choisir-photos-annonce-location", "home-staging-virtuel-photo-annonce"],
    sections: [
      { title: "Montrer comment on arrive sur l’extérieur", paragraphs: [
        "Commencez par une vue qui relie la porte du logement à la terrasse ou au balcon. Les marches, seuils et passages aident à comprendre l’accès. Une photographie prise uniquement vers l’horizon peut être agréable, mais elle laisse souvent la configuration de l’espace inexpliquée.",
        "Faites ensuite une seconde vue depuis l’extérieur vers la façade si elle apporte une information utile. Évitez d’inclure inutilement des voisins ou des éléments privés. Déplacez le cadrage pour limiter ces présences plutôt que de compter sur une suppression numérique systématique."
      ] },
      { title: "Disposer le mobilier selon un usage réel", paragraphs: [
        "Rangez les accessoires dispersés et placez les chaises de manière à laisser les passages dégagés. Si vous montrez un repas pour quatre personnes, vérifiez que le mobilier et l’espace permettent réellement cette utilisation. Une table mise en scène trop près du bord peut donner une idée fausse du confort disponible.",
        "Pour un projet d’aménagement, précisez quels meubles sont virtuels. Notre terrasse en teck explore une autre disposition avec des bains de soleil et un coin repas. Cette image permet de discuter d’une ambiance ; elle n’atteste pas que ces équipements sont fournis avec une location."
      ], examples: ["terrasse-mobilier-teck"] },
      { title: "Faire attention au contraste entre ombre et soleil", paragraphs: [
        "Regardez les zones d’ombre créées par une avancée de toit ou un parasol. Si les coussins sont presque noirs et la façade entièrement blanche, testez un moment où le contraste est moins fort. Photographiez plusieurs expositions plutôt que de chercher uniquement l’image la plus lumineuse.",
        "Gardez une couleur de bois et de végétation plausible. Une saturation trop forte peut transformer une terrasse vieillie en aménagement neuf. Les traces d’usage, les équipements et l’environnement doivent rester reconnaissables lorsque la photo présente l’état actuel."
      ] },
      { title: "Compléter la photo par les précisions qu’elle ne donne pas", paragraphs: [
        "Une image n’explique pas toujours si un espace est privatif, partagé ou disponible seulement à certaines périodes. Ajoutez les précisions exactes dans la description. Si le point de vue montre un jardin qui n’est pas accessible, évitez une légende qui laisse penser qu’il fait partie de l’offre.",
        "Relisez enfin les proportions : un balcon étroit peut sembler très profond avec un objectif très large. Faites une vue plus modérée et, si la dimension est importante, fournissez une mesure vérifiée. La lisibilité de l’espace compte davantage qu’un effet d’agrandissement."
      ] }
    ]
  },
  {
    slug: "photographier-petite-piece", topic: "Pièce par pièce", category: "Petits espaces",
    title: "Photographier une petite pièce sans la faire paraître immense.",
    seoTitle: "Photographier une petite pièce : recul et grand angle",
    description: "Manque de recul, meubles au premier plan, grand angle : choisissez des cadrages qui expliquent un petit espace en respectant ses proportions.",
    intro: "Dans une petite pièce, la tentation est de choisir l’objectif le plus large et de se placer dans un coin. Cette solution peut montrer davantage d’éléments, mais elle peut aussi déformer les meubles. Cherchez d’abord les informations à transmettre, puis répartissez-les entre plusieurs vues.",
    related: ["redresser-perspective-photo-immobiliere", "photographier-salle-de-bain", "photographier-chambre-location"],
    sections: [
      { title: "Décider ce que la première image doit montrer", paragraphs: [
        "Pour un studio, la première vue peut expliquer la relation entre couchage, repas et kitchenette. Pour une petite chambre, elle peut montrer le lit et l’accès. Choisissez cette priorité avant le cadrage. Si la photo ne permet plus de reconnaître son sujet, inclure un quatrième mur ne l’améliore pas.",
        "Faites une seconde image de ce qui reste hors champ. Un placard, un bureau ou une salle d’eau peuvent être présentés séparément. Conservez un repère commun lorsque c’est possible, afin que le lecteur puisse relier les vues sans avoir besoin d’un plan imaginaire."
      ] },
      { title: "Utiliser l’entrée comme point de recul", paragraphs: [
        "Essayez de photographier depuis l’encadrement de la porte ou juste à l’extérieur, en laissant suffisamment d’espace dans le cadre pour reconnaître la pièce. Vérifiez qu’une tranche de mur très proche ne masque pas le sujet. Un léger déplacement latéral peut améliorer la vue plus efficacement qu’un élargissement supplémentaire de l’objectif.",
        "Gardez le téléphone aussi droit que possible. Incliner fortement vers le bas pour récupérer davantage de sol peut faire basculer les murs. Si vous devez choisir, privilégiez la cohérence du volume et ajoutez une autre vue pour le détail manquant."
      ] },
      { title: "Surveiller les objets proches des bords", paragraphs: [
        "Les meubles les plus proches de l’objectif peuvent prendre une importance excessive. Une chaise au bord du cadre paraît parfois plus large que le lit au fond. Observez ces rapports et essayez une position un peu plus éloignée ou une focale moins large lorsque l’espace le permet.",
        "Après une correction de perspective, vérifiez de nouveau les proportions. Redresser les lignes ne garantit pas que chaque objet retrouve une forme naturelle. Si le résultat impose une déformation importante ou coupe un équipement essentiel, la seconde prise de vue reste une meilleure solution."
      ] },
      { title: "Décrire les usages sans déduire les dimensions de l’image", paragraphs: [
        "Une photographie peut montrer qu’un passage existe, mais elle ne permet pas de certifier sa largeur. Si vous annoncez une dimension, vérifiez-la sur place. De même, un aménagement virtuel ne prouve pas qu’un canapé-lit pourra se déplier sans toucher la table.",
        "Pour comparer plusieurs propositions de décoration dans un petit espace, gardez le même cadrage et la même photographie de référence. Vous pourrez alors discuter des meubles, sans que le changement de point de vue donne à tort l’impression d’avoir gagné de la place."
      ], checklist: ["La fonction principale de la pièce est claire.", "Les meubles des bords ne paraissent pas étirés.", "Une seconde vue complète ce qui ne tient pas dans la première.", "Les dimensions annoncées ont été mesurées."] }
    ]
  }
];
export const ROOM_GUIDES: readonly BlogArticle[] = guides.map(guide => ({ ...guide, date: "2026-10-02", status: "published" }));

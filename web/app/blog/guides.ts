import type { BlogArticle } from "./articles";

/** Editorial content prepared locally on 2 October 2026; deployment is a separate step. */
export const SEO_GUIDES: readonly BlogArticle[] = [
  {
    slug: "photos-immobilieres-smartphone", status: "published", date: "2026-10-02",
    category: "Prise de vue", seoTitle: "Photos immobilières au smartphone : le guide pratique",
    title: "Photographier un logement au smartphone : préparer, cadrer, vérifier.",
    description: "Lumière, cadrage, verticales et choix des fichiers : une méthode simple pour préparer les photos de votre logement avec un téléphone.",
    coverExample: "salon-lumiere-naturelle",
    coverCaption: "Un exemple de mise en valeur à comparer avec son original. Il illustre le contrôle après retouche, pas une séance réalisée au smartphone.",
    intro: "Une photo utile permet de comprendre la pièce : sa forme, ses ouvertures et la place du mobilier. Avant de chercher un effet spectaculaire, préparez une petite série cohérente. Voici une méthode à suivre sur place, puis au moment de sélectionner les fichiers.",
    related: ["eclaircir-photo-interieur-sombre", "choisir-photos-annonce-location", "demande-retouche-photo-immobiliere"],
    sections: [
      { title: "Préparer la pièce avant de sortir le téléphone", paragraphs: [
        "Commencez par nettoyer l’objectif avec un tissu adapté : une trace peut produire un voile autour des fenêtres et des lampes. Dans la pièce, remettez les coussins en place, lissez le linge et retirez les objets personnels que vous ne souhaitez pas montrer. Une bouteille ou un câble se range plus facilement avant la prise de vue qu’après.",
        "Conservez ce qui sera réellement disponible dans le logement. Si vous préparez une location, photographiez les couchages et les équipements dans leur configuration habituelle. Pour un projet de vente avec une décoration virtuelle, gardez une série originale distincte : elle restera votre référence pour contrôler les transformations."
      ] },
      { title: "Chercher une lumière régulière", paragraphs: [
        "Observez la pièce à plusieurs moments de la journée si vous le pouvez. Une lumière diffuse est souvent plus simple à photographier qu’un rayon direct qui coupe le canapé en deux. Ouvrez les rideaux, puis regardez les zones proches et éloignées de la fenêtre. Si les unes sont entièrement blanches et les autres presque noires, essayez un autre angle ou un autre moment.",
        "Sur l’écran, touchez une zone représentative de la pièce pour régler la mise au point et ajustez l’exposition si votre téléphone le permet. Comparez une photo légèrement plus claire et une autre plus sombre. Gardez celle qui conserve le mieux les détails utiles, sans compter sur la retouche pour recréer ce qui n’est plus visible."
      ], links: [{ label: "Que faire si la photo d’intérieur reste trop sombre ?", href: "/blog/eclaircir-photo-interieur-sombre/" }] },
      { title: "Garder les murs droits et les proportions compréhensibles", paragraphs: [
        "Activez la grille de cadrage si elle est disponible. Tenez le téléphone sans le pencher vers le plafond ou le sol, et comparez les bords de l’image aux montants d’une porte. Si les verticales convergent fortement, reculez ou changez de position avant de déclencher. Évitez le mode portrait avec arrière-plan flou : le lecteur a besoin de voir la pièce entière.",
        "Commencez avec l’objectif principal. Un très grand angle peut être pratique dans une petite pièce, mais les objets proches des bords paraissent parfois étirés. Vérifiez le lit, les chaises et les portes. Si la pièce semble beaucoup plus large qu’en réalité, faites une seconde vue plus mesurée plutôt que de chercher à tout montrer dans une seule image."
      ] },
      { title: "Faire une vue d’ensemble, puis une vue qui complète", paragraphs: [
        "Pour un salon, une première photo peut montrer les assises et les ouvertures ; une seconde peut expliquer la liaison avec la cuisine. Dans une chambre, montrez le couchage puis, si nécessaire, les rangements ou l’accès. Chaque vue doit apporter une information nouvelle. Une série de photos presque identiques rend le tri plus difficile.",
        "Pour une annonce Airbnb, la plateforme recommande notamment des prises de vue de jour et au format paysage. Contrôlez aussi le recadrage de la couverture : un élément placé tout au bord peut disparaître dans une vignette. Un détail décoratif peut compléter la série, mais il ne remplace pas une vue lisible de la pièce."
      ] },
      { title: "Trier avant de retoucher", paragraphs: [
        "Ouvrez les fichiers à leur taille réelle et regardez les contours du mobilier, les reflets et les tissus. Une petite image semble parfois nette alors que le fichier est flou. Gardez les originaux en pleine résolution et évitez de travailler à partir d’une capture d’écran ou d’une version déjà compressée par une messagerie.",
        "Quand le cadrage et la netteté sont bons, une correction de lumière ou de couleur peut suffire. L’avant/après du salon ci-dessous sert de point de comparaison : contrôlez autant les ouvertures et les équipements que l’impression générale. Si une retouche modifie une caractéristique du logement, reprenez-la avant d’utiliser l’image."
      ], examples: ["salon-lumiere-naturelle"], checklist: [
        "La photo est nette lorsqu’on l’agrandit.", "Les portes et les murs ne donnent pas une impression de basculement.",
        "Les fenêtres, les équipements et le mobilier important sont reconnaissables.", "Le fichier original est conservé séparément."
      ] }
    ],
    sources: [{ label: "Airbnb — Prendre de belles photos de votre logement", href: "https://www.airbnb.fr/help/article/746" }]
  },
  {
    slug: "eclaircir-photo-interieur-sombre", status: "published", date: "2026-10-02",
    category: "Lumière & retouche", seoTitle: "Éclaircir une photo d’intérieur sans dénaturer la pièce",
    title: "Une photo d’intérieur trop sombre : que corriger, et quand la refaire ?",
    description: "Exposition, couleurs, fenêtres et détails : apprenez à éclaircir une photo immobilière sombre et à reconnaître les limites d’une retouche.",
    coverExample: "salon-lumiere-naturelle", coverCaption: "Le salon de Ruaudin : une proposition de mise en valeur à relire en regard de l’original.",
    intro: "Votre pièce est agréable à vivre, mais la photo paraît sombre ou jaunâtre. Tout éclaircir d’un coup n’est pas toujours la bonne réponse. Commencez par distinguer un problème d’exposition, un mélange de lumières et un fichier qui manque réellement de détails.",
    related: ["photos-immobilieres-smartphone", "demande-retouche-photo-immobiliere", "retouche-photo-immobiliere-exemples-avant-apres"],
    sections: [
      { title: "Identifier ce qui gêne dans la photographie", paragraphs: [
        "Regardez d’abord la photo entière, puis trois zones : le fond de la pièce, une surface supposée neutre et la fenêtre. Si le fond est sombre mais que le reste paraît naturel, une correction localisée peut être préférable à une hausse générale de luminosité. Si tout tire vers le jaune ou le bleu, la couleur de la lumière est aussi en cause.",
        "Une fenêtre blanche ne signifie pas forcément que toute l’image est inutilisable. En revanche, si un élément important n’est plus visible, une retouche ne peut pas garantir de le restituer fidèlement. Évitez de demander à un outil de deviner une vue extérieure, la matière d’un sol ou un détail d’équipement absent du fichier."
      ] },
      { title: "Séparer luminosité et couleur", paragraphs: [
        "Augmentez progressivement la luminosité, puis observez les zones claires. Le linge blanc doit garder ses plis et un mur éclairé ses nuances. Si ces détails disparaissent avant que le fond de la pièce soit lisible, travaillez plutôt sur les ombres ou sur une zone précise, selon les réglages disponibles dans votre outil.",
        "Ajustez ensuite la dominante de couleur. Une lampe chaude et la lumière bleutée d’une fenêtre peuvent coexister dans une même scène : une correction uniforme ne résoudra pas toujours les deux. Cherchez des couleurs plausibles, en vous aidant de votre connaissance de la pièce, sans transformer un parquet miel en bois gris pour obtenir une image plus blanche."
      ] },
      { title: "Écrire une demande qui reste limitée à la photo", paragraphs: [
        "Pour une retouche assistée par IA, indiquez explicitement les limites. Exemple : « Éclaircis légèrement les zones sombres du séjour et atténue la dominante jaune. Garde les couleurs du canapé et du parquet, les meubles, les ouvertures et la vue extérieure. Ne change ni la décoration ni les équipements. » Cette demande permet de repérer plus facilement un résultat qui dépasse l’objectif.",
        "Dans notre exemple de salon à Ruaudin, la proposition concerne aussi la présentation de certains détails. Regardez donc l’image entière : ce n’est pas un étalon d’exposition isolé. Pour votre propre photo, demandez seulement les changements dont vous avez besoin, puis comparez le résultat avec l’original à la même taille."
      ], examples: ["salon-lumiere-naturelle"], links: [{ label: "Rédiger une demande de retouche précise", href: "/blog/demande-retouche-photo-immobiliere/" }] },
      { title: "Reconnaître le moment où une nouvelle prise de vue aide davantage", paragraphs: [
        "Si la photo présente du flou de bougé, beaucoup de grain ou de grandes zones sans détail, revenir sur place peut être plus efficace que multiplier les corrections. Essayez un moment plus lumineux, stabilisez le téléphone et reprenez la photo sans changer la pièce. Une retouche de netteté ne constitue pas une preuve qu’un détail reconstitué existait réellement.",
        "Si vous ne pouvez pas refaire la photo immédiatement, choisissez une autre vue nette pour la couverture. Conservez l’image sombre comme document de travail plutôt que de pousser sa transformation jusqu’à obtenir un intérieur lisse et artificiel. Le lecteur doit pouvoir reconnaître le logement lors de la visite."
      ] },
      { title: "Vérifier le résultat avant de le retenir", paragraphs: [
        "Alternez entre original et résultat. Portez attention aux jonctions entre le mur et le plafond, aux cadres des fenêtres, aux prises et aux reflets. Les petites incohérences se voient parfois mieux en changeant de version qu’en regardant longtemps une seule image.",
        "Terminez par une vérification en petit format, puis sur un écran plus grand si vous en avez un. La photo doit rester lisible en vignette tout en conservant ses détails. Ne jugez pas sa luminosité uniquement avec l’écran du téléphone réglé au maximum."
      ], checklist: ["Les zones claires gardent leurs textures.", "Les couleurs restent cohérentes avec le logement.", "Aucune ouverture ni aucun équipement n’a été ajouté ou effacé.", "La retouche n’a pas remplacé un défaut réel par une surface inventée."] }
    ]
  },
  {
    slug: "home-staging-virtuel-photo-annonce", status: "published", date: "2026-10-02",
    category: "Décoration virtuelle", seoTitle: "Home staging virtuel : usages, exemples et vérifications",
    title: "Home staging virtuel : aider à se projeter, tout en montrant l’état réel.",
    description: "À quoi sert le home staging virtuel ? Découvrez comment préparer un projet de décoration et comparer meubles, volumes et matériaux à l’original.",
    coverExample: "chambre-bleu-petrole", coverCaption: "Cette chambre bleu pétrole est une proposition de décoration : elle ne montre pas des travaux réalisés.",
    intro: "Le home staging virtuel consiste à représenter un autre aménagement sur une photographie : des meubles, des couleurs ou des matières peuvent changer. Il aide à discuter d’une possibilité. Pour rester compréhensible, cette projection doit être présentée avec sa nature et ses limites.",
    related: ["demande-retouche-photo-immobiliere", "retouche-photo-immobiliere-exemples-avant-apres", "choisir-photos-annonce-location"],
    sections: [
      { title: "Distinguer une amélioration de photo d’un projet de décoration", paragraphs: [
        "Corriger une dominante de couleur ou une légère sous-exposition concerne la photographie. Remplacer un canapé, repeindre un mur ou installer une cuisine différente modifie la représentation du logement. Les deux démarches peuvent produire une image agréable, mais elles ne racontent pas la même chose au lecteur.",
        "Dans la chambre bleu pétrole, le mur, la tête de lit et les textiles composent une nouvelle ambiance. La photographie d’origine permet de comprendre ce qui a changé. Utilisez une indication explicite, comme « proposition de décoration virtuelle », à proximité de l’image, et rendez l’état actuel facile à consulter."
      ], examples: ["chambre-bleu-petrole"] },
      { title: "Définir une fonction avant de choisir un style", paragraphs: [
        "Avant de demander un intérieur scandinave ou contemporain, précisez l’usage : un coin repas quotidien, un bureau près d’une prise existante, un salon où circuler avec une poussette. Cette contrainte donne un critère concret pour comparer les propositions. Une image réussie visuellement peut rester peu pratique.",
        "Décrivez ensuite ce qui doit rester : ouvertures, radiateurs, rangements fixes, revêtement de sol ou meuble apprécié. Dans le salon au canapé rouille, la couleur du canapé sert de point de départ. On peut ainsi essayer une table et des textiles sans réinventer chaque objet de la pièce."
      ], examples: ["salon-canape-rouille"] },
      { title: "Contrôler les passages et l’échelle des meubles", paragraphs: [
        "Sur une image, un canapé peut paraître bien placé tout en empêchant l’ouverture d’une porte. Regardez les passages, les zones devant les fenêtres et les dégagements autour du lit. Une photo seule ne permet pas de déduire des mesures fiables : vérifiez les dimensions sur place avant d’acheter du mobilier.",
        "Pour un projet qui modifie des cloisons, des réseaux ou une structure, le visuel reste une piste de discussion. Il ne valide ni la faisabilité des travaux ni leur coût. Séparez ces décisions de la génération d’image et faites vérifier le projet par les intervenants compétents."
      ] },
      { title: "Garder une continuité entre plusieurs vues", paragraphs: [
        "Si une cuisine apparaît sur deux photos, décrivez la même couleur de façades et le même sol dans les deux demandes. Réutilisez une liste courte de choix : bois clair, façades bleu profond, métal noir, par exemple. Comparez ensuite les vues ensemble ; une palette cohérente ne suffit pas si les placards ou les ouvertures changent de place.",
        "Les propositions de cuisine et de séjour à Spay suivent une direction commune. Elles illustrent l’intérêt de relire une série comme un seul espace. Lorsqu’un objet change de forme entre deux résultats, choisissez une version de référence et formulez une correction ciblée."
      ], examples: ["cuisine-bleu-parquet", "sejour-canape-olive"] },
      { title: "Présenter la projection selon son usage", paragraphs: [
        "Dans un dossier de décoration, placez l’original, la proposition et la liste des changements côte à côte. Cela facilite les échanges : chacun peut distinguer le choix de couleur d’un meuble à remplacer. N’utilisez pas seulement « après » si aucun travail n’a été réalisé ; indiquez qu’il s’agit d’une projection.",
        "Pour une location, privilégiez des photos des espaces et des équipements réellement proposés aux voyageurs. Un lit, une terrasse équipée ou un bureau ajouté virtuellement ne doit pas devenir une promesse sur ce qui sera disponible. Si vous partagez une idée d’aménagement futur, présentez-la séparément de la description du séjour actuel."
      ], checklist: ["L’original reste accessible.", "La nature virtuelle du projet est indiquée près de l’image.", "Les portes, fenêtres et équipements fixes sont contrôlés.", "Les mesures et la faisabilité ne sont pas déduites du seul visuel."] }
    ]
  },
  {
    slug: "choisir-photos-annonce-location", status: "published", date: "2026-10-02",
    category: "Annonces & sélection", seoTitle: "Photos d’annonce de location : couverture, ordre et légendes",
    title: "Choisir les photos d’une annonce de location : une visite qui se comprend.",
    description: "Choisissez une couverture représentative, ordonnez vos photos par pièce et écrivez des légendes utiles pour présenter clairement votre location.",
    coverExample: "terrasse-mobilier-teck", coverCaption: "Exemple de terrasse avec mobilier virtuel. Pour une annonce de location, montrez le mobilier réellement disponible ; cette proposition sert ici à expliquer la distinction.",
    intro: "Une belle première image attire le regard, mais les suivantes doivent répondre aux questions du voyageur. Où dort-on ? Comment sont organisées les pièces ? Quels espaces sont privés ? Construisez votre sélection comme une visite, avec une information différente à chaque étape.",
    related: ["photos-immobilieres-smartphone", "home-staging-virtuel-photo-annonce", "eclaircir-photo-interieur-sombre"],
    sections: [
      { title: "Choisir une couverture qui représente le séjour", paragraphs: [
        "Comparez deux ou trois vues nettes en petit format. Retenez celle dont le sujet se comprend immédiatement : une pièce de vie agréable, une terrasse réellement aménagée ou un extérieur caractéristique. Un gros plan sur une tasse peut être joli, mais il renseigne peu sur le logement lorsque le lecteur découvre l’annonce.",
        "Vérifiez que cette première photo correspond à l’offre actuelle. Si une terrasse est partagée, si un couchage est convertible ou si un aménagement est saisonnier, les photos et les descriptions doivent permettre de le comprendre. Gardez les vues de décoration projetée à part des images qui présentent les équipements du séjour."
      ] },
      { title: "Organiser les vues par pièce et par information", paragraphs: [
        "Après la couverture, proposez une lecture cohérente du logement : pièce de vie, cuisine, chambres, salle d’eau et espaces extérieurs selon sa configuration. Ce n’est pas un ordre universel. L’essentiel est de pouvoir retrouver une pièce et de comprendre la relation entre les vues, sans alterner trois fois entre la même chambre et le jardin.",
        "Airbnb propose une visite photo qui classe les images par pièce et permet de les réorganiser. Relisez ce classement après tout ajout : une salle d’eau attribuée à la mauvaise chambre peut créer une confusion. La sélection de couverture et le classement par pièce répondent à deux besoins différents : découvrir, puis vérifier."
      ] },
      { title: "Préférer une photo complémentaire à un doublon", paragraphs: [
        "Si trois images montrent le même canapé sous des angles proches, demandez-vous ce que chacune ajoute. Une vue d’ensemble peut montrer l’espace, une seconde le lien avec la cuisine. La troisième n’est utile que si elle révèle un équipement ou une disposition absente des autres. Mettez les images écartées dans votre archive plutôt que de perdre les originaux.",
        "Faites ensuite l’inventaire des informations manquantes : couchages distincts, accès à la douche, coin de travail, repas dehors. Il ne s’agit pas d’atteindre un nombre magique de photos. Une série courte qui laisse la salle d’eau invisible peut être moins utile qu’une série un peu plus longue où chaque image répond à une question."
      ] },
      { title: "Écrire des légendes factuelles", paragraphs: [
        "Une bonne légende ajoute une précision que l’image ne suffit pas à donner. Par exemple : « Cuisine ouverte sur le séjour ; table pour quatre personnes », si ces éléments sont exacts. Évitez d’accumuler « exceptionnel », « luxueux » ou « incroyable » : le lecteur a surtout besoin de comprendre ce qu’il pourra utiliser.",
        "Distinguez aussi la légende du texte alternatif quand la plateforme propose les deux. La légende complète la visite ; le texte alternatif décrit les éléments visuels pour quelqu’un qui ne voit pas la photo. Pour une chambre, décrivez le couchage et la disposition visibles, sans répéter une liste de mots-clés commerciaux."
      ] },
      { title: "Vérifier l’ensemble après une retouche ou un changement réel", paragraphs: [
        "Quand vous changez un meuble, refaites les vues concernées. Une nouvelle couverture associée à d’anciennes images contradictoires peut rendre l’annonce difficile à comprendre. Après une retouche, vérifiez également les couleurs et les équipements sur toute la série, pas seulement sur le fichier modifié.",
        "La terrasse en teck présentée dans nos exemples est une proposition virtuelle. Elle permet d’étudier un autre aménagement, mais ne prouve pas que ces meubles équipent le logement. Cette distinction est un bon dernier contrôle : pour chaque image de votre annonce, pouvez-vous expliquer ce qu’elle montre réellement aujourd’hui ?"
      ], links: [{ label: "Comprendre ce qui relève du home staging virtuel", href: "/blog/home-staging-virtuel-photo-annonce/" }], checklist: ["La couverture reste lisible dans son recadrage.", "Chaque pièce utile au séjour est représentée.", "Les photos et les légendes décrivent la même configuration.", "Les propositions virtuelles sont distinguées de l’état actuel."] }
    ], sources: [{ label: "Airbnb — Créer une visite photo de votre logement", href: "https://www.airbnb.fr/help/article/477" }, { label: "Airbnb — Prendre de belles photos de votre logement", href: "https://www.airbnb.fr/help/article/746" }]
  },
  {
    slug: "demande-retouche-photo-immobiliere", status: "published", date: "2026-10-02",
    category: "Préparer sa retouche", seoTitle: "Demande de retouche photo immobilière : méthode et exemples",
    title: "Comment formuler une demande de retouche photo immobilière précise ?",
    description: "Ce qui reste, ce qui change, puis les vérifications : préparez une demande de retouche photo ou de décoration virtuelle avec des exemples concrets.",
    coverExample: "salon-canape-rouille", coverCaption: "Le canapé rouille est conservé ; la table basse, le meuble TV et les textiles donnent une nouvelle direction décorative.",
    intro: "« Rends cette pièce plus belle » laisse beaucoup de place à l’interprétation. Une demande précise définit au contraire un résultat que vous pourrez vérifier. Elle peut tenir en quelques phrases, à condition de séparer les éléments à conserver, les changements souhaités et le contrôle final.",
    related: ["eclaircir-photo-interieur-sombre", "home-staging-virtuel-photo-annonce", "retouche-photo-immobiliere-exemples-avant-apres"],
    sections: [
      { title: "Choisir un objectif pour cette image", paragraphs: [
        "Commencez par dire à quoi servira le visuel. Pour présenter l’état actuel d’un logement, vous pouvez demander une lumière plus lisible ou un meilleur équilibre des couleurs. Pour explorer une décoration, vous pouvez proposer du mobilier et des matières. Ces objectifs appellent des vérifications différentes : fidélité à la pièce d’un côté, lisibilité du projet de l’autre.",
        "Évitez de réunir trop de changements sans ordre de priorité. Si la pièce paraît sombre et que le canapé ne vous plaît pas, choisissez d’abord si vous souhaitez améliorer la photographie ou imaginer un autre salon. Vous pourrez ensuite préciser un deuxième objectif sans perdre le point de comparaison."
      ] },
      { title: "Nommer les éléments qui doivent rester", paragraphs: [
        "Listez les repères fixes : portes, fenêtres, radiateurs, prises visibles, implantation de cuisine. Ajoutez les éléments décoratifs à garder, en les désignant clairement : « le canapé rouille au premier plan » ou « le carrelage gris ». Une formule comme « ne change pas la structure » est utile, mais elle gagne à être accompagnée de quelques repères concrets.",
        "Cette liste sert ensuite de grille de contrôle. Elle ne garantit pas qu’un outil respectera tous les détails. Après génération, vérifiez chaque point, y compris ceux qui semblaient secondaires : un radiateur effacé ou une poignée déplacée suffit à rendre la représentation moins fidèle."
      ] },
      { title: "Décrire les changements avec des exemples utilisables", paragraphs: [
        "Pour une correction de lumière : « Éclaircis les ombres du séjour et atténue la dominante jaune. Conserve les couleurs du canapé, le parquet, les meubles et la vue extérieure. N’ajoute aucun objet. » Le résultat attendu est limité et peut être comparé à l’original.",
        "Pour une projection décorative : « Garde le canapé rouille, les ouvertures, le radiateur et le carrelage. Remplace la table basse et le meuble TV par du noyer. Harmonise le tapis et les coussins dans des tons écrus et terracotta. » Cette direction reprend le principe de notre exemple, où un meuble existant sert de point de départ.",
        "Pour une terrasse : « Conserve la façade, les fenêtres, les marches et les jardinières. Propose des bains de soleil et un petit coin repas en teck, en laissant les passages dégagés. » Présentez ensuite le résultat comme une idée d’aménagement, et contrôlez les dimensions sur place avant tout achat."
      ], examples: ["salon-canape-rouille", "terrasse-mobilier-teck"] },
      { title: "Corriger un détail sans recommencer toute la demande", paragraphs: [
        "Si la première proposition vous convient sauf un point, décrivez ce point et ce qui doit rester dans le résultat. Exemple : « Garde cette proposition, mais remets le radiateur visible sous la fenêtre comme sur l’original. » Une demande ciblée facilite la comparaison entre les versions.",
        "Relisez malgré tout l’image entière après la correction. Un outil peut modifier d’autres détails lors d’un nouvel essai. Gardez l’original et la proposition précédente pour identifier les changements inattendus ; si le résultat devient incohérent, arrêtez les retouches successives et revenez à une référence claire."
      ] },
      { title: "Préparer un petit dossier plutôt qu’une longue consigne", paragraphs: [
        "Pour plusieurs photos d’un logement, conservez un dossier avec les originaux, une liste des choix communs et les propositions retenues. Nommez chaque vue par pièce pour éviter d’appliquer la demande d’une chambre à une autre. Vous pourrez ainsi comparer une cuisine visible depuis le séjour avec sa vue rapprochée.",
        "Les exemples de Studio Annonce montrent la photo de départ, la demande et la proposition. Consultez-les pour voir comment une intention se traduit dans une image. La disponibilité des fonctions de retouche et les conditions du service restent celles présentées dans l’espace utilisateur et les pages d’aide."
      ], links: [{ label: "Explorer les demandes et les huit avant/après", href: "/exemples/" }, { label: "Consulter l’aide de Studio Annonce", href: "/aide/" }], checklist: ["Un objectif principal est formulé.", "Les éléments fixes et le mobilier à conserver sont nommés.", "Les changements souhaités sont précis et compatibles entre eux.", "L’original est disponible pour vérifier chaque version."] }
    ]
  }
];

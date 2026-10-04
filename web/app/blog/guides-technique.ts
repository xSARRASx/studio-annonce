import type { BlogArticle } from "./articles";

const guides: Omit<BlogArticle, "date" | "status">[] = [
  {
    slug: "redresser-perspective-photo-immobiliere", topic: "Prise de vue", category: "Cadrage & perspective",
    title: "Redresser une photo immobilière : corriger les verticales sans étirer la pièce.",
    seoTitle: "Redresser une photo immobilière : verticales et perspective",
    description: "Comprenez pourquoi les murs semblent pencher et comment corriger le cadrage ou la perspective tout en contrôlant les proportions des meubles.",
    intro: "Des murs qui convergent ou une porte inclinée peuvent donner une impression de pièce instable. Avant de déplacer des curseurs, identifiez la cause : téléphone penché, horizon incliné ou grand angle proche du mobilier. Les corrections ne répondent pas toutes au même problème.",
    related: ["photographier-petite-piece", "photos-immobilieres-smartphone", "photographier-cuisine-annonce"],
    sections: [
      { title: "Distinguer une rotation d’une correction de perspective", paragraphs: [
        "Si l’ensemble de l’image penche dans le même sens, une petite rotation peut suffire. Si les côtés d’une porte se rapprochent vers le haut alors que son centre paraît droit, la perspective est en cause. Choisissez une ligne architecturale fiable pour juger l’image, plutôt qu’un coussin ou un meuble dont la forme peut être inclinée.",
        "Ne supposez pas que toutes les lignes doivent devenir parallèles entre elles. Les lignes de profondeur convergent naturellement. L’objectif est de rendre les verticales plausibles et la lecture de la pièce confortable, pas de transformer la photographie en dessin technique vu de face."
      ] },
      { title: "Corriger d’abord la position lors de la prise de vue", paragraphs: [
        "Si vous êtes encore sur place, activez la grille et remettez le téléphone droit. Déplacez-le en hauteur plutôt que de le basculer fortement pour récupérer le plafond ou le sol. Comparez deux positions avant de décider laquelle permet de comprendre le mieux la pièce.",
        "Laissez un peu de marge autour des éléments importants. Une correction ultérieure peut recadrer les bords : une poignée déjà coupée ou une fenêtre collée au cadre restera difficile à présenter. Cette marge ne doit pas vous conduire à utiliser un angle tellement large que les meubles se déforment."
      ] },
      { title: "Appliquer une correction modérée", paragraphs: [
        "Dans votre outil de retouche, travaillez sur une copie. Ajustez les verticales progressivement, puis revenez à l’image entière. Surveillez les cercles, les tables et les fauteuils : une correction qui aligne les murs mais allonge un canapé n’est pas satisfaisante.",
        "Contrôlez ce que le recadrage retire. Si une porte utile disparaît ou si le lit n’est plus entier, choisissez un compromis plus léger ou une autre vue. Évitez de reconstruire automatiquement les bords manquants lorsqu’ils doivent représenter des caractéristiques précises du logement."
      ] },
      { title: "Relire les proportions avec l’original", paragraphs: [
        "Alternez les deux versions à la même taille. Les volumes doivent rester reconnaissables, et la pièce ne doit pas sembler avoir gagné de la largeur. Une légère imperfection de perspective peut être préférable à une correction qui donne un espace artificiel.",
        "Si vous utilisez ensuite la photo pour une décoration virtuelle, conservez aussi le fichier avant redressement. Vous pourrez distinguer les changements de cadrage des changements de mobilier. Cela rend les échanges plus précis lorsqu’une proposition paraît différente sans que l’on sache immédiatement pourquoi."
      ], checklist: ["Les verticales principales sont cohérentes.", "Le mobilier garde des proportions plausibles.", "Le recadrage n’efface pas un accès ou un équipement important."] }
    ]
  },
  {
    slug: "balance-blancs-photo-interieur", topic: "Prise de vue", category: "Couleurs",
    title: "Une photo trop jaune ou trop bleue : retrouver des couleurs d’intérieur plausibles.",
    seoTitle: "Balance des blancs en intérieur : corriger les dominantes",
    description: "Distinguez une lumière chaude d’une dominante gênante et corrigez les couleurs d’une photo immobilière sans changer celles des murs ou du mobilier.",
    intro: "Un mur blanc paraît jaune près d’une lampe, tandis que le linge devient bleu près de la fenêtre. Ce mélange est fréquent en intérieur. Le but d’une correction n’est pas de rendre toutes les surfaces parfaitement blanches, mais de retrouver une représentation cohérente de la pièce.",
    related: ["eclaircir-photo-interieur-sombre", "photographier-chambre-location", "choisir-palette-decoration-virtuelle"],
    sections: [
      { title: "Chercher une surface de référence crédible", paragraphs: [
        "Regardez une surface que vous connaissez réellement : un drap blanc, un encadrement ou un mur neutre. N’utilisez pas automatiquement le parquet ou un tissu écru comme référence. Leur couleur propre peut vous conduire à refroidir excessivement toute la photographie.",
        "Observez plusieurs zones. Si le même drap paraît chaud d’un côté et froid de l’autre, plusieurs éclairages contribuent à la scène. Un seul réglage global ne rendra pas forcément toutes les zones neutres. Acceptez une part de variation lorsqu’elle correspond à l’ambiance réelle."
      ] },
      { title: "Comparer les sources de lumière avant de photographier", paragraphs: [
        "Faites un essai avec les lampes, puis un essai sans elles si la lumière naturelle suffit. Choisissez la version la plus lisible pour le sujet. Une lampe allumée peut être utile pour montrer un coin lecture, mais elle ne doit pas forcément éclairer à elle seule toute la pièce.",
        "Si la pièce est trop sombre sans éclairage artificiel, changez de moment ou préparez une vue complémentaire. Évitez d’ajouter plusieurs sources aux couleurs très différentes sans contrôler leur effet sur les murs. Une préparation simple réduit la quantité de retouches nécessaires."
      ] },
      { title: "Ajuster la température puis vérifier les couleurs connues", paragraphs: [
        "Déplacez progressivement le réglage de température de votre outil. Lorsque la dominante gênante diminue, regardez le bois, les tissus et les murs colorés. Le parquet doit rester reconnaissable ; une pièce plus neutre ne doit pas devenir une autre décoration.",
        "Si le résultat reste verdâtre ou magenta, un réglage distinct de teinte peut être disponible. Travaillez par petites étapes et comparez chaque changement. Multiplier la saturation et les filtres en même temps rend plus difficile l’identification de ce qui améliore réellement la photo."
      ] },
      { title: "Relire la couleur sur toute la série", paragraphs: [
        "Placez côte à côte les vues d’une même pièce. Si les façades de cuisine paraissent blanches sur l’une et crème foncé sur l’autre, revenez aux originaux et cherchez la cause. N’appliquez pas aveuglément le même réglage à deux angles éclairés différemment.",
        "Pour une projection décorative, distinguez le choix d’une nouvelle couleur de la correction de la photo. Une demande qui remplace une peinture blanche par un bleu profond doit être nommée comme telle. Le lecteur doit comprendre si vous avez corrigé l’éclairage ou proposé un nouveau mur."
      ], checklist: ["La surface choisie comme référence est réellement neutre.", "Le bois et les textiles gardent leurs couleurs plausibles.", "Les vues de la même pièce restent cohérentes entre elles."] }
    ]
  },
  {
    slug: "reflets-miroirs-vitres-photo", topic: "Prise de vue", category: "Reflets",
    title: "Miroirs, vitres et écrans : gérer les reflets dans une photo de logement.",
    seoTitle: "Éviter les reflets sur les photos immobilières",
    description: "Repérez les reflets du photographe, des fenêtres et des objets personnels, puis ajustez votre position avant de recourir à la retouche.",
    intro: "Un miroir peut révéler le photographe, une vitre les objets derrière lui et un écran une fenêtre très claire. Faites un tour des surfaces réfléchissantes avant la séance. La solution la plus simple se trouve souvent dans un déplacement du point de vue.",
    related: ["photographier-salle-de-bain", "photographier-cuisine-annonce", "preparer-logement-seance-photo"],
    sections: [
      { title: "Lire ce qui apparaît derrière l’appareil", paragraphs: [
        "Avant de déclencher, regardez le miroir et les surfaces brillantes sur l’écran du téléphone. Cherchez votre silhouette, le sac de matériel, une porte ouverte et les objets personnels hors champ direct. Ils peuvent entrer dans l’image par réflexion même si la pièce photographiée semble rangée.",
        "Déplacez les objets mobiles que vous ne souhaitez pas montrer. Pour une personne, attendez qu’elle sorte du reflet. Cette préparation évite de confier à une correction numérique une tâche dont le résultat pourrait modifier le décor autour du reflet."
      ] },
      { title: "Se déplacer plutôt que cacher le reflet à tout prix", paragraphs: [
        "Essayez un pas latéral, une hauteur légèrement différente ou un cadrage qui montre une portion plus réduite du miroir. Vérifiez ensuite que la nouvelle position ne masque pas un équipement essentiel. Le meilleur compromis garde une pièce compréhensible et limite le reflet gênant.",
        "Si la salle de bain ne permet pas une vue complète sans reflet, faites deux photographies. L’une peut montrer la vasque, l’autre la douche. Une série cohérente est souvent plus facile à lire qu’un angle extrême choisi uniquement pour faire disparaître le photographe."
      ] },
      { title: "Différencier reflet et transparence dans une vitre", paragraphs: [
        "Une fenêtre peut montrer à la fois l’extérieur et une partie de la pièce reflétée. Ne demandez pas simplement de « nettoyer la vitre » si vous voulez garder la vue réelle. Précisez ce qui doit rester et comparez les montants, les bâtiments et la végétation au fichier d’origine.",
        "Sur une télévision, un écran éteint limite les contenus qui détournent l’attention, mais peut encore réfléchir une fenêtre. Adaptez votre angle plutôt que de donner à l’écran une couleur uniforme artificielle. Si vous faites retoucher le reflet, relisez ses contours et les objets voisins."
      ] },
      { title: "Contrôler la cohérence après une correction", paragraphs: [
        "Un miroir ne doit pas refléter une pièce différente de celle que l’on voit. Regardez les portes, les lampes et les meubles qui devraient apparaître dans les deux vues. Une modification de décoration peut devenir incohérente si l’outil change l’objet visible mais conserve son ancien reflet.",
        "Pour une série destinée à une annonce, privilégiez une correction limitée et vérifiable. Si le résultat invente trop de détails, conservez une autre prise de vue. L’objectif n’est pas de supprimer toute réflexion : ces surfaces font partie du logement et contribuent à sa lecture."
      ] }
    ]
  },
  {
    slug: "photo-immobiliere-floue", topic: "Prise de vue", category: "Netteté",
    title: "Une photo immobilière floue : choisir entre un nouvel export et une nouvelle prise de vue.",
    seoTitle: "Photo immobilière floue : diagnostic et solutions",
    description: "Identifiez un flou de prise de vue, un fichier trop petit ou une compression excessive avant de demander une correction de netteté.",
    intro: "Une photographie peut sembler nette en vignette et devenir inutilisable lorsqu’on l’agrandit. Avant de lancer une amélioration automatique, retrouvez le fichier original. Vous pourrez déterminer si le problème vient de la prise de vue ou d’une version dégradée lors du partage.",
    related: ["photos-immobilieres-smartphone", "formats-poids-photos-site-immobilier", "organiser-fichiers-photos-logements"],
    sections: [
      { title: "Comparer le fichier reçu à l’original", paragraphs: [
        "Demandez le fichier photo plutôt qu’une capture d’écran de la galerie. Vérifiez ses dimensions et ouvrez-le sans agrandissement excessif. Si l’original est net mais que la copie reçue présente des blocs ou des contours grossiers, le problème peut venir d’un export trop petit ou d’une compression lors du transfert.",
        "Ne remplacez pas immédiatement l’original par la version partagée. Gardez les deux le temps d’identifier le problème. Une capture d’écran peut contenir l’interface du téléphone et beaucoup moins de détails que la photographie initiale, même si elle paraît correcte dans un message."
      ] },
      { title: "Reconnaître un problème de prise de vue", paragraphs: [
        "Regardez les contours d’une porte, d’une lampe et d’un meuble à différentes distances. Si toute la scène présente un dédoublement dans la même direction, le téléphone a peut-être bougé pendant la prise de vue. Si un objet est net et le reste très flou, la mise au point ou un mode d’effet de profondeur peut être en cause.",
        "Ces observations orientent le diagnostic, sans permettre d’identifier à coup sûr chaque cause. Comparez plusieurs images prises au même moment. Si une vue voisine est nette, elle constitue souvent un meilleur point de départ qu’une réparation importante du fichier raté."
      ] },
      { title: "Refaire la photo avec une base plus stable", paragraphs: [
        "Nettoyez l’objectif, cherchez davantage de lumière et tenez le téléphone de façon stable. Faites la mise au point sur un élément représentatif de la pièce puis contrôlez la photo avant de changer d’angle. Pour un intérieur, désactivez les effets de portrait qui rendent volontairement une partie de la scène floue.",
        "Prenez plusieurs essais et agrandissez-les sur place. Cette minute de contrôle peut éviter une nouvelle visite. Si vous utilisez un support, vérifiez qu’il est bien stable et que le déclenchement ne le fait pas bouger. Le matériel seul ne remplace pas la vérification du résultat."
      ] },
      { title: "Ne pas confondre détail recréé et information récupérée", paragraphs: [
        "Une accentuation peut rendre des contours plus visibles, mais elle peut aussi créer des halos. Un outil génératif peut inventer une texture ou un petit objet là où le fichier n’en montre plus suffisamment. Un résultat plus net en apparence n’est donc pas une preuve de fidélité.",
        "Contrôlez en priorité les équipements, les motifs et les textes présents dans la pièce. Si vous ne pouvez pas les vérifier, choisissez une autre vue pour l’annonce. Une image secondaire honnête est préférable à une couverture spectaculaire qui modifie des caractéristiques du logement."
      ], checklist: ["Le fichier original a été retrouvé.", "La photo a été examinée en taille suffisante.", "Les détails importants restent vérifiables.", "La couverture retenue est nette sans reconstruction ambiguë."] }
    ]
  },
  {
    slug: "formats-poids-photos-site-immobilier", topic: "Images sur le web", category: "Formats & chargement",
    title: "Préparer des photos pour un site immobilier : dimensions, poids et versions.",
    seoTitle: "Photos de site immobilier : dimensions, formats et poids",
    description: "Conservez les originaux, exportez des images adaptées à leur affichage et comparez qualité et poids sans imposer un format unique à tous les usages.",
    intro: "Une grande photographie convient à une vue détaillée, mais elle peut être inutilement lourde dans une petite carte. Préparer les images pour le web consiste à produire les bonnes versions, puis à vérifier leur rendu réel. Un seul poids cible ne convient pas à toutes les photos.",
    related: ["texte-alternatif-photos-immobilieres", "photo-immobiliere-floue", "organiser-fichiers-photos-logements"],
    sources: [{label:"Google Search Central — Bonnes pratiques pour les images",href:"https://developers.google.com/search/docs/appearance/google-images"},{label:"web.dev — Comprendre les images pour le web",href:"https://web.dev/learn/images/"}],
    sections: [
      { title: "Conserver un original avant chaque export", paragraphs: [
        "Placez le fichier de prise de vue dans un dossier séparé et travaillez sur des copies. Il servira pour une nouvelle taille, une correction ou une impression. Réenregistrer plusieurs fois une version déjà comprimée complique le contrôle de la qualité et peut faire perdre des détails.",
        "Donnez à chaque version un nom qui décrit son usage : aperçu, page détaillée ou livraison. Associez le fichier au bon logement et à la bonne pièce. Le nom aide à organiser le travail, mais ne remplace ni la légende ni la description alternative dans la page."
      ] },
      { title: "Adapter les dimensions à la place occupée", paragraphs: [
        "Mesurez la place de l’image dans votre site sur ordinateur et sur téléphone. Une photo affichée dans une petite carte n’a pas besoin du même fichier qu’un comparateur plein écran. Préparez plusieurs dimensions lorsque le site sait choisir la version adaptée à l’affichage.",
        "Sur Studio Annonce, les exemples disposent déjà d’une version détaillée et de miniatures de 640 pixels. Le blog utilise ces miniatures pour ses cartes. Cela illustre une organisation concrète ; ce nombre ne constitue pas une dimension universelle recommandée pour tous les sites ou toutes les plateformes."
      ] },
      { title: "Comparer les formats sur une image difficile", paragraphs: [
        "Essayez les formats acceptés par votre destination et comparez les résultats. Le WebP et l’AVIF peuvent être adaptés au web ; une plateforme de dépôt peut imposer d’autres formats. Vérifiez les exigences de cette plateforme avant de convertir tout un dossier.",
        "Pour choisir le niveau de compression, examinez les rideaux, le feuillage, les joints et les dégradés d’un mur. Une image de pièce vide et une photo de terrasse arborée ne réagissent pas de la même manière. Retenez le fichier le plus léger qui conserve les détails nécessaires à cet usage, sans imposer un poids arbitraire."
      ] },
      { title: "Vérifier la page qui utilise l’image", paragraphs: [
        "Google recommande des images accessibles, un contexte textuel pertinent et des textes alternatifs adaptés. Une image importante doit pouvoir être trouvée dans la page, avec des informations cohérentes autour d’elle. Les détails d’implémentation doivent être vérifiés dans le site réellement publié.",
        "Rechargez la page sur téléphone, contrôlez le cadrage puis ouvrez la vue détaillée. Regardez si la photo devient floue, si un bord utile disparaît ou si plusieurs grandes images se chargent immédiatement. La qualité finale dépend autant de l’utilisation du fichier que de son export."
      ], checklist: ["Les originaux sont conservés.", "Chaque usage dispose d’une taille adaptée.", "Les détails restent lisibles après compression.", "Le rendu est vérifié sur la page, sur ordinateur et sur téléphone."] }
    ]
  },
  {
    slug: "texte-alternatif-photos-immobilieres", topic: "Images sur le web", category: "Accessibilité & description",
    title: "Décrire une photo immobilière : texte alternatif, légende et contexte.",
    seoTitle: "Texte alternatif des photos immobilières : exemples utiles",
    description: "Rédigez des descriptions alternatives utiles pour vos photos de logement, en distinguant image informative, décoration et comparaison avant/après.",
    intro: "Le texte alternatif permet de transmettre l’information d’une image lorsqu’elle n’est pas vue. Il doit être adapté à sa fonction dans la page. Pour une photographie de logement, décrire les éléments utiles est plus pertinent que répéter le nom du service et une liste de mots-clés.",
    related: ["formats-poids-photos-site-immobilier", "choisir-photos-annonce-location", "home-staging-virtuel-photo-annonce"],
    sources: [{label:"W3C WAI — Images informatives",href:"https://www.w3.org/WAI/tutorials/images/informative/"},{label:"Google Search Central — Bonnes pratiques pour les images",href:"https://developers.google.com/search/docs/appearance/google-images"}],
    sections: [
      { title: "Déterminer l’information apportée par la photo", paragraphs: [
        "Regardez l’image et le texte qui l’entoure. Si elle montre la disposition d’un salon, décrivez les éléments qui aident à comprendre cette disposition. Si elle illustre un changement de couleur, indiquez la couleur et la zone concernée. Le W3C recommande une description qui remplit le même rôle informatif que l’image dans son contexte.",
        "Il n’est pas nécessaire d’énumérer chaque objet. Choisissez les éléments qui comptent pour le lecteur à cet endroit de la page. Une photographie utilisée uniquement comme décoration peut demander un traitement différent ; cette décision dépend de son rôle, pas simplement de sa taille."
      ] },
      { title: "Passer d’une formule vague à une description concrète", paragraphs: [
        "« Belle chambre » donne peu d’information. Une description telle que « Chambre avec lit double, deux chevets et fenêtre à gauche » peut être utile si ces éléments sont effectivement visibles. Vérifiez la photographie avant de rédiger, sans déduire une dimension ou un équipement caché.",
        "Pour un extérieur, préférez une description de l’espace visible à une promesse sur son usage : « Terrasse en bois avec table et quatre chaises devant une baie vitrée ». Si vous ne savez pas si la terrasse est privative, ne l’affirmez pas dans le texte alternatif. Cette précision doit être vérifiée dans le contenu de l’annonce."
      ] },
      { title: "Distinguer les deux versions d’un avant/après", paragraphs: [
        "Une comparaison doit permettre d’identifier l’original et la proposition. Pour notre chambre bleu pétrole, la description de la proposition peut mentionner le mur bleu, le noyer et le linge blanc ; celle de l’original décrit son papier peint et son linge visibles. Les deux textes ne doivent pas présenter la transformation virtuelle comme un fait réalisé.",
        "La légende visible peut ensuite expliquer l’intention et les limites du projet. Elle ne remplace pas automatiquement le texte alternatif, mais évitez de répéter inutilement un long paragraphe à plusieurs endroits. Relisez l’ensemble comme un parcours, en tenant compte de la fonction du comparateur."
      ], examples: ["chambre-bleu-petrole"] },
      { title: "Rédiger pour le lecteur et vérifier après remplacement", paragraphs: [
        "Google déconseille de remplir les descriptions d’images de mots-clés répétés. Décrivez la photo dans une phrase naturelle et gardez les informations commerciales dans le texte approprié de la page. Un attribut rempli n’est pas utile s’il ne correspond pas à l’image affichée.",
        "Après une nouvelle retouche ou le remplacement d’une photo, relisez le texte alternatif et la légende. Un ancien canapé ou une couleur devenue différente peut rester dans la description par oubli. Ajoutez ce contrôle à votre procédure de publication, au même titre que le lien et le cadrage."
      ], checklist: ["La description correspond à l’image affichée.", "Les éléments importants sont nommés sans inventer de détails.", "Original et proposition virtuelle sont distingués.", "Les mots-clés ne sont pas répétés artificiellement."] }
    ]
  }
];
export const TECHNICAL_GUIDES: readonly BlogArticle[] = guides.map(guide => ({ ...guide, date: "2026-10-03", showDate: false, status: "published" }));

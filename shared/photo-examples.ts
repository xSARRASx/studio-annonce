/** Prepared edits of the eight real listing photographs approved by Martin on 30 September 2026. */
export type ExampleStage = { key: 'avant' | 'proposition' | 'apres'; label: string };
export type PhotoExample = {
 id: string; code: string; title: string; room: string; category: string; file: string;
 listing: string; sourceTitle: string; location: string; sourceFile: string;
 prompt: string; detail: string; preserved: string; virtual: boolean; ratio: number;
 seoTitle: string; seoDescription: string; altBefore: string; altAfter: string;
 paragraphs: readonly string[]; correction?: string; angle?: boolean;
};
export const PHOTO_EXAMPLES: readonly PhotoExample[] = [
  {
    "id": "salon-canape-rouille",
    "code": "A1",
    "title": "Un salon plus chaleureux, sans tout remplacer.",
    "room": "Salon",
    "category": "Redécorer",
    "listing": "1704921171164605079",
    "sourceTitle": "L’Écolier",
    "location": "Le Mans",
    "sourceFile": "1704921171164605079-01.jpg",
    "ratio": 1.3333333333333333,
    "virtual": true,
    "prompt": "Garde le canapé rouille. Harmonise les coussins, remplace la table basse et le meuble TV par du noyer, choisis un tapis clair avec des touches terracotta. Conserve la cuisine, le carrelage et les ouvertures.",
    "detail": "Le canapé existant devient le point de départ : noyer, textiles et tapis composent un salon plus accueillant.",
    "preserved": "La porte vitrée, l’ouverture sur la cuisine, le radiateur et le carrelage",
    "seoTitle": "Relooker un salon avec un canapé rouille : avant après",
    "seoDescription": "Un salon au Mans redécoré autour de son canapé rouille : comparez la photo originale et la proposition avec mobilier en noyer, tapis et textiles.",
    "altBefore": "Salon de L’Écolier avec canapé rouille, tapis géométrique, meuble TV blanc et cuisine ouverte",
    "altAfter": "Proposition de salon avec canapé rouille conservé, coussins bleu pétrole, table et meuble TV en noyer",
    "paragraphs": [
      "Ce salon possède déjà un élément fort : son canapé rouille. La proposition part de cette couleur pour composer un ensemble plus lisible, avec des coussins contrastés, un tapis aux motifs doux et deux meubles en noyer. Le changement se concentre sur ce qui entoure le canapé.",
      "L’avant/après permet de distinguer un simple rangement d’un véritable choix de décoration. Les meubles et textiles montrés dans la proposition sont virtuels ; la cuisine visible en arrière-plan, le carrelage et les passages servent de repères pour lire la même pièce."
    ],
    "file": "salon-canape-rouille"
  },
  {
    "id": "chambre-bleu-petrole",
    "code": "A2",
    "title": "Une chambre bleu pétrole, douce et affirmée.",
    "room": "Chambre",
    "category": "Redécorer",
    "listing": "1704921171164605079",
    "sourceTitle": "L’Écolier",
    "location": "Le Mans",
    "sourceFile": "1704921171164605079-10.jpg",
    "ratio": 1.3333333333333333,
    "virtual": true,
    "prompt": "Remplace le papier peint géométrique par un bleu pétrole mat. Ajoute une tête de lit en noyer, une literie blanche bien faite et des lampes douces. Garde la porte vitrée, ses encadrements et le sol.",
    "detail": "Un mur bleu profond, du noyer et du linge blanc donnent une nouvelle présence à la chambre.",
    "preserved": "La porte vitrée, les renfoncements, le sol et l’emplacement du lit",
    "seoTitle": "Chambre bleu pétrole et noyer : décoration avant après",
    "seoDescription": "Découvrez la transformation virtuelle d’une chambre : mur bleu pétrole, tête de lit en noyer et linge blanc, avec la photo originale à comparer.",
    "altBefore": "Chambre avec papier peint géométrique, couverture rouge et haute porte vitrée à gauche",
    "altAfter": "Chambre redécorée avec mur bleu pétrole, tête de lit en noyer, duvet blanc et lampes rondes",
    "paragraphs": [
      "Le papier peint très présent et la couverture rouge donnent le ton de la photo originale. Cette proposition change la direction décorative : un bleu pétrole mat forme un fond calme, tandis que le noyer relie la tête de lit aux chevets. Le linge blanc apporte un contraste clair.",
      "La porte vitrée et ses renfoncements restent les principaux repères de la chambre. Ce visuel illustre une décoration possible : il permet d’évaluer les couleurs, les textiles et le mobilier avant de les choisir. Il ne présente pas des travaux déjà réalisés."
    ],
    "file": "chambre-bleu-petrole"
  },
  {
    "id": "terrasse-mobilier-teck",
    "code": "B1",
    "title": "Une terrasse qui invite à s’installer.",
    "room": "Terrasse",
    "category": "Aménager",
    "listing": "53294695",
    "sourceTitle": "Maison avec terrasse ensoleillée",
    "location": "Le Mans",
    "sourceFile": "53294695-01.jpg",
    "ratio": 1.7777777777777777,
    "virtual": true,
    "prompt": "Remplace les transats noirs et le mobilier compact par des bains de soleil en teck et un petit coin repas. Ravive le bois, garde les marches, les jardinières, les fenêtres et la façade.",
    "detail": "Des bains de soleil et un coin repas en bois pour imaginer une terrasse plus accueillante.",
    "preserved": "La façade, les ouvertures, les marches et les jardinières",
    "seoTitle": "Aménagement virtuel d’une terrasse en bois : avant après",
    "seoDescription": "Comparez une terrasse avant et après aménagement virtuel : bains de soleil en teck, coin repas et bois ravivé, autour des mêmes ouvertures.",
    "altBefore": "Terrasse en bois devant une maison blanche, avec deux transats noirs et des jardinières de bambous",
    "altAfter": "Proposition de terrasse avec deux bains de soleil en teck, coussins clairs et table de repas en bois",
    "paragraphs": [
      "Sur cette terrasse, la façade blanche, le bois et les bambous offrent déjà une base agréable. La proposition remplace le mobilier noir par du teck et des assises claires. Deux usages se dessinent : se détendre sur les bains de soleil et partager un repas près de la maison.",
      "L’aménagement se lit dans le cadre de l’extérieur existant, avec ses marches et ses jardinières. La transformation porte sur le mobilier et la présentation du bois. Elle aide à se projeter dans un espace plus accueillant, sans ajouter de piscine, de pergola ou d’extension."
    ],
    "file": "terrasse-mobilier-teck"
  },
  {
    "id": "chambre-terracotta",
    "code": "B2",
    "title": "Une chambre simple, une ambiance complète.",
    "room": "Chambre",
    "category": "Redécorer",
    "listing": "53294695",
    "sourceTitle": "Maison avec terrasse ensoleillée",
    "location": "Le Mans",
    "sourceFile": "53294695-07.jpg",
    "ratio": 1.3333333333333333,
    "virtual": true,
    "prompt": "Peins le mur du lit en terre cuite douce. Ajoute une tête de lit en lin, du linge écru, des chevets en bois et des lampes douces. Conserve l’armoire blanche, la porte, les prises et le parquet.",
    "detail": "Terre cuite, linge écru et bois : le lit devient le centre d’une décoration cohérente.",
    "preserved": "L’armoire, la porte, les prises, le sol et les volumes",
    "seoTitle": "Chambre terracotta : une décoration virtuelle avant après",
    "seoDescription": "Une chambre redécorée en terracotta, lin et bois. Voir la photo originale, la proposition d’aménagement et la demande de retouche utilisée.",
    "altBefore": "Petite chambre aux murs blancs avec couette multicolore, chevets blancs et armoire près de la porte",
    "altAfter": "Projection d’une chambre avec mur terracotta, tête de lit claire, linge écru et chevets en noyer",
    "paragraphs": [
      "La photo de départ montre une chambre sobre, avec un linge de lit très coloré et plusieurs petits meubles blancs. La proposition rassemble les couleurs autour d’un mur terre cuite, d’une literie écrue et de bois plus chaleureux. La tête de lit donne un point d’ancrage à l’ensemble.",
      "L’armoire blanche et l’accès à la porte restent visibles. Ce cas montre comment une demande assez précise peut porter sur plusieurs éléments à la fois : peinture, textiles, luminaires et chevets. Les nouveaux meubles et la peinture sont une projection décorative."
    ],
    "file": "chambre-terracotta"
  },
  {
    "id": "salon-lumiere-naturelle",
    "code": "C1",
    "title": "La même décoration. Une lumière plus juste.",
    "room": "Salon",
    "category": "Mettre en valeur",
    "listing": "1117348194050702366",
    "sourceTitle": "Les volets bleus",
    "location": "Ruaudin",
    "sourceFile": "1117348194050702366-01.jpg",
    "ratio": 1.3333333333333333,
    "virtual": false,
    "prompt": "Éclaircis le salon et corrige la dominante jaune sans changer la décoration. Éteins l’écran de la télévision, range les télécommandes et soigne les coussins. Garde les meubles et le radiateur.",
    "detail": "L’exposition, les couleurs et quelques détails de présentation mettent en valeur le mobilier existant.",
    "preserved": "Le canapé, les meubles, les portes, le radiateur et le carrelage",
    "seoTitle": "Retouche de lumière d’un salon : exemple photo avant après",
    "seoDescription": "Un exemple de retouche photo immobilière avec mobilier conservé : lumière, couleurs, écran de télévision et présentation du salon avant après.",
    "altBefore": "Salon avec canapé gris, télévision allumée, meuble bois et noir, porte vitrée et radiateur blanc",
    "altAfter": "Même salon présenté avec des couleurs équilibrées, télévision éteinte, coussins soignés et lumière plus claire",
    "paragraphs": [
      "Ce salon est déjà meublé et décoré. L’objectif est donc de rendre sa photographie plus lisible : équilibrer les zones sombres, calmer la dominante colorée et mieux montrer les textures du canapé et du bois. La télévision éteinte attire moins l’attention que son écran d’accueil.",
      "La demande ne porte pas sur une rénovation. Elle conserve le mobilier et travaille aussi des détails de présentation, comme les coussins et les télécommandes. La comparaison avec l’original reste utile pour vérifier les ouvertures, le radiateur et la disposition de la pièce."
    ],
    "file": "salon-lumiere-naturelle"
  },
  {
    "id": "cuisine-prune-bois",
    "code": "C2",
    "title": "Du prune et du bois, pour changer de ton.",
    "room": "Cuisine",
    "category": "Sols et couleurs",
    "listing": "1117348194050702366",
    "sourceTitle": "Les volets bleus",
    "location": "Ruaudin",
    "sourceFile": "1117348194050702366-07.jpg",
    "ratio": 1.3333333333333333,
    "virtual": true,
    "prompt": "Passe les façades vertes en prune mat et la crédence en ivoire. Garde la table en bois, remplace les chaises noires par des assises en bois clair. Conserve les appareils, la fenêtre, le radiateur et le sol.",
    "detail": "Une autre palette pour la cuisine, avec les mêmes équipements et une table conservée.",
    "preserved": "La fenêtre, le radiateur, les équipements, la table et le sol",
    "seoTitle": "Cuisine prune et bois : simulation de couleurs avant après",
    "seoDescription": "Changer la couleur d’une cuisine sans changer son implantation : façades prune, crédence ivoire et chaises en bois, en comparaison avant après.",
    "altBefore": "Cuisine aux façades vertes avec grande table en bois, chaises noires, réfrigérateur et radiateur à gauche",
    "altAfter": "Cuisine projetée avec façades prune, crédence ivoire et chaises en bois, équipements conservés",
    "paragraphs": [
      "La cuisine originale associe des façades vertes à une grande table en bois. La simulation explore une teinte prune plus profonde, avec une crédence claire et des assises en bois. La table reste le lien entre le coin repas et les meubles de cuisine.",
      "Le réfrigérateur, le lave-vaisselle, le four et la hotte restent les repères de l’implantation. Il s’agit d’un essai de couleurs et de matières, à distinguer d’une simple correction de lumière. L’avant/après permet de juger le changement d’ambiance sur une photographie du même espace."
    ],
    "file": "cuisine-prune-bois"
  },
  {
    "id": "cuisine-bleu-parquet",
    "code": "D1",
    "title": "Une cuisine ancienne, une nouvelle palette.",
    "room": "Cuisine",
    "category": "Tout repenser",
    "listing": "49940232",
    "sourceTitle": "Appartement à Spay",
    "location": "Spay",
    "sourceFile": "49940232-01.jpg",
    "ratio": 2.1686746987951806,
    "virtual": true,
    "prompt": "Projette des façades bleu profond, une crédence ivoire et du parquet en chêne clair. Harmonise la table et les chaises en bois. Garde la porte, la hotte et les appareils à leur place.",
    "detail": "Façades, crédence, sol et coin repas : une rénovation visuelle autour de l’implantation existante.",
    "preserved": "La porte, la hotte, les appareils et l’implantation de la cuisine",
    "seoTitle": "Rénovation virtuelle d’une cuisine ancienne : avant après",
    "seoDescription": "Une cuisine ancienne transformée visuellement avec des façades bleu profond, une crédence ivoire et du parquet. Photo originale et projection comparées.",
    "altBefore": "Cuisine ancienne avec crédence à fleurs jaunes, façades claires, électroménager blanc et chaises en bois",
    "altAfter": "Projection de cuisine avec façades bleu profond, boutons laiton, crédence ivoire et parquet en chêne",
    "paragraphs": [
      "Dans cette cuisine, le motif jaune de la crédence et le mobilier donnent une identité marquée à la photo de départ. La proposition travaille plusieurs surfaces ensemble : des façades bleu profond, une crédence ivoire, un sol en chêne et un coin repas assorti.",
      "La porte, la hotte et les appareils donnent des points de comparaison concrets. Ce visuel sert à imaginer une rénovation ; il ne correspond pas à l’état actuel du bien. La même palette se retrouve dans l’exemple du séjour, où une partie de cette cuisine est visible."
    ],
    "file": "cuisine-bleu-parquet"
  },
  {
    "id": "sejour-canape-olive",
    "code": "D2",
    "title": "Un séjour olive et chêne, jusque dans le fond.",
    "room": "Séjour",
    "category": "Tout repenser",
    "listing": "49940232",
    "sourceTitle": "Appartement à Spay",
    "location": "Spay",
    "sourceFile": "49940232-02.jpg",
    "ratio": 2.1686746987951806,
    "virtual": true,
    "prompt": "Remplace le canapé par un modèle olive, harmonise le coin repas en chêne et ajoute un tableau. Projette le même parquet et la même cuisine bleue que dans l’autre vue. Garde les portes et les passages.",
    "detail": "Mobilier, textiles et sol sont repensés ; la cuisine visible reprend la palette de l’autre photo.",
    "preserved": "La porte, l’ouverture vers la cuisine et l’organisation du séjour",
    "seoTitle": "Home staging virtuel d’un séjour : canapé olive et parquet",
    "seoDescription": "Un séjour réaménagé virtuellement avec canapé olive, mobilier en chêne et parquet, en cohérence avec la cuisine visible. Découvrez l’avant après.",
    "altBefore": "Séjour avec canapé gris à motifs, petite table en bois au fond et ouverture vers une cuisine ancienne",
    "altAfter": "Séjour projeté avec canapé olive, coussins ocre et rouille, mobilier en chêne et cuisine bleue en arrière-plan",
    "paragraphs": [
      "Le canapé gris de la photo originale laisse place à un modèle olive, accompagné de textiles ocre et rouille. Le coin repas est harmonisé avec le parquet et le mobilier en chêne. Un tableau introduit les mêmes couleurs dans le fond de la pièce.",
      "La cuisine que l’on aperçoit à droite reprend les façades bleues et la crédence claire de l’autre proposition de ce logement. Cet exemple illustre l’attention à porter aux vues d’un même bien : une décoration choisie dans une pièce doit rester cohérente lorsqu’elle apparaît en arrière-plan."
    ],
    "file": "sejour-canape-olive"
  }
];
export const EXAMPLE_CATEGORIES = ['Tout voir', 'Tout repenser', 'Redécorer', 'Sols et couleurs', 'Aménager', 'Mettre en valeur'] as const;
export function exampleStages(example: PhotoExample): ExampleStage[] {
 return [{key:'avant',label:'Original'}, ...(example.correction ? [{key:'proposition' as const,label:'Première proposition'}] : []), {key:'apres',label:example.correction?'Après la correction':'Proposition'}];
}
export function findPhotoExample(id: string) { return PHOTO_EXAMPLES.find(example => example.id === id); }

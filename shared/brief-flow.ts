/** Shared local demo rules: prepares a brief without calling an AI provider. */
export type BriefKind = 'photo' | 'video' | 'image';
export type BriefAnswer = { choices: string[]; detail: string };
export type BriefAnswers = Record<string, BriefAnswer>;
export type BriefOption = { label: string; detail: string; icon: string };
export type BriefQuestion = {
  id: string;
  short: string;
  label: string;
  help: string;
  placeholder: string;
  core: boolean;
  options: readonly BriefOption[];
};

/** Read current answers and migrate the earlier single-card draft format. */
export function readBriefAnswer(value: unknown): BriefAnswer {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return { choices: [], detail: '' };
  const input = value as Record<string, unknown>;
  const candidates = Array.isArray(input.choices) ? input.choices : [input.choice];
  const choices = [...new Set(candidates.filter((choice): choice is string => typeof choice === 'string' && !!choice.trim()))];
  return { choices, detail: typeof input.detail === 'string' ? input.detail : '' };
}

/** Toggle one card while retaining every other selection and the exact free text. */
export function toggleBriefChoice(answer: BriefAnswer | undefined, label: string): BriefAnswer {
  const current = readBriefAnswer(answer);
  if (!label.trim()) return current;
  return {
    choices: current.choices.includes(label)
      ? current.choices.filter(choice => choice !== label)
      : [...current.choices, label],
    detail: current.detail,
  };
}

const option = (label: string, detail: string, icon: string): BriefOption => ({ label, detail, icon });
const question = (id: string, short: string, label: string, help: string, placeholder: string, options: BriefOption[], core = true): BriefQuestion => ({ id, short, label, help, placeholder, options, core });

function mood(kind: BriefKind): BriefQuestion {
  return question(`${kind}-mood`, 'Ambiance', 'Quelle ambiance souhaitez-vous ?', 'Choisissez une direction, ajoutez vos nuances, ou décrivez votre propre ambiance.', 'Ex. : chaleureux, avec du bleu et une lumière de fin de journée.', [
    option('Naturelle et lumineuse', 'Un rendu clair, simple et accueillant.', 'Sun'),
    option('Chaleureuse', 'Des tons doux et une atmosphère cosy.', 'Heart'),
    option('Élégante', 'Un esprit soigné, sobre et raffiné.', 'Gem'),
    option('À ma façon', 'Décrivez les couleurs et sensations souhaitées.', 'Palette'),
  ]);
}

function format(kind: 'video' | 'image'): BriefQuestion {
  return question(`${kind}-format`, 'Format', kind === 'video' ? 'Où allez-vous montrer cette vidéo ?' : 'Quel format souhaitez-vous pour votre image ?', 'Le format définit les proportions. Vous pouvez préciser le support ou les dimensions.', 'Ex. : vertical pour Instagram, avec de la place pour le titre en haut.', [
    option('Horizontal · 16:9', 'Pour une page web ou une vidéo paysage.', 'Monitor'),
    option('Vertical · 9:16', 'Pour les stories et les écrans de téléphone.', 'Smartphone'),
    option('Carré · 1:1', 'Pour une publication ou une vignette.', 'Square'),
    option('Format personnalisé', 'Précisez vos proportions ou dimensions.', 'Crop'),
  ]);
}

function baseQuestions(kind: BriefKind): BriefQuestion[] {
  if (kind === 'photo') return [
    question('photo-room', 'La pièce', 'Quelle pièce souhaitez-vous mettre en valeur ?', 'Précisez la pièce ou l’espace visible, sans inventer une autre disposition.', 'Ex. : salon avec cuisine ouverte, ou chambre sous les combles.', [
      option('Salon ou séjour', 'Un espace pour recevoir et se détendre.', 'Sofa'), option('Chambre', 'Le lit, les textiles et une ambiance reposante.', 'Moon'), option('Cuisine ou salle de bain', 'Des surfaces lisibles et un espace soigné.', 'House'), option('Autre espace', 'Précisez : entrée, terrasse, jardin…', 'Trees'),
    ]),
    question('photo-goal', 'Le résultat', 'Quel niveau de transformation souhaitez-vous ?', 'Une amélioration photographique garde le logement réel. Une nouvelle décoration sera une projection virtuelle à identifier.', 'Ex. : conserver la pièce et repenser complètement les meubles et les revêtements.', [
      option('Embellir la photo', 'Corriger la lumière et le cadrage, sans changer les matériaux.', 'Camera'), option('Ranger et soigner', 'Préparer la pièce en conservant sa décoration.', 'Sparkles'), option('Changer quelques éléments', 'Nommez les meubles, objets ou couleurs concernés.', 'Paintbrush'), option('Repenser toute la décoration', 'Nouvelle ambiance ; portes, fenêtres et équipements fixes conservés.', 'Palette'),
    ]),
    question('photo-preservation', 'À préserver', 'Que doit-on absolument garder dans la photo ?', 'Indiquez ce qui peut changer et ce qui doit rester fidèle à la photo.', 'Ex. : garder le parquet, les fenêtres et la table, changer uniquement le canapé.', [
      option('Le logement à l’identique', 'Préserver les volumes, les ouvertures et les équipements fixes.', 'House'),
      option('Le mobilier aussi', 'Conserver le logement et tous les meubles.', 'Armchair'),
      option('Certains éléments', 'Nommez précisément ce qui doit rester.', 'Pin'),
      option('Je précise mes limites', 'Décrivez les changements autorisés.', 'SlidersHorizontal'),
    ]),
    question('photo-exposure', 'La lumière', 'Comment améliorer la lumière et les couleurs ?', 'La lumière doit rester crédible et respecter les ouvertures présentes.', 'Ex. : enlever la dominante jaune, éclaircir sans rendre la fenêtre toute blanche.', [
      option('Équilibrer naturellement', 'Récupérer les détails dans les zones sombres et claires.', 'Sun'), option('Un rendu plus chaleureux', 'Réchauffer légèrement les tons, sans effet artificiel.', 'Sunset'), option('Garder la lumière actuelle', 'Ne modifier ni l’éclairage ni la couleur de la lumière.', 'ShieldCheck'), option('Je précise le rendu', 'Décrivez l’heure, les ombres ou les couleurs à corriger.', 'Lamp'),
    ]),
    question('photo-objects', 'Le rangement', 'Que faut-il ranger ou retirer ?', 'Indiquez les objets concernés. Les équipements fixes et les défauts structurels restent visibles.', 'Ex. : faire le lit, retirer les câbles et les affaires sur la table, garder les plantes.', [
      option('Ranger les objets personnels', 'Vêtements, sacs et petits objets visibles.', 'Package'), option('Soigner le lit et les textiles', 'Draps, plaids et coussins disposés proprement.', 'Layers'), option('Ne rien retirer', 'Tout ce qui est visible reste en place.', 'ShieldCheck'), option('Une liste précise', 'Nommez ce qui doit partir et ce qui doit rester.', 'ListChecks'),
    ]),
    question('photo-furniture', 'Les meubles', 'Souhaitez-vous conserver ou remplacer les meubles ?', 'Le mobilier peut évoluer selon votre demande, en conservant l’espace et ses dimensions.', 'Ex. : garder le canapé, remplacer la table par une table ronde en noyer.', [
      option('Conserver les meubles', 'Préserver tous les meubles visibles.', 'Armchair'), option('Remplacer certains meubles', 'Décrivez les pièces de mobilier à changer.', 'Sofa'), option('Tout remeubler', 'Une proposition d’aménagement virtuel complète.', 'Layers'), option('Meubler une pièce vide', 'Ajoutez un style, des usages et les meubles souhaités.', 'House'),
    ]),
    question('photo-walls', 'Les murs', 'Que souhaitez-vous faire des murs ?', 'Changer la peinture ou un revêtement est une projection. Ne déplacer ni porte, ni fenêtre, ni radiateur.', 'Ex. : un seul mur bleu pétrole, les autres blanc cassé ; garder les briques.', [
      option('Garder les murs actuels', 'Conserver leurs couleurs et leurs revêtements.', 'ShieldCheck'), option('Changer un mur', 'Précisez lequel et la couleur souhaitée.', 'Paintbrush'), option('Repeindre toute la pièce', 'Indiquez votre palette ou vos couleurs.', 'Palette'), option('Changer un revêtement', 'Décrivez le papier peint, les panneaux ou la matière.', 'Frame'),
    ]),
    question('photo-floor', 'Le sol', 'Souhaitez-vous changer l’apparence du sol ?', 'Le changement de sol reste virtuel et ne modifie pas les niveaux ni les proportions.', 'Ex. : remplacer le carrelage par du parquet en chêne clair, lames dans le sens de la pièce.', [
      option('Conserver le sol', 'Garder la matière et la couleur présentes.', 'ShieldCheck'), option('Un parquet', 'Précisez l’essence, la teinte et le motif.', 'Layers'), option('Un carrelage ou une pierre', 'Précisez le format et la finition.', 'Square'), option('Un autre revêtement', 'Décrivez votre sol ou ajoutez seulement un tapis.', 'Palette'),
    ]),
    mood(kind),
    question('photo-framing', 'Cadrage', 'Quel cadrage souhaitez-vous garder ?', 'Une retouche peut conserver la vue ou recadrer la photo. Précisez votre préférence.', 'Ex. : garder l’angle actuel, mais retirer une petite bande à gauche.', [
      option('Le cadrage d’origine', 'Conserver la vue et les proportions actuelles.', 'Image'),
      option('Un cadrage plus serré', 'Mettre davantage en valeur une partie de la photo.', 'ZoomIn'),
      option('Un recadrage vertical', 'Adapter la composition à un écran de téléphone.', 'Smartphone'),
      option('Un cadrage personnalisé', 'Décrivez les limites de la nouvelle composition.', 'Crop'),
    ]),
  ];
  if (kind === 'video') return [
    question('video-camera', 'Vue caméra', 'Quelle vue et quel mouvement de caméra souhaitez-vous ?', 'Choisissez le déplacement voulu. La caméra reste dans l’espace visible ; les pièces sont reliées par des coupes.', 'Ex. : une caméra façon drone à hauteur des yeux, qui avance puis contourne franchement la table.', [
      option('Vue drone', 'Une avancée dynamique à hauteur des yeux, avec des virages visibles.', 'Plane'),
      option('À hauteur des yeux', 'Une visite comme si l’on marchait dans les pièces.', 'Eye'),
      option('Plans fixes', 'Des compositions stables qui laissent regarder les détails.', 'Camera'),
      option('Mouvements doux', 'Des déplacements lents et de légers panoramiques.', 'Move'),
    ]),
    question('video-duration', 'Durée', 'Quelle durée visez-vous pour la vidéo finale ?', 'La durée choisie est celle du montage final. Toutes les photos sélectionnées se partagent cette durée.', 'Ex. : 25 secondes au total, dont 8 dans le salon.', [
      option('10 secondes', 'Un aperçu très court.', 'Timer'),
      option('20 secondes', 'Une visite courte en quelques plans.', 'Clock'),
      option('30 secondes', 'Plus de temps pour les pièces et les détails.', 'Film'),
      option('5 secondes', 'Un seul aperçu très rapide.', 'Timer'),
    ]),
    format(kind),
    mood(kind),
    question('video-fidelity', 'Fidélité', 'Jusqu’où la vidéo peut-elle transformer le lieu ?', 'Pour une annonce réelle, les pièces et les équipements doivent rester fidèles aux sources.', 'Ex. : ne changer ni les volumes ni la décoration ; autoriser seulement la lumière.', [
      option('Fidèle aux photos', 'Conserver les pièces, les proportions et les équipements visibles.', 'ShieldCheck'),
      option('Retouches légères', 'Précisez les corrections de lumière ou de rangement autorisées.', 'WandSparkles'),
      option('Aménagement virtuel', 'Décrire les transformations et signaler la mise en scène.', 'Armchair'),
      option('Univers fictif', 'Imaginer un lieu, clairement présenté comme une création.', 'Sparkles'),
    ]),
  ];
  return [
    question('image-subject', 'Sujet', 'Que souhaitez-vous créer de toutes pièces ?', 'Aucune photo à joindre : décrivez le sujet et les détails que vous voulez inventer.', 'Ex. : un salon méditerranéen avec une grande baie vitrée ouverte sur la mer.', [
      option('Un intérieur', 'Une pièce, un logement ou une scène de décoration.', 'Sofa'),
      option('Un extérieur', 'Une maison, un jardin ou un paysage.', 'Trees'),
      option('Un objet ou un détail', 'Un meuble, une matière ou une composition rapprochée.', 'Focus'),
      option('Une autre idée', 'Décrivez librement le sujet à imaginer.', 'Lightbulb'),
    ]),
    mood(kind),
    question('image-style', 'Style visuel', 'Quel style d’image souhaitez-vous ?', 'Choisissez le type de rendu, puis précisez votre inspiration si vous en avez une.', 'Ex. : une photographie très réaliste, avec des matières naturelles et sans texte.', [
      option('Photo réaliste', 'Un rendu photographique, même si la scène est inventée.', 'Camera'),
      option('Illustration', 'Un dessin avec une direction artistique assumée.', 'Paintbrush'),
      option('Rendu 3D', 'Une scène en volume, précise et travaillée.', 'Box'),
      option('Un style personnel', 'Décrivez les textures, couleurs ou références.', 'Palette'),
    ]),
    format(kind),
  ];
}

type ContextTopic = 'decoration' | 'light' | 'tidying' | 'route' | 'outdoor';
const topics: { topic: ContextTopic; pattern: RegExp }[] = [
  { topic: 'decoration', pattern: /\b(?:redecor|decor|decos?\b|relook|mobilier|ameubl|meubl|canap|fauteuil|rideau|tapis|coussin|repein|peinture)/ },
  { topic: 'light', pattern: /\b(?:lumie|lumin|lum\b|eclair|ensole|sombre|soleil|coucher|lever du jour|plus\s+clair)/ },
  { topic: 'tidying', pattern: /\b(?:rang|bazar|bordel|desord|encombr|nettoy|desencomb|retir|enlev|(?:re)?(?:faire|fais|faites?)\s+(?:le|les|un|des)\s+lits?\b|(?:mettre|mets|mettez)\s+de\s+l['’]ordre)/ },
  { topic: 'route', pattern: /\b(?:drone|trajet|survol|travers|fenetre|orbite|autour|sans coupure|continu)/ },
  { topic: 'outdoor', pattern: /\b(?:piscine|jardin|terrasse|exterieur|facade|balcon|paysag)/ },
];

function contextualQuestion(kind: BriefKind, topic: ContextTopic): BriefQuestion {
  const invented = kind === 'image';
  const id = `${kind}-${topic}`;
  switch (topic) {
    case 'decoration': return question(id, 'Décoration', invented ? 'Quelle décoration souhaitez-vous imaginer ?' : 'Que souhaitez-vous changer dans la décoration ?', 'Votre demande évoque la décoration ou le mobilier. Précisez le style et les éléments concernés.', 'Ex. : un canapé en velours vert, une table en bois et des touches de laiton.', [
      option(invented ? 'Naturelle' : 'Quelques éléments', invented ? 'Du bois, des fibres et des matières douces.' : 'Précisez les meubles et les objets à remplacer.', 'Armchair'),
      option(invented ? 'Contemporaine' : 'Toute la décoration', invented ? 'Des lignes sobres et un mobilier actuel.' : 'Repenser le mobilier, les textiles et les objets.', 'Sofa'),
      option(invented ? 'Colorée' : 'Couleurs et matières', invented ? 'Des couleurs affirmées et des associations libres.' : 'Changer la palette et les textures souhaitées.', 'Palette'),
      option('Un style précis', 'Ajoutez votre inspiration et les éléments indispensables.', 'Paintbrush'),
    ], false);
    case 'light': return question(id, 'Lumière', 'Quelle lumière imaginez-vous pour cette scène ?', 'Votre demande évoque la luminosité. Précisez le moment de la journée et le rendu souhaité.', 'Ex. : soleil du matin venant de la gauche, sans zones surexposées.', [
      option('Lumière naturelle douce', 'Un jour clair avec des ombres légères.', 'Sun'),
      option('Soleil doré', 'Une lumière chaude de début ou de fin de journée.', 'Sunset'),
      option('Ambiance du soir', 'Un éclairage intérieur doux et chaleureux.', 'Moon'),
      option('Une lumière précise', 'Indiquez la direction, l’intensité et la couleur.', 'Lamp'),
    ], false);
    case 'tidying': return question(id, 'Objets et rangement', invented ? 'Quels objets doivent apparaître dans la scène ?' : 'Quels objets souhaitez-vous retirer ou ranger ?', 'Précisez les objets concernés et ceux à conserver pour éviter les changements indésirables.', 'Ex. : retirer les vêtements et les câbles, garder les livres et les plantes.', [
      option(invented ? 'Très peu d’objets' : 'Les petits objets', invented ? 'Une composition épurée et minimale.' : 'Retirer les objets qui distraient le regard.', 'Sparkles'),
      option(invented ? 'Une scène habitée' : 'Les éléments encombrants', invented ? 'Des objets du quotidien disposés avec soin.' : 'Nommez les objets volumineux concernés.', 'Package'),
      option(invented ? 'Des objets décoratifs' : 'Réorganiser sans retirer', invented ? 'Ajouter livres, plantes ou accessoires.' : 'Conserver les objets et modifier leur disposition.', 'Layers'),
      option('Une liste précise', 'Détaillez les objets à inclure, conserver ou exclure.', 'ListChecks'),
    ], false);
    case 'route': return question(id, 'Trajet', 'Quel trajet la caméra doit-elle suivre ?', 'Votre demande évoque un déplacement. Indiquez le départ, les étapes et l’arrivée ; les raccords devront être vérifiés.', 'Ex. : partir de la terrasse, entrer dans le salon, tourner autour de la table puis finir dans la cuisine.', [
      option('De pièce en pièce', 'Décrivez les pièces et leur ordre.', 'Route'),
      option('Autour d’un point fort', 'Tourner autour d’une table, d’une piscine ou d’un autre sujet.', 'RotateCw'),
      option('De l’extérieur vers l’intérieur', 'Précisez l’entrée et les passages réellement possibles.', 'DoorOpen'),
      option('Mon propre trajet', 'Décrivez le mouvement et les pauses souhaitées.', 'Map'),
    ], false);
    case 'outdoor': return question(id, 'Extérieur', 'Que voulez-vous mettre en valeur à l’extérieur ?', 'Votre demande évoque un jardin, une terrasse ou un autre espace extérieur.', 'Ex. : la piscine au premier plan, puis la terrasse et les arbres en arrière-plan.', [
      option('Le jardin', 'La végétation et les espaces verts.', 'Trees'),
      option('La piscine', 'Le bassin et son environnement.', 'Waves'),
      option('La terrasse', 'Les espaces pour se détendre ou recevoir.', 'Sun'),
      option('Un ensemble ou un détail', 'Précisez la façade, le balcon ou les éléments à montrer.', 'House'),
    ], false);
  }
}

/** Stable question IDs let the UI retain relevant answers when the request changes. */
export function buildQuestions(kind: BriefKind, request: string): BriefQuestion[] {
  const normalized = request.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const base = baseQuestions(kind);
  const relevant = topics
    .filter(({ topic }) => topic !== 'route' || kind === 'video')
    .map(({ topic, pattern }) => ({ topic, position: normalized.search(pattern) }))
    .filter(({ position }) => position >= 0)
    .sort((a, b) => a.position - b.position)
    .slice(0, 3);
  return [...base, ...relevant.map(({ topic }) => contextualQuestion(kind, topic))];
}

const BRIEF_INTRO: Record<BriefKind, string> = {
  photo: 'Retoucher la photo fournie selon la demande et les choix ci-dessous.',
  image: 'Créer une image nouvelle et fictive à partir du texte. Aucune photo source n’est requise.',
  video: 'Brief préparatoire de visite vidéo : décrire les plans à réaliser à partir de la demande et des choix ci-dessous.',
};
const BRIEF_END: Record<BriefKind, string> = {
  photo: 'Respecter les éléments à préserver et les changements explicitement demandés. Signaler un aménagement virtuel si le contenu du lieu est transformé.',
  image: 'La scène est une création fictive. Ne pas la présenter comme la photographie d’un logement réel. Aucun fichier à joindre n’est nécessaire.',
  video: 'Ce brief ne constitue pas une vidéo générée. Préparer et valider d’abord les photos rangées, notamment les lits et surfaces visibles, puis animer des plans courts et vérifier les raccords. La durée cible et les mouvements doivent être adaptés au modèle choisi. Des photos seules ne garantissent pas la géométrie réelle ni un trajet continu entre les pièces : passer par une ouverture réellement montrée ou faire une coupe de montage. Pour un logement réel, ne jamais traverser un mur ni inventer de passages ou d’équipements absents des sources.',
};
const PREVIOUS_VIDEO_END = 'Ce brief ne constitue pas une vidéo générée. La durée cible et les mouvements doivent être adaptés aux possibilités du modèle vidéo choisi. Des photos seules ne garantissent pas la géométrie réelle ni un trajet continu entre les pièces : vérifier les raccords avant de promettre une visite sans coupure. Pour un logement réel, ne pas inventer de passages ou d’équipements absents des sources.';

/**
 * Recover only the idea from our own prepared text for a new questionnaire.
 * This does not restore answers, or replace the complete editable brief.
 * Unknown formats are returned untouched rather than guessed at.
 */
export function recoverBriefSource(kind: BriefKind, text: string): string {
  const prefix = `${BRIEF_INTRO[kind]}\n\nDEMANDE\n`;
  if (!text.startsWith(prefix)) return text;
  const choicesMarker = '\n\nCHOIX ET PRÉCISIONS\n';
  const choicesAt = text.indexOf(choicesMarker, prefix.length);
  let finalMarker = `\n\n${BRIEF_END[kind]}`;
  let endingAt = text.lastIndexOf(finalMarker);
  if (endingAt < 0 && kind === 'video') {
    finalMarker = `\n\n${PREVIOUS_VIDEO_END}`;
    endingAt = text.lastIndexOf(finalMarker);
  }
  if (choicesAt < 0 || endingAt < choicesAt + choicesMarker.length) return text;

  const contextAt = text.indexOf('\n\nCONTEXTE\n', prefix.length);
  const sourceEnd = contextAt >= 0 && contextAt < choicesAt ? contextAt : choicesAt;
  const source = text.slice(prefix.length, sourceEnd);
  const suffix = text.slice(endingAt + finalMarker.length);
  return suffix.trim() ? `${source}\n\n${suffix}` : source;
}

export function buildBrief(kind: BriefKind, request: string, questions: BriefQuestion[], answers: BriefAnswers, context?: string): string {
  const introduction = BRIEF_INTRO[kind];
  const lines = [introduction, '', 'DEMANDE', request.trim() ? request : 'À préciser.'];
  if (context?.trim()) lines.push('', 'CONTEXTE', context);
  lines.push('', 'CHOIX ET PRÉCISIONS');
  for (const item of questions) {
    const answer = readBriefAnswer(answers[item.id]);
    lines.push('', item.label);
    for (const choice of answer.choices) lines.push(`Choix : ${choice}`);
    if (answer.detail.trim()) lines.push(`Précision : ${answer.detail}`);
    if (!answer.choices.length && !answer.detail.trim()) lines.push('Non précisé.');
  }
  lines.push('', BRIEF_END[kind]);
  return lines.join('\n');
}

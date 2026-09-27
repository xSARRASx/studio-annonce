import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildQuestions, buildBrief, recoverBriefSource, readBriefAnswer, toggleBriefChoice } from '../../shared/brief-flow.ts';

test('Les anciens brouillons à une carte sont migrés sans changer le texte libre', () => {
  const detail = '  Garder les rideaux.\nPuis ajouter des plantes.  ';
  assert.deepEqual(readBriefAnswer({ choice: 'Chaleureuse', detail }), { choices: ['Chaleureuse'], detail });
  assert.deepEqual(readBriefAnswer({ choice: '', detail }), { choices: [], detail });
  assert.deepEqual(readBriefAnswer(null), { choices: [], detail: '' });
});

test('Le tableau actuel est prioritaire même vide et ignore les valeurs invalides ou répétées', () => {
  assert.deepEqual(readBriefAnswer({ choices: [], choice: 'Ancien choix', detail: 'Conserver ceci.' }), { choices: [], detail: 'Conserver ceci.' });
  assert.deepEqual(readBriefAnswer({ choices: ['Vue drone', null, '', '  ', 5, 'Mouvements doux', 'Vue drone'], choice: 'Ancien choix', detail: 42 }), { choices: ['Vue drone', 'Mouvements doux'], detail: '' });
});

test('Une carte supplémentaire conserve les autres cartes et toutes les précisions', () => {
  const detail = '  Lent autour de la table.\nPuis en hauteur.  ';
  const original = { choices: ['Vue drone'], detail };
  const added = toggleBriefChoice(original, 'Mouvements doux');
  assert.deepEqual(added, { choices: ['Vue drone', 'Mouvements doux'], detail });
  assert.deepEqual(original, { choices: ['Vue drone'], detail });
  assert.deepEqual(toggleBriefChoice(added, 'Vue drone'), { choices: ['Mouvements doux'], detail });
  assert.deepEqual(toggleBriefChoice(undefined, 'Vue drone'), { choices: ['Vue drone'], detail: '' });
  assert.deepEqual(toggleBriefChoice({ choice: 'Vue drone', detail }, 'Mouvements doux'), added);
});

test('Le brief affiche chaque carte cochée avec le texte libre exact', () => {
  const request = 'Une visite drone de la maison';
  const detail = '  Drone dans le jardin, puis mouvement doux dans le salon.\nAucune coupe brusque.  ';
  const questions = buildQuestions('video', request);
  const brief = buildBrief('video', request, questions, {
    'video-camera': { choices: ['Vue drone', 'Mouvements doux'], detail },
  });
  assert.ok(brief.includes('Choix : Vue drone\nChoix : Mouvements doux'));
  assert.ok(brief.includes(`Précision : ${detail}`));
  assert.equal(recoverBriefSource('video', brief), request);
});

test('Les questions de base restent présentes, quelle que soit la demande', () => {
  const expected = {
    photo: ['photo-preservation', 'photo-mood', 'photo-framing'],
    video: ['video-camera', 'video-duration', 'video-format', 'video-mood', 'video-fidelity'],
    image: ['image-subject', 'image-mood', 'image-style', 'image-format'],
  };
  for (const [kind, ids] of Object.entries(expected)) {
    for (const request of ['', 'Tout changer', 'Drone, jardin, piscine, décoration, lumière et rangement']) {
      const questions = buildQuestions(kind, request);
      assert.deepEqual(questions.filter(item => item.core).map(item => item.id), ids);
      assert.ok(questions.length <= 8);
      assert.equal(new Set(questions.map(item => item.id)).size, questions.length);
      assert.ok(questions.every(item => item.options.length === 4));
    }
  }
});

test('La phrase ajoute des questions pertinentes, avec des IDs stables et des accents reconnus', () => {
  const decoration = buildQuestions('photo', 'Changer complètement la décoration et le mobilier.');
  const light = buildQuestions('photo', 'Rendre cette pièce très LUMINEUSE.');
  assert.ok(decoration.some(item => item.id === 'photo-decoration' && !item.core));
  assert.ok(!decoration.some(item => item.id === 'photo-light'));
  assert.ok(light.some(item => item.id === 'photo-light'));
  assert.ok(!light.some(item => item.id === 'photo-decoration'));
  assert.deepEqual(buildQuestions('photo', 'Un canapé bleu').map(item => item.id), decoration.map(item => item.id));
  assert.ok(!buildQuestions('photo', 'Un canapé orange').some(item => item.id === 'photo-tidying'));
});

test('Les suggestions du formulaire et les formulations françaises courantes adaptent les questions', () => {
  for (const [request, topic] of [
    ['Changer toute la déco', 'decoration'],
    ['Plus de lumière', 'light'],
    ['Ranger et désencombrer', 'tidying'],
    ['Faire le lit', 'tidying'],
    ['Refais les lits', 'tidying'],
    ['Augmenter la luminosité', 'light'],
    ['Un salon plus clair', 'light'],
    ['Mets de l’ordre dans la chambre', 'tidying'],
    ['Un relooking de la pièce', 'decoration'],
  ]) {
    assert.ok(buildQuestions('photo', request).some(item => item.id === `photo-${topic}`), request);
  }
  for (const request of ['Découper la vidéo', 'Décoller avec le drone', 'Une orange sur la table', 'Le livre que je lis']) {
    const questions = buildQuestions('photo', request);
    assert.ok(!questions.some(item => ['photo-decoration', 'photo-light', 'photo-tidying'].includes(item.id)), request);
  }
});

test('Le trajet de caméra reste propre aux vidéos et les questions ciblées sont limitées', () => {
  const request = 'Un drone autour de la piscine, changer la décoration, éclairer et ranger le salon.';
  const video = buildQuestions('video', request);
  assert.ok(video.some(item => item.id === 'video-route'));
  assert.ok(video.some(item => item.id === 'video-outdoor'));
  assert.equal(video.filter(item => !item.core).length, 3);
  assert.ok(buildQuestions('photo', request).every(item => !item.id.endsWith('-route')));
  assert.ok(buildQuestions('image', request).every(item => !item.id.endsWith('-route')));
});

test('Le brief conserve le choix de carte et le texte libre mot pour mot', () => {
  const questions = buildQuestions('video', 'Je veux une visite drone.');
  const detail = '  Entrer par la terrasse ; garder le tapis bleu.\nPuis : un tour très lent.  ';
  const brief = buildBrief('video', 'Je veux une visite drone.', questions, {
    'video-camera': { choice: 'Vue drone', detail },
  }, 'Sources : salon, cuisine.');
  assert.ok(brief.includes('Choix : Vue drone'));
  assert.ok(brief.includes(`Précision : ${detail}`));
  assert.ok(brief.includes('Sources : salon, cuisine.'));
  assert.ok(questions.every(item => brief.includes(item.label)));
  assert.match(brief, /ne garantissent pas.*trajet continu/);
});

test('Une réponse libre seule fonctionne et une ancienne réponse hors parcours est exclue', () => {
  const questions = buildQuestions('photo', 'Une meilleure lumière');
  const brief = buildBrief('photo', 'Une meilleure lumière', questions, {
    'photo-light': { choice: '', detail: 'Un matin brumeux, sans soleil direct.' },
    'photo-decoration': { choice: 'Tout remplacer', detail: 'Cette ancienne réponse ne doit plus apparaître.' },
  });
  assert.ok(brief.includes('Précision : Un matin brumeux, sans soleil direct.'));
  assert.ok(!brief.includes('Choix : \n'));
  assert.ok(!brief.includes('Tout remplacer'));
  assert.ok(!brief.includes('ancienne réponse'));
});

test('La création d’image est complète sans fichier et identifiée comme fictive', () => {
  const questions = buildQuestions('image', 'Créer un salon avec du mobilier bleu.');
  const brief = buildBrief('image', 'Créer un salon avec du mobilier bleu.', questions, {
    'image-subject': { choice: 'Un intérieur', detail: 'Un grand salon imaginaire.' },
  });
  assert.match(brief, /image nouvelle et fictive/);
  assert.match(brief, /Aucune photo source n’est requise/);
  assert.ok(!brief.includes('Retoucher la photo fournie'));
  assert.ok(questions.every(item => !item.id.includes('preservation') && !item.id.includes('fidelity')));
});

test('La reprise récupère uniquement l’idée exacte de nos trois formats, avec ou sans contexte', () => {
  const request = '  Changer le canapé.\nGarder la table !  ';
  for (const kind of ['photo', 'video', 'image']) {
    const questions = buildQuestions(kind, request);
    const answers = Object.fromEntries(questions.map(item => [item.id, { choice: item.options[0].label, detail: 'Une précision de réponse.' }]));
    for (const context of [undefined, 'Sources : salon, cuisine.']) {
      const brief = buildBrief(kind, request, questions, answers, context);
      assert.equal(recoverBriefSource(kind, brief), request);
    }
  }
});

test('Modifier la section DEMANDE puis reprendre utilise la nouvelle phrase', () => {
  const request = 'Changer la décoration.';
  const questions = buildQuestions('photo', request);
  const brief = buildBrief('photo', request, questions, {});
  const changed = brief.replace('\nDEMANDE\nChanger la décoration.', '\nDEMANDE\nUne lumière plus douce.');
  assert.equal(recoverBriefSource('photo', changed), 'Une lumière plus douce.');
});

test('Une phrase ajoutée après notre brief rejoint l’idée sans altérer son texte', () => {
  const request = 'Changer la décoration.';
  const questions = buildQuestions('photo', request);
  const brief = buildBrief('photo', request, questions, {});
  const suffix = '\n  Garder les coussins rouges !\nEt le tableau bleu.  ';
  assert.equal(recoverBriefSource('photo', brief + suffix), `${request}\n\n${suffix}`);
  const recovered = recoverBriefSource('photo', brief + suffix);
  assert.ok(!recovered.includes('CHOIX ET PRÉCISIONS'));
  assert.ok(!recovered.includes('Retoucher la photo fournie'));
});

test('Un texte normal, un brief inconnu ou incomplet restent rigoureusement intacts', () => {
  const normal = '  Ma demande libre\n\nCONTEXTE\nUn salon bleu.  ';
  assert.equal(recoverBriefSource('photo', normal), normal);
  const brief = buildBrief('photo', 'Changer la déco.', buildQuestions('photo', 'Changer la déco.'), {});
  assert.equal(recoverBriefSource('video', brief), brief);
  const incomplete = brief.slice(0, brief.lastIndexOf('\n\n'));
  assert.equal(recoverBriefSource('photo', incomplete), incomplete);
});

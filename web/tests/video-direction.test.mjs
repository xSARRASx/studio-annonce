import test from 'node:test';
import assert from 'node:assert/strict';
import { CAMERA_MOVES, cameraDescription, readCameraMoves, cameraMove } from '../../shared/video-direction.ts';

test('les anciens brouillons restent lisibles et les mouvements inconnus sont remplacés', () => {
  assert.deepEqual(readCameraMoves(undefined), {});
  assert.deepEqual(readCameraMoves({ photo: 'orbite', autre: 'invalide' }), { photo: 'orbite', autre: 'auto' });
  assert.equal(cameraMove(null), 'auto');
});
test('les plans automatiques alternent et le choix explicite suit la photo', () => {
  assert.match(cameraDescription('auto', 0), /Traversée/);
  assert.match(cameraDescription('auto', 1), /Autour/);
  assert.match(cameraDescription('auto', 2), /Révélation/);
  assert.equal(cameraDescription('orbite', 0), cameraDescription('orbite', 2));
  assert.deepEqual(CAMERA_MOVES.map(m => m.id), ['auto', 'traversee', 'orbite', 'revelation', 'calme']);
});

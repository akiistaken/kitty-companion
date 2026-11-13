import { AccessoryId, CoatId, FocusState, KittenSaveState, KittenSettings, ToyKind } from './kitten';

export interface HudSyncPayload {
  save: KittenSaveState;
  focus: FocusState;
  teaseYarnActive?: boolean;
  featherWandActive?: boolean;
  cushionActive?: boolean;
  laserActive?: boolean;
  plantActive?: boolean;
  brushActive?: boolean;
  giftBoxActive?: boolean;
}

export type HudAction =
  | { type: 'rename'; name: string }
  | { type: 'selectCoat'; coat: CoatId }
  | { type: 'equipAccessory'; accessory: AccessoryId }
  | { type: 'tossToy'; kind: ToyKind }
  | { type: 'pokeKitten' }
  | { type: 'toggleTeaseYarn' }
  | { type: 'toggleFeatherWand' }
  | { type: 'toggleCushion' }
  | { type: 'toggleLaser' }
  | { type: 'togglePlant' }
  | { type: 'toggleBrush' }
  | { type: 'toggleGiftBox' }
  | { type: 'spawnBubbles' }
  | { type: 'doTrick' }
  | { type: 'clearYarn' }
  | { type: 'toggleFocus' }
  | { type: 'snapMemory' }
  | { type: 'deleteMemory'; id: string }
  | { type: 'deleteSavedNote'; id: string }
  | { type: 'updateSettings'; patch: Partial<KittenSettings> }
  | { type: 'replayIntro' }
  | { type: 'reset' };

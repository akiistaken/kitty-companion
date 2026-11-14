import React, { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { HudDrawer } from './components/HudDrawer';
import { createInitialSaveState } from './engine/progression';
import { HudAction, HudSyncPayload } from './types/bridge';
import { AccessoryId, CoatId, FocusState, KittenSaveState, KittenSettings } from './types/kitten';

function isTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
}

const DEFAULT_FOCUS: FocusState = {
  active: false,
  totalSeconds: 25 * 60,
  remainingSeconds: 25 * 60,
  startedAt: 0,
};

export const HudWindow: React.FC = () => {
  const [save, setSave] = useState<KittenSaveState>(() => createInitialSaveState());
  const [focus, setFocus] = useState<FocusState>(DEFAULT_FOCUS);
  const [teaseYarnActive, setTeaseYarnActive] = useState<boolean>(false);
  const [cushionActive, setCushionActive] = useState<boolean>(false);
  const [laserActive, setLaserActive] = useState<boolean>(false);
  const [plantActive, setPlantActive] = useState<boolean>(false);
  const [brushActive, setBrushActive] = useState<boolean>(false);
  const [giftBoxActive, setGiftBoxActive] = useState<boolean>(false);
  const [lanternActive, setLanternActive] = useState<boolean>(false);

  useEffect(() => {
    if (!isTauri()) return;
    let disposed = false;

    const applyPayload = (raw: string | null) => {
      if (!raw || disposed) return;
      try {
        const parsed = JSON.parse(raw) as HudSyncPayload;
        if (parsed.save) setSave(parsed.save);
        if (parsed.focus) setFocus(parsed.focus);
        if (typeof parsed.teaseYarnActive === 'boolean') {
          setTeaseYarnActive(parsed.teaseYarnActive);
        }
        if (typeof parsed.cushionActive === 'boolean') {
          setCushionActive(parsed.cushionActive);
        }
        if (typeof parsed.laserActive === 'boolean') {
          setLaserActive(parsed.laserActive);
        }
        if (typeof parsed.plantActive === 'boolean') {
          setPlantActive(parsed.plantActive);
        }
        if (typeof parsed.brushActive === 'boolean') {
          setBrushActive(parsed.brushActive);
        }
        if (typeof parsed.giftBoxActive === 'boolean') {
          setGiftBoxActive(parsed.giftBoxActive);
        }
        if (typeof parsed.lanternActive === 'boolean') {
          setLanternActive(parsed.lanternActive);
        }
      } catch {
        // Ignore malformed sync packets
      }
    };

    void invoke<string | null>('get_hud_state').then(applyPayload);

    let unlisten: (() => void) | null = null;
    void listen<string>('kitten://state-sync', (event) => {
      applyPayload(event.payload);
    }).then((fn) => {
      if (disposed) fn();
      else {
        unlisten = fn;
        void invoke('notify_hud_ready').catch(() => {});
      }
    });

    return () => {
      disposed = true;
      unlisten?.();
    };
  }, []);

  const sendAction = (action: HudAction) => {
    if (isTauri()) {
      void invoke('dispatch_hud_action', { actionJson: JSON.stringify(action) });
    }
  };

  const handleRename = (name: string) => {
    setSave((prev) => ({ ...prev, name }));
    sendAction({ type: 'rename', name });
  };

  const handleSelectCoat = (coat: CoatId) => {
    setSave((prev) => ({ ...prev, coat }));
    sendAction({ type: 'selectCoat', coat });
  };

  const handleEquipAccessory = (accessory: AccessoryId) => {
    setSave((prev) => ({ ...prev, equippedAccessory: accessory }));
    sendAction({ type: 'equipAccessory', accessory });
  };

  const handleUpdateSettings = (patch: Partial<KittenSettings>) => {
    setSave((prev) => ({ ...prev, settings: { ...prev.settings, ...patch } }));
    sendAction({ type: 'updateSettings', patch });
  };

  const handleClose = () => {
    if (isTauri()) {
      void invoke('hide_hud_window');
    }
  };

  const handleExitApp = () => {
    if (isTauri()) {
      void invoke('quit_app');
    } else if (typeof window !== 'undefined') {
      window.close();
    }
  };

  return (
    <HudDrawer
      standalone
      save={save}
      focus={focus}
      teaseYarnActive={teaseYarnActive}
      cushionActive={cushionActive}
      laserActive={laserActive}
      plantActive={plantActive}
      brushActive={brushActive}
      giftBoxActive={giftBoxActive}
      lanternActive={lanternActive}
      onClose={handleClose}
      onRename={handleRename}
      onSelectCoat={handleSelectCoat}
      onEquipAccessory={handleEquipAccessory}
      onTossToy={(kind) => sendAction({ type: 'tossToy', kind })}
      onPokeKitten={() => sendAction({ type: 'pokeKitten' })}
      onToggleTeaseYarn={() => sendAction({ type: 'toggleTeaseYarn' })}
      onToggleCushion={() => sendAction({ type: 'toggleCushion' })}
      onToggleLaser={() => sendAction({ type: 'toggleLaser' })}
      onTogglePlant={() => sendAction({ type: 'togglePlant' })}
      onToggleBrush={() => sendAction({ type: 'toggleBrush' })}
      onToggleGiftBox={() => sendAction({ type: 'toggleGiftBox' })}
      onToggleLantern={() => sendAction({ type: 'toggleLantern' })}
      onSummonShootingStar={() => sendAction({ type: 'summonShootingStar' })}
      onMakeJarWish={() => sendAction({ type: 'makeJarWish' })}
      onSpawnBubbles={() => sendAction({ type: 'spawnBubbles' })}
      onDoTrick={() => sendAction({ type: 'doTrick' })}
      onDoStretch={() => sendAction({ type: 'doStretch' })}
      onDoRoll={() => sendAction({ type: 'doRoll' })}
      onClearYarn={() => sendAction({ type: 'clearYarn' })}
      onToggleFocus={() => sendAction({ type: 'toggleFocus' })}
      onSnapMemory={() => sendAction({ type: 'snapMemory' })}
      onDeleteMemory={(id) => sendAction({ type: 'deleteMemory', id })}
      onDeleteSavedNote={(id) => sendAction({ type: 'deleteSavedNote', id })}
      onUpdateSettings={handleUpdateSettings}
      onReplayIntro={() => {
        sendAction({ type: 'replayIntro' });
        handleClose();
      }}
      onResetKitten={() => sendAction({ type: 'reset' })}
      onExitApp={handleExitApp}
    />
  );
};

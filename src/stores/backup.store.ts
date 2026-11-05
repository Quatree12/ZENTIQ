import { create } from 'zustand';
import { evaluateBackupReminder, type BackupReminder } from '@/services/backup-reminder.service';
import type { UserSettings } from '@/types';

/**
 * Store du rappel de sauvegarde.
 *
 * Il porte un seul fait : faut-il oui ou non suggerer un export maintenant.
 * Le calcul vit dans le service, pas ici.
 */

interface BackupState {
  reminder: BackupReminder | null;
  refresh: (settings: UserSettings | null) => Promise<void>;
  reset: () => void;
}

export const useBackupStore = create<BackupState>((set) => ({
  reminder: null,

  refresh: async (settings) => {
    // Sans reglages charges, on ne conclut rien : mieux vaut ne pas afficher de
    // rappel qu'en afficher un sur une supposition.
    if (!settings) {
      set({ reminder: null });
      return;
    }
    try {
      set({ reminder: await evaluateBackupReminder(settings) });
    } catch {
      // Un echec de lecture ne doit jamais bloquer l'ecran : on n'affiche rien.
      set({ reminder: null });
    }
  },

  reset: () => set({ reminder: null }),
}));

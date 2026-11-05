/**
 * Notifications transitoires (toasts).
 *
 * Un contexte React expose `notify()` a toute l'application.
 *
 * DEUX REGLES, issues de bugs constates sur iPhone :
 *   1. UN SEUL message a l'ecran. Une nouvelle notification remplace la
 *      precedente au lieu de s'empiler — sur mobile, trois messages
 *      successifs se recouvraient et masquaient la navigation.
 *   2. UNE SEULE notification par action repetee. Trois clics sur trois
 *      interrupteurs ne produisent pas trois fois « Preference enregistree. » :
 *      le minuteur du message identique deja affiche est simplement prolonge.
 *
 * La zone d'affichage est positionnee au-dessus de la barre de navigation
 * mobile, safe area iOS incluse (cf. Toast.css).
 */
import { CheckCircle2, Info, TriangleAlert, X, XCircle } from 'lucide-react';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { appConfig } from '@/app/app-config';
import { createId } from '@/utils/id';
import './Toast.css';

export type ToastTone = 'info' | 'success' | 'warning' | 'error';

export interface Toast {
  id: string;
  tone: ToastTone;
  message: string;
  detail?: string;
  /** Duree d'affichage en ms ; `0` pour un message persistant. */
  duration: number;
}

export interface NotifyOptions {
  tone?: ToastTone;
  detail?: string;
  duration?: number;
}

interface ToastContextValue {
  notify: (message: string, options?: NotifyOptions) => string;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const TONE_ICONS: Record<ToastTone, typeof Info> = {
  info: Info,
  success: CheckCircle2,
  warning: TriangleAlert,
  error: XCircle,
};

export function ToastProvider({ children }: { children: ReactNode }) {
  // UN SEUL message a la fois : une liste ne servirait qu'a empiler, ce que
  // l'on veut precisement eviter sur mobile.
  const [toast, setToast] = useState<Toast | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reference stable vers le message courant : evite d'avoir `toast` en
  // dependance de `notify`, qui serait recree a chaque affichage.
  const toastRef = useRef<Toast | null>(null);
  toastRef.current = toast;

  const clearTimer = useCallback(() => {
    if (timer.current !== null) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  }, []);

  const dismiss = useCallback(
    (id: string) => {
      clearTimer();
      setToast((current) => (current && current.id === id ? null : current));
    },
    [clearTimer],
  );

  const notify = useCallback(
    (message: string, options: NotifyOptions = {}) => {
      const duration = options.duration ?? appConfig.toastDurationMs;
      const existing = toastRef.current;

      // Message identique deja affiche : on prolonge, on n'empile pas.
      if (existing && existing.message === message && existing.detail === options.detail) {
        clearTimer();
        const keptId = existing.id;
        if (duration > 0) {
          timer.current = setTimeout(() => {
            setToast((current) => (current && current.id === keptId ? null : current));
            timer.current = null;
          }, duration);
        }
        return keptId;
      }

      const id = createId();
      clearTimer();
      setToast({
        id,
        tone: options.tone ?? 'info',
        message,
        detail: options.detail,
        duration,
      });

      if (duration > 0) {
        timer.current = setTimeout(() => {
          setToast((current) => (current && current.id === id ? null : current));
          timer.current = null;
        }, duration);
      }

      return id;
    },
    [clearTimer],
  );

  // Nettoyage : aucun minuteur ne doit survivre au demontage du provider.
  useEffect(() => {
    return () => {
      if (timer.current !== null) clearTimeout(timer.current);
    };
  }, []);

  const value = useMemo(() => ({ notify, dismiss }), [notify, dismiss]);
  const CurrentIcon = toast ? TONE_ICONS[toast.tone] : null;

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-region" role="region" aria-label="Notifications" aria-live="polite">
        {toast && CurrentIcon && (
          <div className={'toast toast--' + toast.tone} role="status">
            <span className="toast__icon" aria-hidden="true">
              <CurrentIcon size={18} />
            </span>
            <div className="toast__body">
              <p className="toast__message">{toast.message}</p>
              {toast.detail && <p className="toast__detail">{toast.detail}</p>}
            </div>
            <button
              type="button"
              className="toast__close"
              onClick={() => dismiss(toast.id)}
              aria-label="Fermer la notification"
            >
              <X size={16} aria-hidden="true" />
            </button>
          </div>
        )}
      </div>
    </ToastContext.Provider>
  );
}

/**
 * Acces aux notifications.
 * Renvoie une fonction neutre si aucun provider n'est monte : un composant
 * isole (test, story) ne doit pas planter a cause d'un contexte manquant.
 */
export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  return (
    context ?? {
      notify: () => '',
      dismiss: () => undefined,
    }
  );
}

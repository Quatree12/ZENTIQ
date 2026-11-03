/**
 * Notifications transitoires (toasts).
 *
 * Un contexte React expose `notify()` à toute l'application. Les messages
 * s'empilent en bas à droite sur desktop, en haut sur mobile ; ils ne bloquent
 * jamais l'interaction et sont annoncés aux lecteurs d'écran.
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
  /** Durée d'affichage en ms ; `0` pour un message persistant. */
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
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  const dismiss = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const notify = useCallback(
    (message: string, options: NotifyOptions = {}) => {
      const id = createId();
      const duration = options.duration ?? appConfig.toastDurationMs;
      setToasts((current) => [
        ...current,
        { id, tone: options.tone ?? 'info', message, detail: options.detail, duration },
      ]);

      if (duration > 0) {
        timers.current.set(
          id,
          setTimeout(() => dismiss(id), duration),
        );
      }

      return id;
    },
    [dismiss],
  );

  // Nettoyage : aucun minuteur ne doit survivre au démontage du provider.
  useEffect(() => {
    const active = timers.current;
    return () => {
      for (const timer of active.values()) clearTimeout(timer);
      active.clear();
    };
  }, []);

  const value = useMemo(() => ({ notify, dismiss }), [notify, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-region" role="region" aria-label="Notifications">
        {toasts.map((toast) => {
          const Icon = TONE_ICONS[toast.tone];
          return (
            <div key={toast.id} className={`toast toast--${toast.tone}`} role="status">
              <span className="toast__icon" aria-hidden="true">
                <Icon size={18} />
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
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

/**
 * Accès aux notifications.
 * Renvoie une fonction neutre si aucun provider n'est monté : un composant
 * isolé (test, story) ne doit pas planter à cause d'un contexte manquant.
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

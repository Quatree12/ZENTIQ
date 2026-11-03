/**
 * Modale.
 *
 * Implémenté sur l'élément natif `<dialog>` : le focus, l'inertie de l'arrière-
 * plan et la fermeture au clavier (Échap) sont gérés par le navigateur, ce qui
 * évite une réimplémentation fragile du piège à focus.
 */
import { X } from 'lucide-react';
import { useEffect, useRef, type ReactNode } from 'react';
import { IconButton } from '@/components/buttons';
import './Modal.css';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  /** Description lue par les lecteurs d'écran. */
  description?: string;
  children: ReactNode;
  /** Actions affichées en pied de modale. */
  footer?: ReactNode;
  /** Taille de la boîte. */
  size?: 'sm' | 'md' | 'lg';
}

export function Modal({ open, onClose, title, description, children, footer, size = 'md' }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  // Le clic sur le fond ferme la modale ; le clic sur le contenu ne remonte pas.
  const handleBackdropClick = (event: React.MouseEvent<HTMLDialogElement>) => {
    if (event.target === dialogRef.current) onClose();
  };

  return (
    <dialog
      ref={dialogRef}
      className={`modal modal--${size}`}
      onClose={onClose}
      onClick={handleBackdropClick}
      aria-label={title}
    >
      <div className="modal__panel">
        <header className="modal__header">
          <div>
            <h2 className="heading-sm modal__title">{title}</h2>
            {description && <p className="body-sm modal__description">{description}</p>}
          </div>
          <IconButton label="Fermer" onClick={onClose}>
            <X size={18} />
          </IconButton>
        </header>

        <div className="modal__body">{children}</div>

        {footer && <footer className="modal__footer">{footer}</footer>}
      </div>
    </dialog>
  );
}

/**
 * Dialogue de confirmation — action destructrice ou irréversible.
 * Le libellé du bouton nomme l'action (« Supprimer »), jamais un « OK ».
 */
export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  /** Ton du bouton de confirmation. */
  tone?: 'danger' | 'primary';
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel = 'Annuler',
  tone = 'primary',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      size="sm"
      footer={
        <>
          <button type="button" className="btn btn--tertiary btn--md" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`btn btn--${tone} btn--md`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </>
      }
    >
      <p className="body-base">{message}</p>
    </Modal>
  );
}

import { createPortal } from "react-dom";
import { useRef, useEffect, type ReactNode } from "react";
import "./Modal.css";

interface ModalProps {
  children: ReactNode;
  open: boolean;
}

export default function Modal({ children, open }: ModalProps) {
  const dialog = useRef<HTMLDialogElement | null>(null);

  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    if (open) el.showModal();
    else el.close();
  }, [open]);

  const container = document.getElementById("modal-root");
  if (!container) return null;

  return createPortal(<dialog ref={dialog}>{children}</dialog>, container);
}

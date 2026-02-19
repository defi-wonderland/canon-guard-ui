import { useEffect, type RefObject } from "react";

export function useModalClose(isOpen: boolean, onClose: () => void, modalRef: RefObject<HTMLElement | null>): void {
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    let timerId: ReturnType<typeof setTimeout> | null = null;
    let listenerAdded = false;

    if (isOpen) {
      timerId = setTimeout(() => {
        document.addEventListener("mousedown", handleClickOutside);
        listenerAdded = true;
      }, 0);
    }

    return () => {
      if (timerId !== null) {
        clearTimeout(timerId);
      }
      if (listenerAdded) {
        document.removeEventListener("mousedown", handleClickOutside);
      }
    };
  }, [isOpen, onClose, modalRef]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);
}

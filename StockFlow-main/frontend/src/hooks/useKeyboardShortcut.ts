import { useEffect } from 'react';

export const useKeyboardShortcut = (
  key: string,
  callback: (e: KeyboardEvent) => void,
  options: { ctrl?: boolean; shift?: boolean; alt?: boolean; preventDefault?: boolean } = {}
) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignore shortcuts if user is typing in an input or textarea
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        (event.target as HTMLElement).isContentEditable
      ) {
        return;
      }

      if (
        event.key.toLowerCase() === key.toLowerCase() &&
        !!options.ctrl === event.ctrlKey &&
        !!options.shift === event.shiftKey &&
        !!options.alt === event.altKey
      ) {
        if (options.preventDefault) {
          event.preventDefault();
        }
        callback(event);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [key, callback, options]);
};

import { useEffect, useRef } from 'react';

interface AnnouncerProps {
  message: string;
  assertive?: boolean;
}

export function Announcer({ message, assertive = false }: AnnouncerProps) {
  const ariaLiveRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ariaLiveRef.current;
    if (!node) return undefined;

    // Clear the content first to force screen readers to announce the new message
    node.textContent = '';
    
    // Small delay to ensure the clear takes effect
    const timeoutId = setTimeout(() => {
      if (node) {
        node.textContent = message;
      }
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [message]);

  return (
    <div
      ref={ariaLiveRef}
      aria-live={assertive ? 'assertive' : 'polite'}
      aria-atomic="true"
      className="sr-only"
    />
  );
}

export default Announcer; 
import { useState, useEffect, RefObject } from 'react';

export const useScroll = (containerRef: RefObject<HTMLElement>) => {
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const [showScrollButton, setShowScrollButton] = useState(false);

  const isNearBottom = () => {
    const container = containerRef.current;
    if (!container) return true;
    
    const threshold = 100; // pixels from bottom
    return container.scrollHeight - container.scrollTop - container.clientHeight < threshold;
  };

  const scrollToBottom = () => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
      setShouldAutoScroll(true);
    }
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const isNear = isNearBottom();
      setShouldAutoScroll(isNear);
      setShowScrollButton(!isNear);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [containerRef]);

  return {
    shouldAutoScroll,
    showScrollButton,
    scrollToBottom
  };
};
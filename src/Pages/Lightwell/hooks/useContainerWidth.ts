import { useEffect, useRef, useState } from 'react';
import { getResizeObserver } from '@patternfly/react-core';

export const useContainerWidth = (defaultWidth: number) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(defaultWidth);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleResize = () => {
      if (container.clientWidth > 0) {
        setWidth(container.clientWidth);
      }
    };
    const observerCleanup = getResizeObserver(container, handleResize);
    handleResize();
    return observerCleanup;
  }, []);

  return { containerRef, width };
};

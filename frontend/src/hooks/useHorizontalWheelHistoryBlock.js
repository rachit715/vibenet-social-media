import { useEffect } from 'react';

const isHorizontalGesture = (event) =>
  Math.abs(event.deltaX) > Math.abs(event.deltaY) && Math.abs(event.deltaX) >= 10;

const useHorizontalWheelHistoryBlock = (isActive) => {
  useEffect(() => {
    if (!isActive) return undefined;

    const handleWheel = (event) => {
      if (!isHorizontalGesture(event)) return;
      event.preventDefault();
    };

    window.addEventListener('wheel', handleWheel, {
      passive: false,
      capture: true,
    });

    return () => {
      window.removeEventListener('wheel', handleWheel, true);
    };
  }, [isActive]);
};

export default useHorizontalWheelHistoryBlock;

import { useState, useEffect, type RefObject } from 'react';

export function useOnScreen(ref: RefObject<Element>): boolean {
  const [isIntersecting, setIntersecting] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIntersecting(entry.isIntersecting);
      },
      { threshold: 0.7 } // Trigger when 70% of the element is visible
    );

    const currentRef = ref.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [ref]);

  return isIntersecting;
}

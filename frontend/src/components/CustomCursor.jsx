import { useEffect, useRef } from 'react';

const OUTER_SIZE = 25;   // px — outer ring diameter
const INNER_SIZE = 7;    // px — inner dot (smaller, fixed)
const OUTER_LERP = 0.08; // ring drifts to catch up after fast movement
// Inner dot renders at the exact raw mouse position (no lerp)

const CustomCursor = () => {
  const outerRef = useRef(null);
  const innerRef = useRef(null);

  const mouse = useRef({ x: -300, y: -300 });
  const outerPos = useRef({ x: -300, y: -300 });
  const raf = useRef(null);
  const visible = useRef(false);

  useEffect(() => {
    const onMove = (e) => {
      mouse.current = { x: e.clientX, y: e.clientY };
      if (!visible.current) {
        // Teleport outer ring to cursor on first appearance so it doesn't slide in from off-screen
        outerPos.current = { ...mouse.current };
        visible.current = true;
      }
    };
    const onLeave = () => { visible.current = false; };
    const onEnter = () => { visible.current = true; };

    window.addEventListener('mousemove', onMove);
    document.documentElement.addEventListener('mouseleave', onLeave);
    document.documentElement.addEventListener('mouseenter', onEnter);

    const loop = () => {
      // Outer ring: slowly drifts toward current mouse position
      outerPos.current.x += (mouse.current.x - outerPos.current.x) * OUTER_LERP;
      outerPos.current.y += (mouse.current.y - outerPos.current.y) * OUTER_LERP;

      const opacity = visible.current ? '1' : '0';

      // Outer ring — centred on its lagged position
      if (outerRef.current) {
        outerRef.current.style.transform =
          `translate(${outerPos.current.x - OUTER_SIZE / 2}px, ${outerPos.current.y - OUTER_SIZE / 2}px)`;
        outerRef.current.style.opacity = opacity;
      }

      // Inner dot — snaps exactly to raw mouse position
      if (innerRef.current) {
        innerRef.current.style.transform =
          `translate(${mouse.current.x - INNER_SIZE / 2}px, ${mouse.current.y - INNER_SIZE / 2}px)`;
        innerRef.current.style.opacity = opacity;
      }

      raf.current = requestAnimationFrame(loop);
    };

    raf.current = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('mousemove', onMove);
      document.documentElement.removeEventListener('mouseleave', onLeave);
      document.documentElement.removeEventListener('mouseenter', onEnter);
      cancelAnimationFrame(raf.current);
    };
  }, []);

  return (
    <>
      {/* Outer ring — thin, lagging */}
      <div
        ref={outerRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          boxSizing: 'border-box',
          width: `${OUTER_SIZE}px`,
          height: `${OUTER_SIZE}px`,
          border: '1px solid #154c79',
          opacity: 0.45,
          borderRadius: '50%',
          pointerEvents: 'none',
          zIndex: 99999,
          willChange: 'transform, opacity',
          transition: 'opacity 0.2s ease',
          mixBlendMode: 'multiply',
        }}
      />

      {/* Inner dot — small, snaps to cursor */}
      <div
        ref={innerRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: `${INNER_SIZE}px`,
          height: `${INNER_SIZE}px`,
          borderRadius: '50%',
          backgroundColor: '#154c79',
          pointerEvents: 'none',
          zIndex: 99999,
          willChange: 'transform, opacity',
          transition: 'opacity 0.2s ease',
        }}
      />
    </>
  );
};

export default CustomCursor;

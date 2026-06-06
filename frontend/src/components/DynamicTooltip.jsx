import { useState, useEffect } from 'react';

export function DynamicTooltip() {
  const [tooltip, setTooltip] = useState({ visible: false, text: '', x: 0, y: 0, transform: '' });

  useEffect(() => {
    let currentTarget = null;

    const handleMouseOver = (e) => {
      const target = e.target.closest('[data-tooltip]');
      if (target) {
        currentTarget = target;
        const rect = target.getBoundingClientRect();
        
        // Default to below
        let x;
        let y = rect.bottom + 8;
        let transform = 'translate(-50%, 0)';

        // Check vertical space (assume ~36px height for tooltip)
        if (rect.bottom + 36 > window.innerHeight) {
          // Put above instead
          y = rect.top - 8;
          transform = 'translate(-50%, -100%)';
        }

        // Check horizontal space (assume max tooltip width ~200px)
        // A simple clamp for X usually requires measuring the tooltip width, 
        // so let's stick to simple transforms for left/right edge cases:
        const xCenter = rect.left + rect.width / 2;
        if (xCenter < 60) {
           x = rect.left;
           transform = transform.replace('-50%', '0%');
        } else if (xCenter + 60 > window.innerWidth) {
           x = rect.right;
           transform = transform.replace('-50%', '-100%');
        } else {
           x = xCenter;
        }
        
        setTooltip({
          visible: true,
          text: target.getAttribute('data-tooltip'),
          x,
          y,
          transform
        });
      }
    };

    const handleMouseMove = () => {
      if (currentTarget) {
        // Optional: Tooltip follows cursor
        // setTooltip(prev => ({ ...prev, x: e.clientX, y: e.clientY + 15 }));
      }
    };

    const handleMouseOut = (e) => {
      if (currentTarget) {
        const relatedTarget = e.relatedTarget;
        if (!currentTarget.contains(relatedTarget)) {
          currentTarget = null;
          setTooltip(prev => ({ ...prev, visible: false }));
        }
      }
    };

    // Use capturing phase to ensure we catch events
    document.addEventListener('mouseover', handleMouseOver, true);
    document.addEventListener('mouseout', handleMouseOut, true);
    document.addEventListener('mousemove', handleMouseMove, true);

    return () => {
      document.removeEventListener('mouseover', handleMouseOver, true);
      document.removeEventListener('mouseout', handleMouseOut, true);
      document.removeEventListener('mousemove', handleMouseMove, true);
    };
  }, []);

  if (!tooltip.visible || !tooltip.text) return null;

  // Ensure tooltip stays within viewport
  const style = {
    position: 'fixed',
    top: `${tooltip.y}px`,
    left: `${tooltip.x}px`,
    transform: tooltip.transform || 'translate(-50%, 0)', // Center horizontally relative to trigger
    backgroundColor: 'var(--tooltip-bg, #1e293b)',
    color: 'var(--tooltip-fg, #f8fafc)',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: '500',
    whiteSpace: 'nowrap',
    pointerEvents: 'none',
    zIndex: 999999,
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    border: '1px solid var(--border-color, #334155)',
  };

  return (
    <div style={style} className="dynamic-tooltip">
      {tooltip.text}
    </div>
  );
}

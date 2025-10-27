import React, { useRef, useState, useEffect } from 'react';
import '../styles/ChatWidget.css';

function ChatWidget({ src, title = 'Chat with GI Yatra', width = 360, height = 520, mobileBreakpoint = 900 }) {
  const iframeRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth <= mobileBreakpoint : false);

  

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= mobileBreakpoint);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [mobileBreakpoint]);

  // optional: listen for messages from iframe
  useEffect(() => {
    function onMessage(e) {
      // optional: validate origin if desired
      // if (new URL(src).origin !== e.origin) return;
      // console.log('chat message', e.data);
    }
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [src]);

  // compute panel style: increase height by 10% when open
  const openHeight = Math.round(height * 1.1);
  // increase width by 10% when open as requested
  const openWidth = Math.round(width * 1.1);
  const panelStyle = !isMobile ? { width: `${open ? openWidth : width}px`, height: `${open ? openHeight : height}px` } : undefined;

  

  return (
    <>
      <div
        id="chat-panel"
        className={`chat-panel ${open ? 'open' : ''} ${isMobile ? 'mobile' : 'desktop'}`}
        style={panelStyle}
        role="dialog"
        aria-label={title}
      >
        <div className="chat-frame-viewport" style={{ width: '100%', height: '100%', overflow: 'hidden', position: 'relative' }}>
          {/* scale the iframe content down by contentScale to reduce inside content size */}
          {(() => {
            const contentScale = 0.82; // reduce size by 18%
            const inv = 1 / contentScale;
            const scaleWrapperStyle = {
              transform: `scale(${contentScale})`,
              transformOrigin: 'top left',
              width: `${inv * 100}%`,
              height: `${inv * 100}%`,
              position: 'absolute',
              left: 0,
              top: 0,
            };
            return (
              <div className="chat-frame-scale" style={scaleWrapperStyle}>
                <iframe
                  ref={iframeRef}
                  title={title}
                  src={src}
                  sandbox="allow-scripts allow-forms allow-same-origin"
                  frameBorder="0"
                  scrolling="no"
                  style={{ width: '100%', height: '100%', border: 0, overflow: 'hidden' }}
                />
              </div>
            );
          })()}
        </div>
        <button className="chat-close" onClick={() => setOpen(false)} aria-label="Close chat">✕</button>
      </div>

      <button
        className="chat-toggle"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        aria-controls="chat-panel"
        aria-label={open ? 'Close chat' : 'Open chat'}
      >
        {/* inline SVG chat bubble to avoid external asset dependency */}
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" fill="#fff" opacity="0.95"/>
        </svg>
      </button>
    </>
  );
}

export default ChatWidget;

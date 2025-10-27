import React, { useRef, useState, useEffect } from 'react';
import '../styles/ChatWidget.css';

function ChatWidget({ src, title = 'Chat with GI Yatra', width = 360, height = 520, mobileBreakpoint = 900 }) {
  const iframeRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth <= mobileBreakpoint : false);
  const [contentHeight, setContentHeight] = useState(null);
  // scale factor for internal iframe content (0.78 => reduce by another 2%, total 22% from original)
  const contentScale = 0.78;
  // helper to send messages to the iframe (if it's available)
  function postToIframe(message) {
    try {
      const targetOrigin = (() => {
        try { return new URL(src).origin; } catch { return '*'; }
      })();
      // debug: log outgoing messages to iframe
      try { console.debug('[ChatWidget] postToIframe ->', message, 'targetOrigin:', targetOrigin); } catch (e) {}
      if (iframeRef.current && iframeRef.current.contentWindow) {
        iframeRef.current.contentWindow.postMessage(message, targetOrigin);
      }
    } catch (err) {
      // ignore
    }
  }

  // try to hide scrollbars inside same-origin iframe by injecting CSS
  function hideIframeScrollbars() {
    try {
      const iframe = iframeRef.current;
      if (!iframe) return;
      const doc = iframe.contentDocument || (iframe.contentWindow && iframe.contentWindow.document);
      if (!doc) return;
      // inject CSS to hide scrollbars
      const styleId = 'chatwidget-hide-scrollbars';
      if (!doc.getElementById(styleId)) {
        const style = doc.createElement('style');
        style.id = styleId;
        style.innerHTML = `html, body { scrollbar-width: none !important; -ms-overflow-style: none !important; } ::-webkit-scrollbar { display: none !important; }`;
        (doc.head || doc.documentElement).appendChild(style);
      }
      try { console.debug('[ChatWidget] injected hide-scrollbar CSS into iframe (same-origin)'); } catch (e) {}
    } catch (err) {
      // cross-origin or access denied
      try { console.debug('[ChatWidget] cannot inject scrollbar CSS (cross-origin)'); } catch (e) {}
    }
  }

  function onIframeLoad() {
    // when iframe loads, try to hide scrollbars (if same-origin) and scroll to bottom
    hideIframeScrollbars();
    try { console.debug('[ChatWidget] iframe onLoad - requesting scroll to bottom'); } catch (e) {}
    postToIframe({ type: 'scrollToBottom' });
    // small delay then try same-origin scroll
    setTimeout(() => {
      try {
        const win = iframeRef.current && iframeRef.current.contentWindow;
        if (win && win.document && typeof win.scrollTo === 'function') {
          const h = win.document.documentElement.scrollHeight || win.document.body.scrollHeight || contentHeight || 0;
          win.scrollTo(0, h);
          try { console.debug('[ChatWidget] iframe onLoad same-origin scroll executed, height:', h); } catch (e) {}
        }
      } catch (err) { /* ignore */ }
    }, 120);
  }

  // when contentHeight changes (or panel opens), request the iframe to scroll to bottom
  useEffect(() => {
    if (!open) return;
    if (!iframeRef.current) return;
    // attempt same-origin direct scroll first (will throw if cross-origin)
    try {
      const win = iframeRef.current.contentWindow;
      try { console.debug('[ChatWidget] attempting same-origin scrollToBottom'); } catch (e) {}
      if (win && win.document && typeof win.scrollTo === 'function') {
        // scroll to bottom of the iframe document
        const h = win.document.documentElement.scrollHeight || win.document.body.scrollHeight || contentHeight || 0;
        win.scrollTo(0, h);
        try { console.debug('[ChatWidget] same-origin scroll executed, height:', h); } catch (e) {}
      }
    } catch (err) {
      // cross-origin or access denied; fall back to postMessage request
      try { console.debug('[ChatWidget] same-origin scroll failed (probably cross-origin)'); } catch (e) {}
    }
    // ask the iframe to scroll itself (requires iframe to implement a listener)
    try { console.debug('[ChatWidget] posting scrollToBottom (1)'); } catch (e) {}
    postToIframe({ type: 'scrollToBottom' });
    // repeat shortly after to improve reliability (iframe may need time to render)
    const t1 = setTimeout(() => { try { console.debug('[ChatWidget] posting scrollToBottom (2)'); } catch (e) {} ; postToIframe({ type: 'scrollToBottom' }); }, 150);
    const t2 = setTimeout(() => {
      try {
        const win = iframeRef.current && iframeRef.current.contentWindow;
        if (win && win.document && typeof win.scrollTo === 'function') {
          const h = win.document.documentElement.scrollHeight || win.document.body.scrollHeight || contentHeight || 0;
          win.scrollTo(0, h);
          try { console.debug('[ChatWidget] same-origin scroll retry executed, height:', h); } catch (e) {}
        }
      } catch (err) { /* ignore */ }
    }, 180);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [contentHeight, open]);

  // prevent mouse-wheel scrolling over the iframe and keep it pinned to bottom
  // previously we blocked wheel/touch to prevent scrolling; now we allow scrolling
  // but still attempt to auto-scroll to bottom on content updates/open.
  // portion of the top of the iframe to hide (22% of the iframe height)
  const topCrop = 0.22;

  

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
      try {
        const d = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
        if (d && typeof d === 'object') {
          try { console.debug('[ChatWidget] received message from iframe', e.origin, d); } catch (e) {}
          // listen for content height messages from the iframe
          if ((d.type === 'contentHeight' || d.type === 'height') && typeof d.height === 'number') {
            // store the reported content height (pixels)
            setContentHeight(d.height);
          }
        }
      } catch (err) {
        // not JSON or irrelevant message — ignore
      }
    }
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [src]);

  // (no parent-side input in this configuration)

  // compute panel style: prefer using iframe-reported contentHeight when available
  const openHeight = Math.round(height * 1.25); // fallback increase by 25%
  const openWidth = Math.round(width * 1.1);
  let panelStyle;
  if (!isMobile) {
    if (open) {
      // if iframe reported height, use it (plus reserved bottom area), otherwise fallback
        if (contentHeight && typeof window !== 'undefined') {
        const reserved = 80; // pixels to ensure bottom controls have space
        const maxH = Math.round(window.innerHeight * 0.9); // cap at 90vh
        // account for contentScale and topCrop when sizing parent: the reported contentHeight is in iframe pixels
        const visibleFactor = (1 - topCrop); // we crop the top 7%
        const desired = Math.min(Math.round(contentHeight * contentScale * visibleFactor) + reserved, maxH);
        panelStyle = { width: `${openWidth}px`, height: `${desired}px` };
      } else {
        panelStyle = { width: `${openWidth}px`, height: `${openHeight}px` };
      }
    } else {
      panelStyle = { width: `${width}px`, height: `${height}px` };
    }
  } else {
    panelStyle = { width: '100%', height: open ? '90vh' : '60vh' };
  }

  

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
          {/* scale wrapper to reduce internal content size by contentScale */}
          {(() => {
            const inv = 1 / contentScale;
            const scaleWrapperStyle = {
              // anchor scaled content to the bottom so the top gets cropped
              transform: `scale(${contentScale})`,
              transformOrigin: 'bottom left',
              width: `${inv * 100}%`,
              height: `${inv * 100}%`,
              position: 'absolute',
              left: 0,
              bottom: 0,
            };
            return (
              <div className="chat-frame-scale" style={scaleWrapperStyle}>
                <iframe
                  ref={iframeRef}
                  title={title}
                  src={src}
                  sandbox="allow-scripts allow-forms allow-same-origin"
                  frameBorder="0"
                  onLoad={onIframeLoad}
                  style={{ width: '100%', height: '100%', border: 0, overflow: 'auto' }}
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

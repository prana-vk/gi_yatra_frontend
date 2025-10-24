import React from 'react';

function Modal({ isOpen, title, children, actions = [], onClose }) {
  if (!isOpen) return null;
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(2,6,23,0.6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000
    }} onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(92vw, 560px)', background: '#fff', borderRadius: 16,
          boxShadow: '0 20px 60px rgba(2,6,23,0.35)', overflow: 'hidden'
        }}
      >
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #e2e8f0' }}>
          <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>{title}</h3>
        </div>
        <div style={{ padding: '1.25rem 1.5rem', color: '#334155' }}>{children}</div>
        <div style={{ padding: '1rem 1.5rem', display: 'flex', gap: 8, justifyContent: 'flex-end', background: '#f8fafc' }}>
          {actions.length === 0 ? (
            <button
              onClick={onClose}
              style={{ padding: '0.75rem 1.25rem', borderRadius: 10, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontWeight: 700 }}
            >OK</button>
          ) : (
            actions.map((a, i) => (
              <button
                key={i}
                onClick={a.onClick}
                style={{
                  padding: '0.75rem 1.25rem', borderRadius: 10, cursor: 'pointer', fontWeight: 700,
                  border: a.variant === 'primary' ? 'none' : '1px solid #e2e8f0',
                  background: a.variant === 'primary' ? 'linear-gradient(90deg,#0ea5e9,#6366f1)' : '#fff',
                  color: a.variant === 'primary' ? '#fff' : '#0f172a'
                }}
              >
                {a.label}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default Modal;

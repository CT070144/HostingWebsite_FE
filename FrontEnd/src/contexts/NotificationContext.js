import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import NotificationModal from '../components/Notification/NotificationModal';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    type: 'info',
  });

  const timerRef = useRef(null);

  const close = useCallback(() => {
    setNotification((prev) => ({ ...prev, open: false }));
  }, []);

  const show = useCallback((message, type = 'info', options = {}) => {
    const duration = options.duration ?? 2500;
    setNotification({ open: true, message, type });
    if (timerRef.current) clearTimeout(timerRef.current);
    if (duration > 0) {
      timerRef.current = setTimeout(() => {
        setNotification((prev) => ({ ...prev, open: false }));
      }, duration);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const value = {
    notify: show,
    notifySuccess: (msg, opts) => show(msg, 'success', opts),
    notifyError: (msg, opts) => show(msg, 'error', opts),
    notifyWarning: (msg, opts) => show(msg, 'warning', opts),
    notifyInfo: (msg, opts) => show(msg, 'info', opts),
    closeNotification: close,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <NotificationModal
        open={notification.open}
        message={notification.message}
        type={notification.type}
        onClose={close}
      />
    </NotificationContext.Provider>
  );
};

export const useNotify = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error('useNotify must be used within NotificationProvider');
  }
  return ctx;
};



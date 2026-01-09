'use client';

import React, { useState, useEffect } from 'react';

interface Notification {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  timestamp: number;
}

export const useExportNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = (message: string, type: Notification['type'] = 'info') => {
    const id = Math.random().toString(36).substring(2, 15);
    const notification: Notification = {
      id,
      message,
      type,
      timestamp: Date.now()
    };
    setNotifications(prev => [...prev, notification]);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // 自动移除通知（5秒后）
  useEffect(() => {
    if (notifications.length === 0) return;

    const timer = setTimeout(() => {
      const oldest = notifications.reduce((a, b) => a.timestamp < b.timestamp ? a : b);
      removeNotification(oldest.id);
    }, 5000);

    return () => clearTimeout(timer);
  }, [notifications]);

  const NotificationContainer = () => {
    if (notifications.length === 0) return null;

    return (
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {notifications.map(notification => {
          const getBgColor = () => {
            switch (notification.type) {
              case 'success': return 'bg-green-600';
              case 'error': return 'bg-red-600';
              case 'warning': return 'bg-yellow-600';
              case 'info': return 'bg-blue-600';
              default: return 'bg-gray-600';
            }
          };

          return (
            <div
              key={notification.id}
              className={`${getBgColor()} text-white px-4 py-2 rounded-md shadow-lg flex items-center justify-between`}
            >
              <span>{notification.message}</span>
              <button
                onClick={() => removeNotification(notification.id)}
                className="ml-2 text-white hover:text-gray-200"
              >
                ✕
              </button>
            </div>
          );
        })}
      </div>
    );
  };

  return {
    notifications,
    addNotification,
    removeNotification,
    NotificationContainer
  };
};

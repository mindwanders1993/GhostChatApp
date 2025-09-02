import React from 'react';
import { MessageStatus } from '../types';

interface Props {
  status?: MessageStatus;
  currentUserId: string;
  isOwnMessage: boolean;
  className?: string;
}

export const MessageStatusIndicator: React.FC<Props> = ({
  status,
  currentUserId,
  isOwnMessage,
  className = ''
}) => {
  // Only show status for own messages
  if (!isOwnMessage || !status) {
    return null;
  }

  const getStatusInfo = () => {
    const deliveredCount = Object.keys(status.delivered || {}).length;
    const readCount = Object.keys(status.read || {}).length;

    // Determine overall status
    if (readCount > 0) {
      return {
        icon: '✓✓',
        color: 'text-blue-400',
        title: `Read by ${readCount} ${readCount === 1 ? 'person' : 'people'}`
      };
    } else if (deliveredCount > 0) {
      return {
        icon: '✓✓',
        color: 'text-gray-400',
        title: `Delivered to ${deliveredCount} ${deliveredCount === 1 ? 'person' : 'people'}`
      };
    } else if (status.sent) {
      return {
        icon: '✓',
        color: 'text-gray-500',
        title: 'Sent'
      };
    } else {
      return {
        icon: '○',
        color: 'text-gray-600',
        title: 'Sending...'
      };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <span
      className={`inline-flex items-center text-xs ${statusInfo.color} ${className}`}
      title={statusInfo.title}
    >
      {statusInfo.icon}
    </span>
  );
};
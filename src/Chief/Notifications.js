import React, { useState, useEffect } from 'react';
import './style/Notifications.css';
import { subscribeToWebNotifications, updateWebNotification } from '../services/firestoreService';

/**
 * Notifications page component for Chief/Admin.
 * Displays and manages override requests and transfer requests from nurses and patients.
 * Allows filtering, viewing details, and approving/rejecting requests.
 * All data is synchronized with Firestore in real-time.
 * @returns {JSX.Element} Notifications management interface
 */
const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [selectedNotification, setSelectedNotification] = useState(null);

  // Subscribe to Firebase notifications collection
  useEffect(() => {
    const unsubscribe = subscribeToWebNotifications((notificationsData) => {
      console.log('Notifications received:', notificationsData?.length || 0);
      setNotifications(notificationsData || []);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  /**
   * Filters notifications based on search query.
   * Matches against subject, message, audience, or priority fields.
   * @type {Array}
   */
  const filteredNotifications = (notifications || []).filter(
    (n) => {
      if (!n) return false;
      const searchLower = filter.toLowerCase();
      return (n.subject || '').toLowerCase().includes(searchLower) ||
             (n.message || '').toLowerCase().includes(searchLower) ||
             (n.audience || '').toLowerCase().includes(searchLower) ||
             (n.priority || '').toLowerCase().includes(searchLower);
    }
  );

  /**
   * Opens the notification detail modal.
   * @param {Object} notification - Notification object to display
   */
  const openNotificationDetailModal = (notification) => setSelectedNotification(notification);
  
  /**
   * Closes the notification detail modal.
   */
  const closeNotificationDetailModal = () => setSelectedNotification(null);

  /**
   * Formats a date/timestamp to a readable string.
   */
  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    if (timestamp.toDate) return timestamp.toDate().toLocaleString();
    if (timestamp instanceof Date) return timestamp.toLocaleString();
    return timestamp.toString();
  };

  /**
   * Updates notification status - saves to Firebase.
   * @param {string} id - Notification ID.
   * @param {string} action - 'approved' or 'rejected'.
   */
  const handleAction = async (id, action) => {
    try {
      await updateWebNotification(id, { 
        status: action,
        reviewedAt: new Date().toISOString(),
      });
      closeNotificationDetailModal();
    } catch (error) {
      console.error('Error updating notification:', error);
      alert(`Error updating notification: ${error.message}`);
    }
  };

  return (
    <div className="notifications-page">
      <h1>Notifications</h1>
      <p>Review override requests and transfer requests from nurses and patients.</p>

      {/* Search / Filter */}
      <div className="notifications-actions">
        <input
          type="text"
          placeholder="Search by type, from, to, or description"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>

      {/* Notifications Feed */}
      <div className="notifications-feed">
        {loading ? (
          <p className="empty-state">Loading notifications...</p>
        ) : filteredNotifications.length > 0 ? (
          filteredNotifications.map((n) => (
            <div
              key={n.id}
              className={`notification-card ${n.status || 'sent'}`}
              onClick={() => openNotificationDetailModal(n)}
            >
              <div>
                <span className="notif-type">{n.audience || 'Notification'}</span>
                <p className="notif-message"><strong>{n.subject || 'No subject'}</strong></p>
                <p className="notif-description">{n.message || ''}</p>
                <small>
                  Priority: {n.priority || 'Normal'} | 
                  Status: {n.status || 'sent'} | 
                  Date: {formatDate(n.sentAt)}
                </small>
              </div>
              <div className="notif-actions">
                <button>View</button>
              </div>
            </div>
          ))
        ) : (
          <p className="empty-state">No notifications found</p>
        )}
      </div>

      {/* Modal */}
      {selectedNotification && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>{selectedNotification.subject || 'Notification'}</h2>
            <p><strong>Audience:</strong> {selectedNotification.audience || 'All'}</p>
            <p><strong>Priority:</strong> {selectedNotification.priority || 'Normal'}</p>
            <p><strong>Message:</strong> {selectedNotification.message || ''}</p>
            {selectedNotification.toId && (
              <p><strong>To ID:</strong> {selectedNotification.toId}</p>
            )}
            <p><strong>Status:</strong> {selectedNotification.status || 'sent'}</p>
            <p><strong>Sent At:</strong> {formatDate(selectedNotification.sentAt)}</p>
            {selectedNotification.reviewedAt && (
              <p><strong>Reviewed At:</strong> {formatDate(selectedNotification.reviewedAt)}</p>
            )}
            <div className="modal-actions">
              <button onClick={closeNotificationDetailModal}>Close</button>
              {(selectedNotification.status === 'sent' || !selectedNotification.status) && (
                <>
                  <button className="approve" onClick={() => handleAction(selectedNotification.id, 'approved')}>Approve</button>
                  <button className="reject" onClick={() => handleAction(selectedNotification.id, 'rejected')}>Reject</button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Notifications;

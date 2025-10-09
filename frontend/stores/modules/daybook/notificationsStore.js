// day-book notifications using zustand

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { getWorkspaceId } from "../../../storage/workspaceStorage";
import { apiGet, apiPut } from "../../../utils/api/apiClient";
import endpoints from "../../../utils/api/endpoints";

const useNotificationsStore = create(
  devtools(
    (set, get) => ({
      notifications: [],
      unreadCount: 0,
      selectedNotification: null,
      isLoading: false,
      error: null,
      lastUpdated: null,

      fetchNotifications: async () => {
        set(
          { isLoading: true, error: null },
          false,
          "notifications/fetchNotifications/start"
        );

        try {
          const workspaceId = await getWorkspaceId();
          const notifData = await apiGet(
            endpoints.modules.day_book.notifications.getNotifications,
            { workspaceId }
          );

          const notifications = Array.isArray(notifData) ? notifData : [];
          const unreadCount = notifications.filter((n) => !n.read).length;

          set(
            {
              notifications,
              unreadCount,
              isLoading: false,
              lastUpdated: new Date().toISOString(),
            },
            false,
            "notifications/fetchNotifications/success"
          );

          return notifications;
        } catch (error) {
          console.error(
            "[NotificationsStore] Error fetching notifications:",
            error
          );
          set(
            {
              isLoading: false,
              error: error.message || "Failed to fetch notifications",
            },
            false,
            "notifications/fetchNotifications/error"
          );
          throw error;
        }
      },

      markAsRead: async (notificationId) => {
        try {
          const workspaceId = await getWorkspaceId();
          await apiPut(
            endpoints.modules.day_book.notifications.markRead(
              workspaceId,
              notificationId
            )
          );

          set(
            (state) => {
              const updated = state.notifications.map((n) =>
                n.id === notificationId ? { ...n, read: true } : n
              );
              const unreadCount = updated.filter((n) => !n.read).length;

              return {
                notifications: updated,
                unreadCount,
              };
            },
            false,
            "notifications/markAsRead"
          );

          return true;
        } catch (error) {
          console.error(
            "[NotificationsStore] Error marking notification as read:",
            error
          );
          throw error;
        }
      },

      markAllAsRead: async () => {
        try {
          const workspaceId = await getWorkspaceId();
          await apiPut(
            endpoints.modules.day_book.notifications.markAllRead(workspaceId)
          );

          set(
            (state) => ({
              notifications: state.notifications.map((n) => ({
                ...n,
                read: true,
              })),
              unreadCount: 0,
            }),
            false,
            "notifications/markAllAsRead"
          );

          return true;
        } catch (error) {
          console.error(
            "[NotificationsStore] Error marking all as read:",
            error
          );
          throw error;
        }
      },

      selectNotification: (notification) => {
        set(
          { selectedNotification: notification },
          false,
          "notifications/selectNotification"
        );
      },

      clearNotifications: () => {
        set(
          {
            notifications: [],
            unreadCount: 0,
            selectedNotification: null,
            isLoading: false,
            error: null,
          },
          false,
          "notifications/clear"
        );
      },
    }),
    { name: "NotificationsStore" }
  )
);

export default useNotificationsStore;

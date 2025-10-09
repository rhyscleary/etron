// day-book module stores

import useDataManagementStore from "./dataManagementStore";
import useMetricsStore from "./metricsStore";
import useNotificationsStore from "./notificationsStore";
import useReportsStore from "./reportsStore";

export {
  useDataManagementStore,
  useMetricsStore,
  useNotificationsStore,
  useReportsStore,
};

export const resetDayBookModule = () => {
  useDataManagementStore.getState().clearDataManagement();
  useMetricsStore.getState().clearMetrics();
  useNotificationsStore.getState().clearNotifications();
  useReportsStore.getState().clearReports();
  console.log("[DayBook Module] All stores reset");
};

export default {
  useDataManagementStore,
  useMetricsStore,
  useNotificationsStore,
  useReportsStore,
  resetDayBookModule,
};

// module stores

import * as daybook from "./daybook";
import useLeaveStore from "./leave";

export { daybook, useLeaveStore };

export const resetAllModules = () => {
  daybook.resetDayBookModule();
  useLeaveStore.getState().clearLeave();
  console.log("[Modules] All module stores reset");
};

export default {
  daybook,
  useLeaveStore,
  resetAllModules,
};

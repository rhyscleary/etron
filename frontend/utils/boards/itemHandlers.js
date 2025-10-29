import { v4 as uuidv4 } from "uuid";
import { getFirstAvailablePosition } from "../../components/layout/Grid/gridUtils";

export const createMetricItem = (metric, existingLayout, cols = 12) => {
  const position = getFirstAvailablePosition(existingLayout, 4, 3, cols);

  return {
    id: uuidv4(),
    type: "metric",
    x: position.x,
    y: position.y,
    w: 4,
    h: 3,
    config: {
      metricId: metric.metricId,
      dataSourceId: metric.dataSourceId,
      name: metric.name,
      label: metric.name,
      chartType: metric.config?.type || "line",
      independentVariable: metric.config?.independentVariable,
      dependentVariables: metric.config?.dependentVariables || [],
      selectedRows: metric.config?.selectedRows || [],
      colours: [],
      appearance: {},
    },
  };
};

export const createButtonItem = (buttonConfig, existingLayout, cols = 12) => {
  const position = getFirstAvailablePosition(existingLayout, 2, 1, cols);

  // Handle both old format (destination object) and new format (buttonConfig)
  const label =
    buttonConfig.label || buttonConfig.destination?.label || "Button";
  const route =
    buttonConfig.destination?.route || buttonConfig.destination || null;
  const color = buttonConfig.color || "#2979FF";

  return {
    id: uuidv4(),
    type: "button",
    x: position.x,
    y: position.y,
    w: 2,
    h: 1,
    config: {
      label: label,
      destination: route,
      color: color,
    },
  };
};

export const mapItemsToLayout = (items = []) => {
  return items.map((item) => ({
    id: item.id,
    x: item.x,
    y: item.y,
    w: item.w,
    h: item.h,
  }));
};

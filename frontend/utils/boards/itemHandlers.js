import { v4 as uuidv4 } from "uuid";
import { getFirstAvailablePosition } from "../../components/layout/Grid/gridUtils";

export const calculateButtonGridWidth = (label = "", cols = 12) => {
  const textLength = label.length;

  const widthThresholds = [
    { max: 10, width: 4 },
    { max: 20, width: 5 },
    { max: 30, width: 6 },
    { max: 40, width: 7 },
    { max: 50, width: 8 },
  ];

  let width = 4;
  for (const threshold of widthThresholds) {
    if (textLength > threshold.max) {
      width = threshold.width;
    } else {
      break;
    }
  }

  if (textLength > 50) {
    width = cols;
  }

  return Math.min(width, cols);
};

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
  // Handle both old format (destination object) and new format (buttonConfig)
  const label =
    buttonConfig.label || buttonConfig.destination?.label || "Button";
  const route =
    buttonConfig.destination?.route || buttonConfig.destination || null;
  const color = buttonConfig.color || "#2979FF";

  // Calculate adaptive width based on text length
  // Rough estimate: ~8-10 characters per grid unit
  const buttonWidth = calculateButtonGridWidth(label, cols);

  const position = getFirstAvailablePosition(
    existingLayout,
    buttonWidth,
    1,
    cols
  );

  return {
    id: uuidv4(),
    type: "button",
    x: position.x,
    y: position.y,
    w: buttonWidth,
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

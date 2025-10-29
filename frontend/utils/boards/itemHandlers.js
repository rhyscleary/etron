import { v4 as uuidv4 } from "uuid";
import { getFirstAvailablePosition } from "../../components/layout/Grid/gridUtils";

const METRIC_WIDTH_RATIO = 2 / 3;
const METRIC_HEIGHT_UNITS = 2;
const TEXT_CHARACTERS_PER_UNIT = 12;
const TEXT_MIN_WIDTH_UNITS = 3;
const TEXT_MIN_HEIGHT_UNITS = 1;
const TEXT_MAX_HEIGHT_UNITS = 6;

export const calculateMetricGridWidth = (cols = 12) => {
  const minWidth = Math.ceil(cols * METRIC_WIDTH_RATIO);
  if (minWidth <= 0) return 1;
  return Math.min(minWidth, cols);
};

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

export const calculateTextGridWidth = (text = "", cols = 12) => {
  if (cols <= 0) return 1;

  const lines = typeof text === "string" ? text.split(/\r?\n/) : [""];
  const longestLineLength = lines.reduce(
    (max, line) => Math.max(max, line.trim().length),
    0
  );

  const estimatedUnits = Math.ceil(
    Math.max(longestLineLength, TEXT_CHARACTERS_PER_UNIT) /
      TEXT_CHARACTERS_PER_UNIT
  );

  return Math.min(
    cols,
    Math.max(
      TEXT_MIN_WIDTH_UNITS,
      Number.isFinite(estimatedUnits) ? estimatedUnits : TEXT_MIN_WIDTH_UNITS
    )
  );
};

export const calculateTextGridHeight = (text = "") => {
  const lineCount = Math.max(
    TEXT_MIN_HEIGHT_UNITS,
    typeof text === "string" ? text.split(/\r?\n/).length : 1
  );

  if (lineCount <= 2) return 1;
  if (lineCount <= 4) return 2;
  if (lineCount <= 6) return 3;
  return Math.min(TEXT_MAX_HEIGHT_UNITS, Math.ceil(lineCount / 2));
};

export const createMetricItem = (metric, existingLayout, cols = 12) => {
  const metricWidth = calculateMetricGridWidth(cols);
  const position = getFirstAvailablePosition(
    existingLayout,
    metricWidth,
    METRIC_HEIGHT_UNITS,
    cols
  );

  const rawConfig = metric?.config || {};
  const chartType = rawConfig.type || metric?.chartType || "line";
  const independentVariable =
    rawConfig.independentVariable ?? metric?.independentVariable;
  const dependentVariables = Array.isArray(rawConfig.dependentVariables)
    ? rawConfig.dependentVariables
    : Array.isArray(metric?.dependentVariables)
    ? metric.dependentVariables
    : [];
  const selectedRows = Array.isArray(rawConfig.selectedRows)
    ? rawConfig.selectedRows
    : Array.isArray(metric?.selectedRows)
    ? metric.selectedRows
    : [];
  const resolvedColours = Array.isArray(rawConfig.colours)
    ? rawConfig.colours
    : Array.isArray(rawConfig.colors)
    ? rawConfig.colors
    : Array.isArray(metric?.colours)
    ? metric.colours
    : Array.isArray(metric?.colors)
    ? metric.colors
    : [];
  const appearance = rawConfig.appearance || metric?.appearance || {};
  const label = rawConfig.label || metric?.label || metric?.name || "Metric";

  return {
    id: uuidv4(),
    type: "metric",
    x: position.x,
    y: position.y,
    w: metricWidth,
    h: METRIC_HEIGHT_UNITS,
    config: {
      metricId: metric.metricId,
      dataSourceId: metric.dataSourceId,
      name: metric.name,
      label,
      chartType,
      independentVariable,
      dependentVariables,
      selectedRows,
      colours: resolvedColours,
      colors: resolvedColours,
      appearance,
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
  const icon =
    buttonConfig.icon || buttonConfig.destination?.icon || "arrow-right";

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
      icon,
      buttonProps: {
        icon,
      },
    },
  };
};

export const createTextItem = (textConfig = {}, existingLayout, cols = 12) => {
  const textValue = typeof textConfig.text === "string" ? textConfig.text : "";
  const alignment = textConfig.alignment || "left";
  const fontSize = Number.isFinite(textConfig.fontSize)
    ? textConfig.fontSize
    : parseFloat(textConfig.fontSize);
  const normalizedFontSize =
    Number.isFinite(fontSize) && fontSize > 0 ? fontSize : 18;
  const lineHeightValue = Number.isFinite(textConfig.lineHeight)
    ? textConfig.lineHeight
    : parseFloat(textConfig.lineHeight);
  const normalizedLineHeight =
    Number.isFinite(lineHeightValue) && lineHeightValue > 0
      ? lineHeightValue
      : Math.round(normalizedFontSize * 1.3);
  const padding = Number.isFinite(textConfig.padding)
    ? textConfig.padding
    : parseFloat(textConfig.padding);
  const normalizedPadding =
    Number.isFinite(padding) && padding >= 0 ? padding : 16;
  const normalizedText = textValue.trim() || "New text";

  const widthUnits = calculateTextGridWidth(normalizedText, cols);
  const heightUnits = Math.min(
    TEXT_MAX_HEIGHT_UNITS,
    Math.max(TEXT_MIN_HEIGHT_UNITS, calculateTextGridHeight(normalizedText))
  );

  const position = getFirstAvailablePosition(
    existingLayout,
    widthUnits,
    heightUnits,
    cols
  );

  const minWidthUnits = Math.max(
    TEXT_MIN_WIDTH_UNITS,
    textConfig.minWidthUnits ?? TEXT_MIN_WIDTH_UNITS
  );
  const minHeightUnits = Math.max(
    TEXT_MIN_HEIGHT_UNITS,
    textConfig.minHeightUnits ?? TEXT_MIN_HEIGHT_UNITS
  );

  const maxWidthUnits = Math.max(
    minWidthUnits,
    Math.min(textConfig.maxWidthUnits ?? cols, cols)
  );
  const maxHeightUnits = Math.max(
    minHeightUnits,
    Math.min(
      textConfig.maxHeightUnits ?? TEXT_MAX_HEIGHT_UNITS,
      TEXT_MAX_HEIGHT_UNITS
    )
  );

  return {
    id: uuidv4(),
    type: "text",
    x: position.x,
    y: position.y,
    w: widthUnits,
    h: heightUnits,
    config: {
      text: normalizedText,
      alignment,
      fontSize: normalizedFontSize,
      padding: normalizedPadding,
      textColor: textConfig.textColor || "",
      backgroundColor: textConfig.backgroundColor || "",
      lineHeight: normalizedLineHeight,
      maxLines: textConfig.maxLines || undefined,
      minWidthUnits,
      minHeightUnits,
      maxWidthUnits,
      maxHeightUnits,
    },
  };
};

export const mapItemsToLayout = (items = [], cols = 12) => {
  const metricWidth = calculateMetricGridWidth(cols);

  return items.map((item) => ({
    id: item.id,
    x: item.x,
    y: item.y,
    w:
      item.type === "metric"
        ? Math.min(Math.max(item.w ?? 1, metricWidth), cols)
        : item.type === "text"
        ? Math.min(
            Math.max(
              item.w ?? TEXT_MIN_WIDTH_UNITS,
              item.config?.minWidthUnits ?? TEXT_MIN_WIDTH_UNITS
            ),
            cols
          )
        : item.w,
    h:
      item.type === "metric"
        ? Math.max(item.h ?? METRIC_HEIGHT_UNITS, METRIC_HEIGHT_UNITS)
        : item.type === "text"
        ? Math.max(
            item.h ?? TEXT_MIN_HEIGHT_UNITS,
            item.config?.minHeightUnits ?? TEXT_MIN_HEIGHT_UNITS
          )
        : item.h,
  }));
};

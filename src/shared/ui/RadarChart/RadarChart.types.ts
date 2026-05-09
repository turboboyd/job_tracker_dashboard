export interface RadarAxis<K extends string> { key: K; label: string }

export interface RadarSeries<K extends string> {
  color: string;
  key: string;
  label: string;
  values: Record<K, number>;
}

export interface RadarChartProps<K extends string> {
  axes: RadarAxis<K>[];
  levels?: number;
  maxValue?: number;
  series: RadarSeries<K>[];
  size?: number;
}

export interface RadarPoint {
  x: number;
  y: number;
}

export interface RadarAxisLine {
  from: RadarPoint;
  to: RadarPoint;
}

export interface RadarSeriesPath {
  color: string;
  d: string;
  key: string;
}

export interface RadarLabel<K extends string> extends RadarPoint {
  anchor: "start" | "middle" | "end";
  baseline: "alphabetic" | "hanging" | "middle";
  key: K;
  text: string;
}

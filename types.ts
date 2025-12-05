export interface WebSource {
  uri: string;
  title: string;
}

export interface MapSource {
  uri: string;
  title: string;
}

export interface GroundingChunk {
  web?: WebSource;
  maps?: MapSource;
}

export interface GroundingMetadata {
  groundingChunks?: GroundingChunk[];
  searchEntryPoint?: {
    renderedContent: string;
  };
}

export interface ChartDataPoint {
  label: string;
  value: number;
}

export interface ChartData {
  type: 'bar' | 'line' | 'pie';
  title: string;
  data: ChartDataPoint[];
  xLabel?: string;
  yLabel?: string;
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
  groundingMetadata?: GroundingMetadata;
  relatedQuestions?: string[];
  chartData?: ChartData;
  isError?: boolean;
  isThinking?: boolean;
}

export type SessionColor = 'violet' | 'rose' | 'amber' | 'emerald' | 'cyan' | 'slate';

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  updatedAt: Date;
  color?: SessionColor;
}

export enum AppState {
  LANDING = 'LANDING',
  CHATTING = 'CHATTING'
}

export type Language = 'en' | 'fr';

export interface LocationData {
  latitude: number;
  longitude: number;
}
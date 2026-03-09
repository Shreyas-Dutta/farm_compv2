/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ASSEMBLYAI_API_KEY?: string;
  readonly VITE_DATA_GOV_API_KEY?: string;
  readonly VITE_GOOGLE_CLOUD_VISION_API_KEY?: string;
  readonly VITE_GOOGLE_MAPS_API_KEY?: string;
  readonly VITE_NEWS_API_KEY?: string;
  readonly VITE_PLANTNET_API_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}


/**
 * TRUNG TÂM ĐIỀU KHIỂN HỆ THỐNG - SIÊU TRÍ TUỆ GIA
 */
export const APP_CONFIG = {
  BACKEND: {
    ENABLED: false, // CHUYỂN THÀNH true KHI BẠN ĐÃ CHẠY SERVER THEO BACKEND_GUIDE.md
    BASE_URL: 'http://localhost:5000/api', // Thay bằng URL thật khi deploy (vd: https://api.cua-ban.com/api)
    TIMEOUT: 5000,
  },
  AI: {
    DEFAULT_MODEL: 'gemini-3-flash-preview',
    COMPLEX_MODEL: 'gemini-3-pro-preview',
    TEMPERATURE: 0.8,
    TOP_P: 0.95,
    TOP_K: 40,
    MAX_OUTPUT_TOKENS: 4096,
    SYSTEM_INSTRUCTION: `Bạn là SIÊU KIẾN TRÚC SƯ TIỂU THUYẾT (MEGA ARCHITECT). 
Nhiệm vụ: Thiết lập hạ tầng cốt truyện logic, chặt chẽ và chấp bút những mạch văn xuất sắc.
Ngôn ngữ: Tiếng Việt.`,
  },
  STORAGE: {
    PROJECTS_KEY: 'novelist_ai_projects',
    CONTENT_PREFIX: 'novelist_ai_content_',
    SETTINGS_KEY: 'novelist_ai_settings'
  },
  PWA: {
    NAME: 'Tiểu Thuyết Gia AI - VIP PRO',
    SHORT_NAME: 'NovelistAI',
    THEME_COLOR: '#020617',
    BACKGROUND_COLOR: '#020617'
  }
};

export interface AISettings {
  model: string;
  temperature: number;
  systemInstruction: string;
}

export const getSavedSettings = (): AISettings => {
  const saved = localStorage.getItem(APP_CONFIG.STORAGE.SETTINGS_KEY);
  if (saved) return JSON.parse(saved);
  return {
    model: APP_CONFIG.AI.DEFAULT_MODEL,
    temperature: APP_CONFIG.AI.TEMPERATURE,
    systemInstruction: APP_CONFIG.AI.SYSTEM_INSTRUCTION
  };
};

export const saveSettings = (settings: AISettings) => {
  localStorage.setItem(APP_CONFIG.STORAGE.SETTINGS_KEY, JSON.stringify(settings));
};

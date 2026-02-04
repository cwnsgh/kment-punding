// 간단한 로거 유틸리티
export const logger = {
  info: (message: string, data?: any) => {
    console.log(`[INFO] ${message}`, data || "");
  },
  error: (message: string, data?: any) => {
    console.error(`[ERROR] ${message}`, data || "");
  },
  warn: (message: string, data?: any) => {
    console.warn(`[WARN] ${message}`, data || "");
  },
};

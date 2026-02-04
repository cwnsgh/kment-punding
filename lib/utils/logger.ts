/**
 * 로깅 시스템
 * 프로덕션 환경에서는 불필요한 로그를 제거하여 성능 최적화
 */

import { config } from "@/lib/config/env";

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

class Logger {
  private level: LogLevel;

  constructor() {
    // 환경변수로 로그 레벨 제어 가능 (LOG_LEVEL=INFO, WARN, ERROR, DEBUG)
    const envLogLevel = process.env.LOG_LEVEL?.toUpperCase();
    if (envLogLevel && envLogLevel in LogLevel) {
      this.level = LogLevel[envLogLevel as keyof typeof LogLevel];
    } else {
      this.level = config.app.isProduction ? LogLevel.ERROR : LogLevel.DEBUG;
    }
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.level;
  }

  private formatMessage(level: string, message: string, data?: any): string {
    const timestamp = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString();
    const prefix = `[${timestamp}] [${level}]`;

    if (data) {
      return `${prefix} ${message} ${JSON.stringify(data, null, 2)}`;
    }

    return `${prefix} ${message}`;
  }

  debug(message: string, data?: any) {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.log(this.formatMessage("DEBUG", message, data));
    }
  }

  info(message: string, data?: any) {
    if (this.shouldLog(LogLevel.INFO)) {
      console.log(this.formatMessage("INFO", message, data));
    }
  }

  warn(message: string, data?: any) {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(this.formatMessage("WARN", message, data));
    }
  }

  error(message: string, error?: any) {
    if (this.shouldLog(LogLevel.ERROR)) {
      console.error(this.formatMessage("ERROR", message, error));
    }
  }

  // 프로덕션에서도 강제로 출력하는 로그 (중요한 디버깅 정보용)
  forceLog(message: string, data?: any) {
    console.log(this.formatMessage("FORCE", message, data));
  }

  // 성능 측정용 로그
  time(label: string) {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.time(label);
    }
  }

  timeEnd(label: string) {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.timeEnd(label);
    }
  }
}

export const logger = new Logger();

import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as winston from 'winston';
import 'winston-daily-rotate-file';
import { Request } from 'express';
import { Socket } from 'socket.io';

interface LogMetadata {
  context?: string;
  [key: string]: any;
}

@Injectable()
export class LoggerService implements NestLoggerService {
  private logger: winston.Logger;
  private context?: string;

  constructor(private configService: ConfigService) {
    this.initializeLogger();
  }

  private initializeLogger() {
    const logDir = this.configService.get<string>('LOG_DIR', 'logs');
    const environment = this.configService.get<string>('NODE_ENV', 'development');

    // Define log format
    const logFormat = winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json()
    );

    // Define console format
    const consoleFormat = winston.format.combine(
      winston.format.colorize(),
      winston.format.timestamp(),
      winston.format.printf(({ timestamp, level, message, context, ...meta }) => {
        return `${timestamp} [${context || 'APP'}] ${level}: ${message} ${
          Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''
        }`;
      })
    );

    // Create the logger
    this.logger = winston.createLogger({
      level: environment === 'production' ? 'info' : 'debug',
      format: logFormat,
      defaultMeta: { service: 'flowlymeet' },
      transports: [
        // Console transport
        new winston.transports.Console({
          format: consoleFormat,
        }),
        // File transport for all logs
        new (winston.transports.DailyRotateFile)({
          filename: `${logDir}/application-%DATE%.log`,
          datePattern: 'YYYY-MM-DD',
          maxSize: '20m',
          maxFiles: '14d',
          format: logFormat,
        }),
        // File transport for errors
        new (winston.transports.DailyRotateFile)({
          filename: `${logDir}/error-%DATE%.log`,
          datePattern: 'YYYY-MM-DD',
          maxSize: '20m',
          maxFiles: '14d',
          level: 'error',
          format: logFormat,
        }),
      ],
    });
  }

  setContext(context: string) {
    this.context = context;
  }

  log(message: any, metadata?: LogMetadata) {
    this.logger.info(message, { ...metadata, context: metadata?.context || this.context });
  }

  error(message: any, trace?: string, metadata?: LogMetadata) {
    this.logger.error(message, { ...metadata, trace, context: metadata?.context || this.context });
  }

  warn(message: any, metadata?: LogMetadata) {
    this.logger.warn(message, { ...metadata, context: metadata?.context || this.context });
  }

  debug(message: any, metadata?: LogMetadata) {
    this.logger.debug(message, { ...metadata, context: metadata?.context || this.context });
  }

  verbose(message: any, metadata?: LogMetadata) {
    this.logger.verbose(message, { ...metadata, context: metadata?.context || this.context });
  }

  // HTTP Request logging
  logHttpRequest(req: Request, duration: number) {
    const metadata: LogMetadata = {
      method: req.method,
      url: req.url,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('user-agent'),
      referer: req.get('referer'),
      context: 'HTTP',
    };

    this.log(`HTTP ${req.method} ${req.url}`, metadata);
  }

  // WebSocket logging
  logWebSocketEvent(socket: Socket, event: string, data?: any) {
    const metadata: LogMetadata = {
      event,
      socketId: socket.id,
      handshake: {
        address: socket.handshake.address,
        time: socket.handshake.time,
        query: socket.handshake.query,
        headers: {
          origin: socket.handshake.headers.origin,
          userAgent: socket.handshake.headers['user-agent'],
        },
      },
      data,
      context: 'WebSocket',
    };

    this.log(`WebSocket Event: ${event}`, metadata);
  }

  // Room event logging
  logRoomEvent(roomId: string, event: string, userId: string, data?: any) {
    const metadata: LogMetadata = {
      roomId,
      event,
      userId,
      data,
      context: 'Room',
    };

    this.log(`Room Event: ${event}`, metadata);
  }

  // Error logging with stack trace
  logError(error: Error, context?: string) {
    const metadata: LogMetadata = {
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name,
      },
      context: context || this.context,
    };

    this.error('Error occurred', undefined, metadata);
  }

  // Performance logging
  logPerformance(operation: string, duration: number, context?: string) {
    const metadata: LogMetadata = {
      operation,
      duration: `${duration}ms`,
      context: context || this.context,
    };

    this.log(`Performance: ${operation}`, metadata);
  }
} 
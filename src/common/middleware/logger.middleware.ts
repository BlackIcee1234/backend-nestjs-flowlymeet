import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { LoggerService } from '../logger/logger.service';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  constructor(private readonly logger: LoggerService) {
    this.logger.setContext('HTTP');
  }

  use(req: Request, res: Response, next: NextFunction) {
    const start = Date.now();
    
    // Log request
    this.logger.logHttpRequest(req, 0);

    // Log response
    res.on('finish', () => {
      const duration = Date.now() - start;
      this.logger.logHttpRequest(req, duration);
    });

    next();
  }
} 
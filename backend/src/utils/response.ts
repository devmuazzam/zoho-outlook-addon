import { Response } from 'express';
import { ApiResponse, ErrorResponse } from '../types';

export const sendSuccess = <T>(
  res: Response, 
  data: T, 
  message?: string, 
  statusCode: number = 200
): Response => {
  const response: ApiResponse<T> = {
    success: true,
    data,
    message,
    timestamp: new Date().toISOString(),
  };
  
  return res.status(statusCode).json(response);
};

export const sendError = (
  res: Response, 
  error: string, 
  statusCode: number = 500, 
  message?: string
): Response => {
  const response: ErrorResponse = {
    error,
    message,
    statusCode,
    timestamp: new Date().toISOString(),
  };
  
  return res.status(statusCode).json(response);
};

export const validateRequired = (fields: Record<string, any>): string[] => {
  const missing: string[] = [];
  
  Object.entries(fields).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      missing.push(key);
    }
  });
  
  return missing;
};
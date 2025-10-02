import React from 'react';
import { Card, CardContent, Typography, Box, Chip } from '@mui/material';
import { CheckCircle, Error, Warning, Info } from '@mui/icons-material';

interface StatusCardProps {
  title: string;
  status: 'success' | 'error' | 'warning' | 'info';
  message: string;
  details?: string;
}

const statusConfig = {
  success: {
    color: 'success' as const,
    icon: CheckCircle,
    bgColor: 'success.light',
  },
  error: {
    color: 'error' as const,
    icon: Error,
    bgColor: 'error.light',
  },
  warning: {
    color: 'warning' as const,
    icon: Warning,
    bgColor: 'warning.light',
  },
  info: {
    color: 'info' as const,
    icon: Info,
    bgColor: 'info.light',
  },
};

export const StatusCard: React.FC<StatusCardProps> = ({
  title,
  status,
  message,
  details
}) => {
  const config = statusConfig[status];
  const IconComponent = config.icon;

  return (
    <Card sx={{ borderRadius: 2, boxShadow: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <IconComponent color={config.color} sx={{ mr: 1 }} />
          <Typography variant="h6" component="h3">
            {title}
          </Typography>
          <Box sx={{ ml: 'auto' }}>
            <Chip 
              label={status.toUpperCase()} 
              color={config.color}
              size="small"
            />
          </Box>
        </Box>
        
        <Typography variant="body1" sx={{ mb: 1 }}>
          {message}
        </Typography>
        
        {details && (
          <Typography variant="body2" color="text.secondary">
            {details}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};
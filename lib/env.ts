// Environment configuration validation for RGEnterprises Business Admin

export interface AppEnvConfig {
  backendApiUrl: string;
  apiBaseUrl: string;
  siteUrl: string;
  appName: string;
  appEnv: 'development' | 'production' | 'test';
  storeUrl?: string;
  logisticsAppUrl?: string;
}

export function getAppEnv(): AppEnvConfig {
  const isProd = process.env.NODE_ENV === 'production';
  let rawBackend = (process.env.BACKEND_API_URL || 'https://urbannest-backend-5u5q.onrender.com/api/v1').trim().replace(/\/+$/, '');
  if (!rawBackend.endsWith('/api/v1') && !rawBackend.endsWith('/api')) {
    rawBackend = `${rawBackend}/api/v1`;
  }
  const rawLogistics = process.env.NEXT_PUBLIC_LOGISTICS_APP_URL;

  // In production, do not silently fallback to localhost URLs
  let logisticsAppUrl: string | undefined = rawLogistics;
  if (isProd && rawLogistics && rawLogistics.includes('localhost')) {
    console.warn(
      '[ENV WARNING] NEXT_PUBLIC_LOGISTICS_APP_URL is pointing to localhost in production. Please configure the production Logistics Control Center URL.'
    );
  }

  return {
    backendApiUrl: rawBackend,
    apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || '/api/backend',
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
    appName: process.env.NEXT_PUBLIC_APP_NAME || 'RGEnterprises Business Admin',
    appEnv: (process.env.NODE_ENV as 'development' | 'production' | 'test') || 'development',
    storeUrl: process.env.NEXT_PUBLIC_STORE_URL,
    logisticsAppUrl,
  };
}

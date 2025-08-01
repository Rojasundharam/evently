'use client';

import { useEffect, useState } from 'react';
import { myJkknApi } from '@/lib/myjkkn-api';

export default function EnvDebug() {
  const [debugInfo, setDebugInfo] = useState<any>(null);

  useEffect(() => {
    const info = {
      envVars: {
        NEXT_PUBLIC_MYJKKN_API_KEY: process.env.NEXT_PUBLIC_MYJKKN_API_KEY,
        NEXT_PUBLIC_MYJKKN_MOCK_MODE: process.env.NEXT_PUBLIC_MYJKKN_MOCK_MODE,
        NEXT_PUBLIC_MYJKKN_PROXY_MODE: process.env.NEXT_PUBLIC_MYJKKN_PROXY_MODE,
        NEXT_PUBLIC_MYJKKN_BASE_URL: process.env.NEXT_PUBLIC_MYJKKN_BASE_URL,
      },
      apiConfig: myJkknApi.getConfigInfo(),
      isMockMode: myJkknApi.isMockMode(),
      isConfigured: myJkknApi.isConfigured(),
    };
    setDebugInfo(info);
  }, []);

  if (!debugInfo) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-black text-white p-4 rounded-lg text-xs max-w-md z-50">
      <h3 className="font-bold mb-2">🐛 Environment Debug</h3>
      
      <div className="mb-2">
        <strong>Environment Variables:</strong>
        <pre className="text-xs overflow-auto">
          {JSON.stringify(debugInfo.envVars, null, 2)}
        </pre>
      </div>
      
      <div className="mb-2">
        <strong>API Config:</strong>
        <pre className="text-xs overflow-auto">
          {JSON.stringify(debugInfo.apiConfig, null, 2)}
        </pre>
      </div>
      
      <div className="flex gap-2 text-xs">
        <span className={`px-2 py-1 rounded ${debugInfo.isMockMode ? 'bg-green-600' : 'bg-red-600'}`}>
          Mock: {debugInfo.isMockMode ? 'ON' : 'OFF'}
        </span>
        <span className={`px-2 py-1 rounded ${debugInfo.isConfigured ? 'bg-green-600' : 'bg-red-600'}`}>
          Configured: {debugInfo.isConfigured ? 'YES' : 'NO'}
        </span>
      </div>
    </div>
  );
} 
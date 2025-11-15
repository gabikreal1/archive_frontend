"use client";

import { ReactNode } from 'react';
import { useRealtimeSocket } from '@/hooks/useRealtimeSocket';

export function RealtimeProvider({ children }: { children: ReactNode }) {
  useRealtimeSocket();
  return <>{children}</>;
}

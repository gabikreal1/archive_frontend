import { ReactNode } from 'react';
import { Card } from '@/components/shared/ui';

export function ResultContainer({ children }: { children: ReactNode }) {
  return <Card className="space-y-4 p-6">{children}</Card>;
}

import { CloudOff } from 'lucide-react-native';

import { ApiError } from '@/lib/api/types';
import { EmptyState } from './empty-state';

type ErrorStateProps = {
  error: unknown;
  onRetry?: () => void;
  compact?: boolean;
};

function messageFor(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return 'SJCET Etlab did not respond. Check your connection and try again.';
}

export function ErrorState({ error, onRetry, compact = false }: ErrorStateProps) {
  return (
    <EmptyState
      actionLabel={onRetry ? 'Try again' : undefined}
      compact={compact}
      description={messageFor(error)}
      icon={CloudOff}
      onAction={onRetry}
      title="Couldn’t load"
    />
  );
}

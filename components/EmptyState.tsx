'use client';

interface EmptyStateProps {
  icon?: string;
  title: string;
  subtitle?: string;
}

export default function EmptyState({
  icon = '📋',
  title,
  subtitle,
}: EmptyStateProps) {
  return (
    <div className="text-center py-16">
      <p className="text-4xl mb-4">{icon}</p>
      <p className="text-gray-500 font-medium">{title}</p>
      {subtitle && (
        <p className="text-gray-400 text-sm mt-1">{subtitle}</p>
      )}
    </div>
  );
}

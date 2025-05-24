type StatusBannerProps = {
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
};

export function StatusBanner({ message, type }: StatusBannerProps) {
  const styles = {
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    success: 'bg-green-50 border-green-200 text-green-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    error: 'bg-red-50 border-red-200 text-red-800',
  };

  const icons = {
    info: '💡',
    success: '✅',
    warning: '⚠️',
    error: '❌',
  };

  return (
    <div className={`border rounded-lg p-4 mb-6 ${styles[type]}`}>
      <div className="flex items-center">
        <span className="text-2xl mr-3">{icons[type]}</span>
        <p className="font-medium">{message}</p>
      </div>
    </div>
  );
}
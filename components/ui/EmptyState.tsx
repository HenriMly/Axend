interface EmptyStateProps {
  icon?: string;
  title: string;
  description: string;
  buttonText: string;
  onButtonClick: () => void;
  variant?: 'default' | 'large';
}

export function EmptyState({ 
  icon = '➕', 
  title, 
  description, 
  buttonText, 
  onButtonClick,
  variant = 'default'
}: EmptyStateProps) {
  const isLarge = variant === 'large';
  
  return (
    <div className={`text-center ${isLarge ? 'py-16' : 'py-12'}`}>
      <div className={`${isLarge ? 'w-20 h-20' : 'w-16 h-16'} bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-6`}>
        <span className={`${isLarge ? 'text-3xl' : 'text-2xl'}`}>
          {icon}
        </span>
      </div>
      <h3 className={`${isLarge ? 'text-2xl' : 'text-lg'} font-semibold text-gray-900 dark:text-white mb-3`}>
        {title}
      </h3>
      <p className={`text-gray-600 dark:text-gray-400 mb-8 ${isLarge ? 'text-lg max-w-md mx-auto' : ''}`}>
        {description}
      </p>
      <button
        onClick={onButtonClick}
        className={`${isLarge ? 'px-8 py-4 text-lg' : 'px-6 py-3'} bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors shadow-lg hover:shadow-xl`}
      >
        {buttonText}
      </button>
    </div>
  );
}

interface ActionButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function ActionButton({ 
  onClick, 
  children, 
  variant = 'primary',
  size = 'md',
  className = ''
}: ActionButtonProps) {
  const variants = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    secondary: 'bg-gray-600 hover:bg-gray-700 text-white',
    success: 'bg-green-600 hover:bg-green-700 text-white',
    danger: 'bg-red-600 hover:bg-red-700 text-white'
  };

  const sizes = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-6 py-3',
    lg: 'px-8 py-4 text-lg'
  };

  return (
    <button
      onClick={onClick}
      className={`${variants[variant]} ${sizes[size]} rounded-lg font-medium transition-colors shadow-lg hover:shadow-xl ${className}`}
    >
      {children}
    </button>
  );
}

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: string;
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red';
}

export function StatCard({ title, value, subtitle, icon, color = 'blue' }: StatCardProps) {
  const colors = {
    blue: 'text-blue-600 dark:text-blue-400',
    green: 'text-green-600 dark:text-green-400',
    purple: 'text-purple-600 dark:text-purple-400',
    orange: 'text-orange-600 dark:text-orange-400',
    red: 'text-red-600 dark:text-red-400'
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
        <span className="text-2xl">{icon}</span>
      </div>
      <p className={`text-3xl font-bold ${colors[color]}`}>{value}</p>
      {subtitle && (
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{subtitle}</p>
      )}
    </div>
  );
}
import * as React from 'react';

export interface ScreenProps {
  visible?: boolean;
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

const Screen: React.FC<ScreenProps> = ({ visible = false, children, className, style }) => {
  // Simple fade in/out animation using inline styles
  const screenStyle: React.CSSProperties = {
    transition: 'opacity 0.3s, transform 0.3s',
    opacity: visible ? 1 : 0,
    transform: visible ? 'scale(1)' : 'scale(0.8)',
    display: visible ? 'block' : 'none',
    ...style,
  };

  // Combine className if provided
  const combinedClassName = className ? `rc-field-form-screen ${className}` : 'rc-field-form-screen';

  return (
    <div
      className={combinedClassName}
      style={screenStyle}
    >
      {children}
    </div>
  );
};

export default Screen;

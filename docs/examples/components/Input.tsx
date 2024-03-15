import React, { InputHTMLAttributes } from 'react';

const Input = (props: any) => {
  return <input {...props} />;
};

const CustomizeInput = ({
  value = '',
  style,
  ...props
}: { value?: string } & InputHTMLAttributes<HTMLInputElement>) => (
  <div style={{ padding: 10, ...style }}>
    <Input style={{ outline: 'none' }} value={value} {...props} />
  </div>
);

export default CustomizeInput;

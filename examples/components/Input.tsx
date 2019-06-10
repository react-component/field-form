import React from 'react';

const Input = (props: any) => {
  return <input {...props} />;
};

const CustomizeInput = (props: any) => (
  <div style={{ padding: 10 }}>
    <Input style={{ outline: 'none' }} {...props} />
  </div>
);

export default CustomizeInput;

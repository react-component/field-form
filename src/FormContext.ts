import * as React from 'react';
import { ValidateMessages } from './interface';

interface FormContextProps {
  validateMessages?: ValidateMessages;
}

const Context = React.createContext<FormContextProps>({});

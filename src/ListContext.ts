import * as React from 'react';
import type { InternalNamePath } from './interface';

export interface ListContextProps {
  getKey: (namePath: InternalNamePath) => [InternalNamePath[number], InternalNamePath];
}

const ListContext = React.createContext<ListContextProps | null>(null);

export default ListContext;

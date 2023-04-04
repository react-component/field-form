import React, { ReactNode } from 'react';

interface ToArrayOptions {
  keepEmpty?: boolean;
}

export default function toChildrenArray(
  children: ReactNode,
  option: ToArrayOptions = {},
): ReactNode[] {
  let ret: ReactNode[] = [];

  if (!option.keepEmpty) {
    children = React.Children.toArray(children).filter(
      child => child !== undefined && child !== null,
    );
  } else {
    children = React.Children.toArray(children);
  }

  ret = (children as ReactNode[]).flatMap(child => {
    if (Array.isArray(child)) {
      return toChildrenArray(child, option);
    } else if (React.isValidElement(child) && child.type === React.Fragment && child.props) {
      return toChildrenArray(child.props.children, option);
    } else {
      return child;
    }
  });

  return ret;
}

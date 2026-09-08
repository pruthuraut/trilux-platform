import React from 'react';
import clsx from 'clsx';

const headingStyles = {
  'h1': 'text-6xl font-bold',
  'h2': 'text-5xl font-bold',
  'h3': 'text-4xl font-bold',
  'h4': 'text-3xl font-bold',
  'h5': 'text-2xl font-bold',
  'h6': 'text-xl font-bold',
};

const paragraphStyles = {
  'body': 'text-base',
  'lead': 'text-lg',
  'small': 'text-sm',
};

type HeadingProps = {
  size: 1 | 2 | 3 | 4 | 5 | 6;
  children: React.ReactNode;
  className?: string;
  [key: string]: any;
};

export const Heading = ({ size, children, className, ...props }: HeadingProps) => {
  const Tag = `h${size}` as keyof JSX.IntrinsicElements;
  return (
    <Tag
      className={clsx(headingStyles[`h${size}`], className)}
      {...props}
    >
      {children}
    </Tag>
  );
};

type ParagraphVariant = 'body' | 'lead' | 'small';

export const Paragraph = ({ variant = 'body', children, className, ...props }: { variant?: ParagraphVariant, children: React.ReactNode, className?: string }) => {
  return (
    <p
      className={clsx(paragraphStyles[variant], className)}
      {...props}
    >
      {children}
    </p>
  );
};
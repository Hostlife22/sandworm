import type { ReactNode } from 'react';

export function Panel({
  title,
  number,
  children,
  className = '',
}: {
  title: string;
  number: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`panel ${className}`}>
      <h2>
        <span aria-hidden="true">›››</span>
        <span className="sr-only">{number} </span>
        {title}
      </h2>
      {children}
    </section>
  );
}

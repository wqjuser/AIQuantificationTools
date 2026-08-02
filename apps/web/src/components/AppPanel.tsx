import type { ReactNode } from "react";

export function Panel({
  title,
  subtitle,
  action,
  className,
  children
}: {
  title: string;
  subtitle: string;
  action?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={`terminal-panel ${className ?? ""}`}>
      <header>
        <div>
          <h2>{title}</h2>
          <span>{subtitle}</span>
        </div>
        {action}
      </header>
      {children}
    </section>
  );
}

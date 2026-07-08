import type { ReactNode } from "react";

interface MobileHeaderProps {
  eyebrow?: string;
  title: string;
  meta?: string;
  action?: ReactNode;
}

export function MobileHeader({ eyebrow, title, meta, action }: MobileHeaderProps) {
  return (
    <header className="mobile-header">
      <div>
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        <h1>{title}</h1>
        {meta ? <p className="header-meta">{meta}</p> : null}
      </div>
      {action ? <div className="header-action">{action}</div> : null}
    </header>
  );
}


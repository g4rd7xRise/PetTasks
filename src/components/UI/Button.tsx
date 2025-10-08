import { ReactNode } from 'react';

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  children: ReactNode;
}

export default function Button({ variant = 'primary', children, style, ...rest }: Props) {
  const base: React.CSSProperties = {
    border: '1px solid var(--control-border)',
    borderRadius: 8,
    padding: '8px 14px',
    background: 'var(--control-bg)',
    color: 'var(--control-fg)',
    cursor: 'pointer',
    transition: 'all 120ms ease',
  };

  const variants: Record<string, React.CSSProperties> = {
    primary: { background: '#3fb950', color: '#0a0a0a', borderColor: '#2da043' },
    secondary: { background: 'transparent' },
    ghost: { background: 'transparent', borderColor: 'transparent' },
  };

  return (
    <button {...rest} style={{ ...base, ...(variants[variant] || {}), ...style }}>
      {children}
    </button>
  );
}



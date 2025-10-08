import { forwardRef } from 'react';

interface Props extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
}

const Input = forwardRef<HTMLInputElement, Props>(function Input({ label, hint, style, ...rest }, ref) {
  return (
    <label style={{ display: 'block' }}>
      {label && <div style={{ fontSize: 12, marginBottom: 6, opacity: 0.85 }}>{label}</div>}
      <input
        ref={ref}
        {...rest}
        className="control"
        style={{ marginBottom: hint ? 6 : 12, ...style }}
      />
      {hint && <div style={{ fontSize: 11, opacity: 0.6, marginBottom: 8 }}>{hint}</div>}
    </label>
  );
});

export default Input;



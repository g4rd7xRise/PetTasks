import classes from "./Button.module.css";
import React, {type ButtonHTMLAttributes} from 'react';


interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  isActive?: boolean;
}

const  Button = ({ children, isActive, ...props }: ButtonProps)=>  {
  return (
    <button
      {...props}
      className={
        isActive ? `${classes.button} ${classes.active}` : classes.button
      }
    >
      {children}
    </button>
  );
}
export default Button
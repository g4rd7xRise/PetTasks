import React, { useState } from "react";

export default function useInput(defaultValue: string = "") {
  const [value, setValue] = useState<string>(defaultValue);

  return {
    value,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      setValue(e.target.value),
  };
}

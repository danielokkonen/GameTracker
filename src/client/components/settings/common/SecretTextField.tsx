import React, { useState } from "react";
import { IconButton, InputAdornment, TextField } from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";

interface SecretTextFieldProps {
  name: string;
  label: string;
  value: string;
  onChange: React.ChangeEventHandler<HTMLInputElement>;
  onBlur: React.FocusEventHandler<HTMLInputElement>;
  error?: boolean;
  helperText?: string;
  placeholder?: string;
}

const SecretTextField = ({
  name,
  label,
  value,
  onChange,
  onBlur,
  error,
  helperText,
  placeholder,
}: SecretTextFieldProps) => {
  const [revealed, setRevealed] = useState(false);

  return (
    <TextField
      name={name}
      label={label}
      type={revealed ? "text" : "password"}
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      error={error}
      helperText={helperText}
      placeholder={placeholder}
      slotProps={{
        input: {
          endAdornment: (
            <InputAdornment position="end">
              <IconButton edge="end" onClick={() => setRevealed((prev) => !prev)}>
                {revealed ? <VisibilityOffIcon /> : <VisibilityIcon />}
              </IconButton>
            </InputAdornment>
          ),
        },
      }}
    />
  );
};

export default SecretTextField;

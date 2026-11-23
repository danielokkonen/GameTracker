import React, { useEffect, useState } from "react";
import { Typography } from "@mui/material";

const EncryptionStatusText = () => {
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    window.electronApi
      .encryption.isAvailable()
      .then(setIsAvailable)
      .catch(() => setIsAvailable(false));
  }, []);

  if (isAvailable === null) {
    return null;
  }

  return (
    <Typography variant="body2" sx={{ color: isAvailable ? "success.main" : "warning.main" }}>
      {isAvailable
        ? "Credentials are encrypted at rest using your OS keychain"
        : "Encryption not available — secrets will be stored in plain text"}
    </Typography>
  );
};

export default EncryptionStatusText;

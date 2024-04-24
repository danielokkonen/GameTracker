import React, { useEffect, useState } from "react";
import { CircularProgress, Fade } from "@mui/material";

interface SpinnerProps {
  delayed?: boolean;
}

const Spinner = ({ delayed }: SpinnerProps) => {
  const [show, setShow] = useState(!delayed);

  useEffect(() => {
    setTimeout(() => {
      setShow(true);
    }, 800);
  }, []);

  return (
    <Fade in={show} style={{ transitionDelay: "800ms" }} unmountOnExit>
      <CircularProgress />
    </Fade>
  );
};

export default Spinner;

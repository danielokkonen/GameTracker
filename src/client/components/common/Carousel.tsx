import React, { useEffect, useRef } from "react";
import { Box, Button } from "@mui/material";
import { KeyboardArrowLeft, KeyboardArrowRight } from "@mui/icons-material";

interface CarouselProps {
  children: React.ReactNode;
  scrollAmount?: number;
}

const Carousel: React.FC<CarouselProps> = ({ children, scrollAmount = 220 }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const leftBtnRef = useRef<HTMLButtonElement | null>(null);
  const rightBtnRef = useRef<HTMLButtonElement | null>(null);

  const handleScroll = () => {
    if (!containerRef.current) return;
    const el = containerRef.current;
    const canScrollLeft = el.scrollLeft > 0;
    const canScrollRight = el.scrollLeft + el.clientWidth < el.scrollWidth - 1;

    if (leftBtnRef.current) leftBtnRef.current.style.display = canScrollLeft ? "flex" : "none";
    if (rightBtnRef.current) rightBtnRef.current.style.display = canScrollRight ? "flex" : "none";
  };

  const scrollLeft = () => {
    if (containerRef.current) {
      containerRef.current.scrollBy({ left: -scrollAmount, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (containerRef.current) {
      containerRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  useEffect(() => {
    const el = containerRef.current;
    if (el) {
      el.addEventListener("scroll", handleScroll);
      handleScroll();
      return () => el.removeEventListener("scroll", handleScroll);
    }
  }, []);

  return (
    <Box sx={{ position: "relative" }}>
      <Button
        ref={leftBtnRef}
        onClick={scrollLeft}
        sx={{
          position: "absolute",
          left: 0,
          top: "50%",
          transform: "translateY(-50%)",
          zIndex: 1,
          bgcolor: "rgba(0,0,0,0.6)",
          color: "white",
          minWidth: 40,
          width: 40,
          height: 40,
          borderRadius: "50%",
          display: "flex",
          "&:hover": { bgcolor: "rgba(0,0,0,0.8)" },
        }}
      >
        <KeyboardArrowLeft />
      </Button>
      <Button
        ref={rightBtnRef}
        onClick={scrollRight}
        sx={{
          position: "absolute",
          right: 0,
          top: "50%",
          transform: "translateY(-50%)",
          zIndex: 1,
          bgcolor: "rgba(0,0,0,0.6)",
          color: "white",
          minWidth: 40,
          width: 40,
          height: 40,
          borderRadius: "50%",
          display: "flex",
          "&:hover": { bgcolor: "rgba(0,0,0,0.8)" },
        }}
      >
        <KeyboardArrowRight />
      </Button>
      <Box
        ref={containerRef}
        onScroll={handleScroll}
        sx={{
          display: "flex",
          gap: 2,
          overflowX: "auto",
          pb: 2,
          "&::-webkit-scrollbar": { height: 6 },
          "&::-webkit-scrollbar-thumb": { background: "#888", borderRadius: 3 },
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default Carousel;

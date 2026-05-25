import React from "react";

export const Card = React.forwardRef(function Card({ className = "", ...props }, ref) {
  return <div ref={ref} className={className} {...props} />;
});

export const CardContent = React.forwardRef(function CardContent({ className = "", ...props }, ref) {
  return <div ref={ref} className={className} {...props} />;
});

import React from "react";

export const Button = React.forwardRef(function Button(
  { className = "", type = "button", ...props },
  ref
) {
  return <button ref={ref} type={type} className={className} {...props} />;
});

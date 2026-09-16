import { keyframes, styled } from "@mui/material/styles";

interface SpinnerProps extends React.ComponentProps<"svg"> {
  /** Icon edge size, in px. Default 14 (was `size-3.5`). */
  size?: number;
}

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const Svg = styled("svg", {
  shouldForwardProp: (prop) => prop !== "iconSize",
})<{ iconSize: number }>(({ iconSize }) => ({
  width: iconSize,
  height: iconSize,
  animation: `${spin} 1s linear infinite`,
}));

/**
 * Inline loading spinner. Pair with text or render inside a button while a
 * mutation is in flight.
 */
export function Spinner({ size = 14, className, ...rest }: SpinnerProps) {
  return (
    <Svg
      data-slot="spinner"
      role="status"
      aria-label="Loading"
      viewBox="0 0 24 24"
      fill="none"
      iconSize={size}
      className={className}
      {...rest}
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeOpacity="0.2"
        strokeWidth="3"
      />
      <path
        d="M22 12a10 10 0 0 1-10 10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </Svg>
  );
}

const PlusIcon = ({
  size = 100,
  color = "white",
}: {
  size?: number;
  color?: string;
}) => (
  <svg
    width={size}
    height={size}
    viewBox="-20 0 103 103"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="
        M 38 0 Q 45 0 45 8
        L 45 30 Q 45 38 53 38
        L 75 38 Q 83 38 83 45
        L 83 58 Q 83 65 75 65
        L 53 65 Q 45 65 45 73
        L 45 95 Q 45 103 38 103
        L 25 103 Q 18 103 18 95
        L 18 73 Q 18 65 10 65
        L -12 65 Q -20 65 -20 58
        L -20 45 Q -20 38 -12 38
        L 10 38 Q 18 38 18 30
        L 18 8 Q 18 0 25 0 Z
      "
      fill={color}
    />
  </svg>
);

export default PlusIcon;

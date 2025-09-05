interface InboundIconProps {
  width?: number | string
  height?: number | string
  className?: string
}

export default function InboundIcon({ 
  width = 24, 
  height = 24, 
  className 
}: InboundIconProps) {
  return (
    <svg 
      width={width} 
      height={height} 
      viewBox="0 0 134 134" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path 
        opacity="0.5" 
        d="M-0.00012207 90.9294L43.0708 134L55.4166 68.1611C55.7301 66.489 55.1983 64.7698 53.9953 63.5669L19.7547 29.3272C16.8241 26.3967 11.8086 27.9483 11.0449 32.0218L-0.00012207 90.9294Z" 
        fill="#7C3AED"
      />
      <path 
        d="M43.0719 134L0.00101471 90.9288L65.8392 78.5842C67.5113 78.2706 69.2303 78.8025 70.4333 80.0054L104.674 114.245C107.604 117.175 106.053 122.191 101.979 122.955L43.0719 134Z" 
        fill="#7C3AED"
      />
      <path 
        opacity="0.5" 
        d="M90.9289 0L134.001 43.0721L68.1617 55.4168C66.4896 55.7303 64.7705 55.1984 63.5676 53.9955L29.328 19.7559C26.3974 16.8253 27.9489 11.8098 32.0224 11.046L90.9289 0Z" 
        fill="#7C3AED"
      />
      <path 
        d="M78.5863 65.8407C78.2728 67.5128 78.8046 69.2319 80.0076 70.4348L114.247 104.674C117.178 107.605 122.193 106.053 122.957 101.98L134.002 43.0723L90.931 0.00140381L78.5863 65.8407Z" 
        fill="#7C3AED"
      />
    </svg>
  )
}
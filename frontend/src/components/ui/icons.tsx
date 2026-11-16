import type { ReactNode, SVGProps } from 'react'

// Paths copied from design-handoff/design/*.dc.html (24×24 stroke icons).

type IconProps = Omit<SVGProps<SVGSVGElement>, 'children'> & {
  size?: number
  strokeWidth?: number
}

function makeIcon(paths: ReactNode, defaultStroke = 2) {
  return function Icon({ size = 24, strokeWidth = defaultStroke, ...rest }: IconProps) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        {...rest}
      >
        {paths}
      </svg>
    )
  }
}

export const MinusIcon = makeIcon(<path d="M5 12h14" />, 2.5)
export const PlusIcon = makeIcon(<path d="M12 5v14M5 12h14" />, 2.5)
export const CloseIcon = makeIcon(<path d="M6 6l12 12M18 6L6 18" />, 2.5)
export const CloudUpIcon = makeIcon(
  <>
    <path d="M7 18a4.5 4.5 0 0 1-.6-9A6 6 0 0 1 18 9.5a4 4 0 0 1-.5 8.5" />
    <path d="M12 20v-7" />
    <path d="M9 15.5l3-3 3 3" />
  </>,
  2.5,
)
export const CloudOffIcon = makeIcon(
  <>
    <path d="M3 3l18 18" />
    <path d="M8.5 6.3A6 6 0 0 1 17.7 10H18a4 4 0 0 1 2.2 7.3" />
    <path d="M6 9a5 5 0 0 0 0.5 9H17" />
  </>,
)
export const SearchIcon = makeIcon(
  <>
    <circle cx="11" cy="11" r="7" />
    <path d="M20 20l-3.5-3.5" />
  </>,
)
export const DownloadIcon = makeIcon(
  <>
    <path d="M12 3v12" />
    <path d="M7 10l5 5 5-5" />
    <path d="M5 21h14" />
  </>,
)
export const HouseIcon = makeIcon(
  <>
    <path d="M3 11l9-7 9 7" />
    <path d="M5 10v10h14V10" />
    <path d="M10 20v-5h4v5" />
  </>,
)
export const CheckIcon = makeIcon(<path d="M5 12l5 5 9-10" />)

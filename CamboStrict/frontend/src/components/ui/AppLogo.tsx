import Svg, { Path, G, Defs, ClipPath, Rect } from 'react-native-svg';

interface LogoProps {
  size?: number;
  color?: string;
}

export function AppLogoMark({ size = 48, color = '#D85A30' }: LogoProps) {
  const s = size;
  return (
    <Svg width={s} height={s} viewBox="0 0 48 48">
      <Defs>
        <ClipPath id="mc">
          <Rect width="48" height="48" rx="12" />
        </ClipPath>
      </Defs>
      <G clipPath="url(#mc)">
        <Rect width="48" height="48" rx="12" fill={color} />
        <Path
          d="M11 38V18c0-1.1.7-1.8 1.5-1.5l6 3c.5.2.9.8.9 1.5v17"
          fill="#fff"
          opacity="0.9"
        />
        <Path
          d="M19 38V14c0-1.1.7-1.8 1.5-1.5l8 4c.5.2.9.8.9 1.5v20"
          fill="#fff"
          opacity="0.7"
        />
        <Path
          d="M29 38V12c0-1.1.7-1.8 1.5-1.5l6 3c.5.2.9.8.9 1.5v23"
          fill="#fff"
          opacity="0.9"
        />
      </G>
    </Svg>
  );
}

export function AppLogoWordmark({ size = 48, color = '#D85A30' }: LogoProps) {
  const s = size;
  return (
    <Svg width={s * 3.2} height={s} viewBox="0 0 154 48">
      <Defs>
        <ClipPath id="wc">
          <Rect width="48" height="48" rx="12" />
        </ClipPath>
      </Defs>
      <G clipPath="url(#wc)">
        <Rect width="48" height="48" rx="12" fill={color} />
        <Path
          d="M11 38V18c0-1.1.7-1.8 1.5-1.5l6 3c.5.2.9.8.9 1.5v17"
          fill="#fff"
          opacity="0.9"
        />
        <Path
          d="M19 38V14c0-1.1.7-1.8 1.5-1.5l8 4c.5.2.9.8.9 1.5v20"
          fill="#fff"
          opacity="0.7"
        />
        <Path
          d="M29 38V12c0-1.1.7-1.8 1.5-1.5l6 3c.5.2.9.8.9 1.5v23"
          fill="#fff"
          opacity="0.9"
        />
      </G>
      <Path
        d="M56 26V16h4v18h-4V26Zm18-10c3.3 0 6 2.7 6 6s-2.7 6-6 6-6-2.7-6-6 2.7-6 6-6Zm0 3c-1.7 0-3 1.3-3 3s1.3 3 3 3 3-1.3 3-3-1.3-3-3-3Zm13.6 9.4 3.6-11.4h4.4l-5.8 16h-4.4l-5.8-16h4.4l3.6 11.4Zm26.4-8.2c0 3.1-2 5.4-5.2 6.2l3.8 5.6h-5l-3.4-5.2h-.6V34h-4.2V14h5.2c3.6 0 5.4 1.8 5.4 5.2Zm-4.4.2c0-1.4-.7-2-2.2-2h-1v4.2h1c1.5 0 2.2-.7 2.2-2.2Z"
        fill="#F1EFE8"
      />
    </Svg>
  );
}

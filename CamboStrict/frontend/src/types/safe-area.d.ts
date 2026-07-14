declare module 'react-native-safe-area-context' {
  import { ViewProps } from 'react-native';

  interface EdgeInsets {
    top: number;
    bottom: number;
    left: number;
    right: number;
  }

  interface SafeAreaViewProps extends ViewProps {
    edges?: ('top' | 'bottom' | 'left' | 'right')[];
  }

  export class SafeAreaView extends React.Component<SafeAreaViewProps> {}
  export function useSafeAreaInsets(): EdgeInsets;
  export function SafeAreaProvider(props: { children: React.ReactNode }): JSX.Element;
}

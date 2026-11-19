import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, Pattern, RadialGradient, Rect, Stop } from 'react-native-svg';

import { colors } from './theme';

/** Comic halftone dot background with a vignette. */
export function Halftone() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width="100%" height="100%">
        <Defs>
          <Pattern id="dots" width={14} height={14} patternUnits="userSpaceOnUse" patternTransform="rotate(20)">
            <Circle cx={7} cy={7} r={2.2} fill={colors.bgDot} />
          </Pattern>
          <Pattern id="dotsBig" width={22} height={22} patternUnits="userSpaceOnUse" patternTransform="rotate(20)">
            <Circle cx={11} cy={11} r={4.5} fill={colors.bgDot} />
          </Pattern>
          <RadialGradient id="fade" cx="50%" cy="40%" r="75%">
            <Stop offset="0" stopColor={colors.bg} stopOpacity={0.95} />
            <Stop offset="0.6" stopColor={colors.bg} stopOpacity={0.6} />
            <Stop offset="1" stopColor={colors.bg} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect width="100%" height="100%" fill={colors.bg} />
        <Rect width="100%" height="100%" fill="url(#dotsBig)" />
        <Rect width="100%" height="100%" fill="url(#fade)" />
        <Rect width="100%" height="100%" fill="url(#dots)" opacity={0.5} />
      </Svg>
    </View>
  );
}

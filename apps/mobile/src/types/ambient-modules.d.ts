declare module 'react-native' {
  export const ScrollView: any;
  export const View: any;
  export const Text: any;
  export const TouchableOpacity: any;
  export const TextInput: any;
  export const StyleSheet: {
    create<T extends Record<string, any>>(styles: T): T;
    flatten<T>(style: T): T;
    hairlineWidth: number;
    absoluteFill: any;
    absoluteFillObject: any;
  };
  export const StatusBar: any;
  export const SafeAreaView: any;
  export const Image: any;
  export const Platform: {
    OS: 'ios' | 'android' | 'windows' | 'macos' | 'web';
    select<T>(specifics: { [platform in 'ios' | 'android' | 'default']?: T }): T;
  };
  export const Dimensions: any;
  export const Alert: any;
  export const Modal: any;
  export const Switch: any;
  export type StyleProp<T> = any;
  export type ViewStyle = any;
  export type TextStyle = any;
  export type ImageStyle = any;
  export const TurboModuleRegistry: any;
}

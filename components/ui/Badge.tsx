import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import Colors from '../../constants/colors';

interface BadgeProps extends React.ComponentPropsWithoutRef<typeof View> {
  variant?: 'default' | 'secondary' | 'destructive' | 'success' | 'warning' | 'outline';
  children: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

function Badge({ variant = 'default', children, style, textStyle, ...props }: BadgeProps) {
  return (
    <View style={[styles.base, styles[variant], style]} {...props}>
      {typeof children === 'string' ? (
        <Text style={[styles.text, styles[`text_${variant}`], textStyle]}>{children}</Text>
      ) : (
        children
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  default: {
    backgroundColor: Colors.primary,
  },
  secondary: {
    backgroundColor: Colors.secondary,
  },
  destructive: {
    backgroundColor: Colors.error,
  },
  success: {
    backgroundColor: Colors.success,
  },
  warning: {
    backgroundColor: Colors.warning,
  },
  outline: {
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: 'transparent',
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
  text_default: {
    color: '#FAFAFA',
  },
  text_secondary: {
    color: '#FAFAFA',
  },
  text_destructive: {
    color: '#FAFAFA',
  },
  text_success: {
    color: '#FFFFFF',
  },
  text_warning: {
    color: '#FFFFFF',
  },
  text_outline: {
    color: Colors.text,
  },
});

export { Badge };

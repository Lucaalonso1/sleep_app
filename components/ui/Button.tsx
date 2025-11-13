import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, ViewStyle, TextStyle } from 'react-native';

interface ButtonProps extends React.ComponentPropsWithoutRef<typeof TouchableOpacity> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  loading?: boolean;
  children?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const Button = React.forwardRef<React.ElementRef<typeof TouchableOpacity>, ButtonProps>(
  ({ variant = 'default', size = 'default', loading, children, style, textStyle, ...props }, ref) => {
    const buttonStyle = [
      styles.base,
      styles[variant],
      styles[`size_${size}`],
      style,
    ];

    const textStyles = [
      styles.text,
      styles[`text_${variant}`],
      textStyle,
    ];

    return (
      <TouchableOpacity
        style={buttonStyle}
        disabled={loading || props.disabled}
        ref={ref}
        {...props}
      >
        {loading ? (
          <ActivityIndicator color={variant === 'outline' || variant === 'ghost' ? '#818CF8' : '#FFF'} />
        ) : (
          typeof children === 'string' ? (
            <Text style={textStyles}>{children}</Text>
          ) : (
            children
          )
        )}
      </TouchableOpacity>
    );
  }
);

Button.displayName = 'Button';

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  default: {
    backgroundColor: '#6366F1',
  },
  secondary: {
    backgroundColor: '#8B5CF6',
  },
  destructive: {
    backgroundColor: '#EF4444',
  },
  outline: {
    borderWidth: 2,
    borderColor: '#27272A',
    backgroundColor: 'transparent',
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  size_default: {
    height: 56,
    paddingHorizontal: 24,
  },
  size_sm: {
    height: 40,
    paddingHorizontal: 16,
  },
  size_lg: {
    height: 64,
    paddingHorizontal: 32,
  },
  text: {
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 16,
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
  text_outline: {
    color: '#FAFAFA',
  },
  text_ghost: {
    color: '#FAFAFA',
  },
});

export { Button };

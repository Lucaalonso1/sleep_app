import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '../../constants/colors';

interface CardProps extends React.ComponentPropsWithoutRef<typeof View> {
  gradient?: boolean;
  gradientColors?: string[];
  style?: ViewStyle;
}

const Card = React.forwardRef<React.ElementRef<typeof View>, CardProps>(
  ({ gradient, gradientColors, children, style, ...props }, ref) => {
    if (gradient) {
      return (
        <LinearGradient
          colors={gradientColors || [Colors.card, Colors.cardLight]}
          style={[styles.card, style]}
          {...props}
        >
          {children}
        </LinearGradient>
      );
    }

    return (
      <View
        style={[styles.card, style]}
        ref={ref}
        {...props}
      >
        {children}
      </View>
    );
  }
);

Card.displayName = 'Card';

const CardHeader = React.forwardRef<
  React.ElementRef<typeof View>,
  React.ComponentPropsWithoutRef<typeof View> & { style?: ViewStyle }
>(({ style, ...props }, ref) => (
  <View style={[styles.header, style]} ref={ref} {...props} />
));
CardHeader.displayName = 'CardHeader';

const CardTitle = React.forwardRef<
  React.ElementRef<typeof Text>,
  React.ComponentPropsWithoutRef<typeof Text> & { style?: TextStyle }
>(({ style, ...props }, ref) => (
  <Text
    style={[styles.title, style]}
    ref={ref}
    {...props}
  />
));
CardTitle.displayName = 'CardTitle';

const CardDescription = React.forwardRef<
  React.ElementRef<typeof Text>,
  React.ComponentPropsWithoutRef<typeof Text> & { style?: TextStyle }
>(({ style, ...props }, ref) => (
  <Text style={[styles.description, style]} ref={ref} {...props} />
));
CardDescription.displayName = 'CardDescription';

const CardContent = React.forwardRef<
  React.ElementRef<typeof View>,
  React.ComponentPropsWithoutRef<typeof View> & { style?: ViewStyle }
>(({ style, ...props }, ref) => (
  <View style={[styles.content, style]} ref={ref} {...props} />
));
CardContent.displayName = 'CardContent';

const CardFooter = React.forwardRef<
  React.ElementRef<typeof View>,
  React.ComponentPropsWithoutRef<typeof View> & { style?: ViewStyle }
>(({ style, ...props }, ref) => (
  <View style={[styles.footer, style]} ref={ref} {...props} />
));
CardFooter.displayName = 'CardFooter';

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'column',
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  content: {
    padding: 24,
    paddingTop: 0,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 24,
    paddingTop: 0,
  },
});

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };

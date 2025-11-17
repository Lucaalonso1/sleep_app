import React, { useState } from 'react';
import { View, Text, StyleSheet, PanResponder, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Line, G, Text as SvgText } from 'react-native-svg';
import Colors from '../constants/colors';

interface WheelTimePickerProps {
  value: Date;
  onChange: (date: Date) => void;
  compact?: boolean;
}

export default function WheelTimePicker({ value, onChange, compact = false }: WheelTimePickerProps) {
  const [selectedHour, setSelectedHour] = useState(value.getHours());
  const [selectedMinute, setSelectedMinute] = useState(value.getMinutes());
  const [mode, setMode] = useState<'hour' | 'minute'>('hour');
  
  const clockSize = compact ? 220 : 260;
  const centerX = clockSize / 2;
  const centerY = clockSize / 2;
  const radius = clockSize / 2 - 40;

  const calculateAngle = (x: number, y: number) => {
    const dx = x - centerX;
    const dy = y - centerY;
    let angle = Math.atan2(dy, dx) * (180 / Math.PI);
    angle = (angle + 90 + 360) % 360;
    return angle;
  };

  const handleTouch = (x: number, y: number) => {
    const angle = calculateAngle(x, y);
    
    if (mode === 'hour') {
      const hour = Math.round((angle / 360) * 24) % 24;
      setSelectedHour(hour);
      const newDate = new Date(value);
      newDate.setHours(hour);
      onChange(newDate);
    } else {
      const minute = Math.round((angle / 360) * 60) % 60;
      setSelectedMinute(minute);
      const newDate = new Date(value);
      newDate.setMinutes(minute);
      onChange(newDate);
    }
  };

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (evt) => {
      const { locationX, locationY } = evt.nativeEvent;
      handleTouch(locationX, locationY);
    },
    onPanResponderMove: (evt) => {
      const { locationX, locationY } = evt.nativeEvent;
      handleTouch(locationX, locationY);
    },
  });

  const renderNumbers = () => {
    const numbers = mode === 'hour' ? 24 : 12;
    const step = mode === 'hour' ? 1 : 5;
    const items = [];

    for (let i = 0; i < numbers; i++) {
      const value = mode === 'hour' ? i : i * step;
      const angle = (360 / numbers) * i - 90;
      const rad = (angle * Math.PI) / 180;
      const x = centerX + radius * Math.cos(rad);
      const y = centerY + radius * Math.sin(rad);
      
      const isSelected = mode === 'hour' ? i === selectedHour : value === selectedMinute;
      
      items.push(
        <SvgText
          key={i}
          x={x}
          y={y}
          fontSize={isSelected ? 18 : 14}
          fontWeight={isSelected ? '700' : '400'}
          fill={isSelected ? Colors.primaryLight : Colors.textSecondary}
          textAnchor="middle"
          alignmentBaseline="middle"
        >
          {value.toString().padStart(2, '0')}
        </SvgText>
      );
    }
    return items;
  };

  const getHandAngle = () => {
    if (mode === 'hour') {
      return (selectedHour / 24) * 360 - 90;
    } else {
      return (selectedMinute / 60) * 360 - 90;
    }
  };

  const angle = getHandAngle();
  const rad = (angle * Math.PI) / 180;
  const handLength = radius - 20;
  const handX = centerX + handLength * Math.cos(rad);
  const handY = centerY + handLength * Math.sin(rad);

  return (
    <View style={styles.container}>
      {/* Mode Toggle */}
      <View style={styles.modeToggle}>
        <View style={styles.timeDisplay}>
          <Text 
            style={[styles.timeText, mode === 'hour' && styles.timeTextActive]}
            onPress={() => setMode('hour')}
          >
            {selectedHour.toString().padStart(2, '0')}
          </Text>
          <Text style={styles.timeSeparator}>:</Text>
          <Text 
            style={[styles.timeText, mode === 'minute' && styles.timeTextActive]}
            onPress={() => setMode('minute')}
          >
            {selectedMinute.toString().padStart(2, '0')}
          </Text>
        </View>
        <Text style={styles.modeLabel}>
          {mode === 'hour' ? 'Selecciona la hora' : 'Selecciona los minutos'}
        </Text>
      </View>

      {/* Clock Face */}
      <View style={styles.clockContainer} {...panResponder.panHandlers}>
        <LinearGradient
          colors={[Colors.primary + '10', Colors.secondary + '10']}
          style={styles.clockGradient}
        >
          <Svg width={clockSize} height={clockSize}>
            {/* Clock circle */}
            <Circle
              cx={centerX}
              cy={centerY}
              r={radius}
              stroke={Colors.border}
              strokeWidth={2}
              fill="transparent"
            />
            
            {/* Center dot */}
            <Circle
              cx={centerX}
              cy={centerY}
              r={8}
              fill={Colors.primaryLight}
            />

            {/* Numbers */}
            {renderNumbers()}

            {/* Hand */}
            <Line
              x1={centerX}
              y1={centerY}
              x2={handX}
              y2={handY}
              stroke={Colors.primaryLight}
              strokeWidth={3}
              strokeLinecap="round"
            />

            {/* Hand tip */}
            <Circle
              cx={handX}
              cy={handY}
              r={12}
              fill={Colors.primaryLight}
            />
          </Svg>
        </LinearGradient>
      </View>

      {/* Instructions */}
      <Text style={styles.instructions}>
        Arrastra o toca en el reloj
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  modeToggle: {
    alignItems: 'center',
    marginBottom: 24,
  },
  timeDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  timeText: {
    fontSize: 48,
    fontWeight: '700',
    color: Colors.textSecondary,
    opacity: 0.5,
  },
  timeTextActive: {
    color: Colors.primaryLight,
    opacity: 1,
  },
  timeSeparator: {
    fontSize: 48,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginHorizontal: 8,
  },
  modeLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  clockContainer: {
    borderRadius: 1000,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  clockGradient: {
    padding: 16,
    borderRadius: 1000,
  },
  instructions: {
    marginTop: 16,
    fontSize: 13,
    color: Colors.textTertiary,
    fontStyle: 'italic',
  },
});


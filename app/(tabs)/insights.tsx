import { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Pressable,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { TrendingUp, Award, Moon, Sun, Brain, Zap, Sparkles, BarChart3 } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSleep } from '../../contexts/SleepContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import Colors from '../../constants/colors';
import { formatDuration } from '../../lib/utils';

const { width } = Dimensions.get('window');

export default function InsightsScreen() {
  const insets = useSafeAreaInsets();
  const { sessions, isLoading } = useSleep();
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'all'>('week');

  const stats = useMemo(() => {
    let filteredSessions = sessions.filter(s => s.duration);
    
    if (timeRange === 'week') {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      filteredSessions = filteredSessions.filter(s => s.startTime >= weekAgo);
    } else if (timeRange === 'month') {
      const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      filteredSessions = filteredSessions.filter(s => s.startTime >= monthAgo);
    }

    if (filteredSessions.length === 0) {
      return {
        averageDuration: 0,
        averageQuality: 0,
        totalSessions: 0,
        bestStreak: 0,
        totalRecordings: 0,
        avgSleepTime: '',
        avgWakeTime: '',
      };
    }

    const totalDuration = filteredSessions.reduce((sum, s) => sum + (s.duration || 0), 0);
    const totalQuality = filteredSessions.reduce((sum, s) => sum + (s.sleepQuality || 70), 0);
    const totalRecordings = filteredSessions.reduce((sum, s) => sum + s.audioRecordings.length, 0);

    const sleepTimes = filteredSessions.map(s => s.startTime.getHours() + s.startTime.getMinutes() / 60);
    const avgSleepHour = sleepTimes.reduce((a, b) => a + b, 0) / sleepTimes.length;
    const avgSleepTimeFormatted = `${Math.floor(avgSleepHour)}:${String(Math.round((avgSleepHour % 1) * 60)).padStart(2, '0')}`;

    const wakeTimes = filteredSessions
      .filter(s => s.endTime)
      .map(s => s.endTime!.getHours() + s.endTime!.getMinutes() / 60);
    const avgWakeHour = wakeTimes.length > 0 
      ? wakeTimes.reduce((a, b) => a + b, 0) / wakeTimes.length 
      : 0;
    const avgWakeTimeFormatted = wakeTimes.length > 0
      ? `${Math.floor(avgWakeHour)}:${String(Math.round((avgWakeHour % 1) * 60)).padStart(2, '0')}`
      : 'N/A';

    let currentStreak = 0;
    let bestStreak = 0;
    const sortedSessions = [...sessions].sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
    
    for (let i = 0; i < sortedSessions.length; i++) {
      if (!sortedSessions[i].duration) continue;
      currentStreak++;
      if (i < sortedSessions.length - 1) {
        const daysDiff = Math.abs(sortedSessions[i].startTime.getTime() - sortedSessions[i + 1].startTime.getTime()) / (1000 * 60 * 60 * 24);
        if (daysDiff > 2) {
          bestStreak = Math.max(bestStreak, currentStreak);
          currentStreak = 0;
        }
      }
    }
    bestStreak = Math.max(bestStreak, currentStreak);

    return {
      averageDuration: totalDuration / filteredSessions.length,
      averageQuality: totalQuality / filteredSessions.length,
      totalSessions: filteredSessions.length,
      bestStreak,
      totalRecordings,
      avgSleepTime: avgSleepTimeFormatted,
      avgWakeTime: avgWakeTimeFormatted,
    };
  }, [sessions, timeRange]);

  const chartData = useMemo(() => {
    let filteredSessions = sessions.filter(s => s.duration);
    
    if (timeRange === 'week') {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      filteredSessions = filteredSessions.filter(s => s.startTime >= weekAgo);
    } else if (timeRange === 'month') {
      const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      filteredSessions = filteredSessions.filter(s => s.startTime >= monthAgo);
    }

    return filteredSessions.slice(0, 7).reverse();
  }, [sessions, timeRange]);

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (sessions.length === 0) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={[Colors.background, Colors.backgroundSecondary]}
          style={styles.gradient}
        >
          <View style={[styles.emptyState, { paddingTop: insets.top }]}>
            <TrendingUp size={64} color={Colors.textTertiary} strokeWidth={1.5} />
            <Text style={styles.emptyTitle}>
              Sin datos aún
            </Text>
            <Text style={styles.emptySubtitle}>
              Comienza a rastrear tu sueño para ver estadísticas y tendencias
            </Text>
          </View>
        </LinearGradient>
      </View>
    );
  }

  const maxDuration = Math.max(...chartData.map(s => s.duration || 0), 28800);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.background, Colors.backgroundSecondary]}
        style={styles.gradient}
      >
        <ScrollView
          contentContainerStyle={{ 
            paddingTop: insets.top + 16, 
            paddingHorizontal: 20, 
            paddingBottom: 40 
          }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <Sparkles size={28} color={Colors.accent} strokeWidth={2} />
              <Text style={styles.headerTitle}>Análisis</Text>
            </View>
            <Text style={styles.headerSubtitle}>
              Rastrea tu progreso y patrones
            </Text>
          </View>

          {/* Time Range Selector */}
          <View style={styles.timeRangeContainer}>
            {(['week', 'month', 'all'] as const).map((range) => (
              <Pressable
                key={range}
                onPress={() => setTimeRange(range)}
                style={[
                  styles.timeRangeButton,
                  timeRange === range && styles.timeRangeButtonActive
                ]}
              >
                <Text style={[
                  styles.timeRangeText,
                  timeRange === range && styles.timeRangeTextActive
                ]}>
                  {range === 'week' ? '7 Días' : range === 'month' ? '30 Días' : 'Todo'}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Stats Grid */}
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { width: (width - 52) / 2 }]}>
              <LinearGradient
                colors={[Colors.primary, Colors.primaryDark]}
                style={styles.statCardGradient}
              >
                <Moon size={28} color="#FFF" strokeWidth={2} />
                <Text style={styles.statValue}>
                  {stats.totalSessions}
                </Text>
                <Text style={styles.statLabel}>
                  Sesiones
                </Text>
              </LinearGradient>
            </View>

            <View style={[styles.statCard, { width: (width - 52) / 2 }]}>
              <LinearGradient
                colors={[Colors.accent, Colors.accentDark]}
                style={styles.statCardGradient}
              >
                <Award size={28} color="#FFF" strokeWidth={2} />
                <Text style={styles.statValue}>
                  {Math.round(stats.averageQuality)}
                </Text>
                <Text style={styles.statLabel}>
                  Calidad promedio
                </Text>
              </LinearGradient>
            </View>

            <View style={[styles.statCard, { width: (width - 52) / 2 }]}>
              <LinearGradient
                colors={[Colors.secondary, Colors.secondaryDark]}
                style={styles.statCardGradient}
              >
                <Zap size={28} color="#FFF" strokeWidth={2} />
                <Text style={styles.statValue}>
                  {stats.bestStreak}
                </Text>
                <Text style={styles.statLabel}>
                  Mejor racha
                </Text>
              </LinearGradient>
            </View>

            <View style={[styles.statCard, { width: (width - 52) / 2 }]}>
              <LinearGradient
                colors={[Colors.success, Colors.successDark]}
                style={styles.statCardGradient}
              >
                <Sun size={28} color="#FFF" strokeWidth={2} />
                <Text style={styles.statValue}>
                  {formatDuration(stats.averageDuration)}
                </Text>
                <Text style={styles.statLabel}>
                  Promedio
                </Text>
              </LinearGradient>
            </View>
          </View>

          {/* Chart Card */}
          <Card>
            <CardHeader>
              <View style={styles.chartHeader}>
                <BarChart3 size={20} color={Colors.primaryLight} />
                <CardTitle style={styles.chartTitle}>Tendencia de duración</CardTitle>
              </View>
            </CardHeader>
            <CardContent style={styles.chartContent}>
              {chartData.length > 0 ? (
                <View style={styles.chartContainer}>
                  {chartData.map((session, index) => {
                    const barHeight = ((session.duration || 0) / maxDuration) * 150;
                    const quality = session.sleepQuality || 70;
                    const barColor = quality >= 80 
                      ? Colors.success 
                      : quality >= 60 
                      ? Colors.accent 
                      : Colors.error;
                    
                    return (
                      <View key={session.id} style={styles.barContainer}>
                        <View 
                          style={[
                            styles.bar,
                            { 
                              height: Math.max(barHeight, 20), 
                              backgroundColor: barColor 
                            }
                          ]}
                        >
                          <Text style={styles.barValue}>
                            {formatDuration(session.duration || 0).split(' ')[0]}
                          </Text>
                        </View>
                        <Text style={styles.barLabel}>
                          {session.startTime.toLocaleDateString([], { 
                            month: 'short', 
                            day: 'numeric' 
                          }).split(' ')[1]}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              ) : (
                <Text style={styles.emptyChartText}>
                  No hay suficientes datos para mostrar el gráfico
                </Text>
              )}
            </CardContent>
          </Card>

          {/* Details Card */}
          <Card>
            <CardHeader>
              <CardTitle style={styles.patternsTitle}>Patrones de sueño</CardTitle>
            </CardHeader>
            <CardContent style={styles.patternsContent}>
              <View style={styles.patternsList}>
                <View style={styles.patternItem}>
                  <Text style={styles.patternLabel}>
                    Hora promedio de dormir
                  </Text>
                  <Text style={styles.patternValue}>
                    {stats.avgSleepTime}
                  </Text>
                </View>
                
                <View style={styles.patternDivider} />
                
                <View style={styles.patternItem}>
                  <Text style={styles.patternLabel}>
                    Hora promedio de despertar
                  </Text>
                  <Text style={styles.patternValue}>
                    {stats.avgWakeTime}
                  </Text>
                </View>
                
                <View style={styles.patternDivider} />
                
                <View style={styles.patternItem}>
                  <Text style={styles.patternLabel}>
                    Total de grabaciones
                  </Text>
                  <Text style={styles.patternValue}>
                    {stats.totalRecordings}
                  </Text>
                </View>
                
                <View style={styles.patternDivider} />
                
                <View style={styles.patternItem}>
                  <Text style={styles.patternLabel}>
                    Puntuación de calidad
                  </Text>
                  <Badge 
                    variant={
                      stats.averageQuality >= 80 
                        ? 'success' 
                        : stats.averageQuality >= 60 
                        ? 'warning' 
                        : 'destructive'
                    }
                  >
                    <Text style={styles.badgeText}>
                      {stats.averageQuality >= 80 
                        ? 'Excelente' 
                        : stats.averageQuality >= 60 
                        ? 'Bueno' 
                        : 'Regular'}
                    </Text>
                  </Badge>
                </View>
              </View>
            </CardContent>
          </Card>
        </ScrollView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centerContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradient: {
    flex: 1,
  },
  // Empty State
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.textTertiary,
    textAlign: 'center',
    lineHeight: 20,
  },
  // Header
  header: {
    marginBottom: 24,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.text,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  // Time Range Selector
  timeRangeContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
    padding: 4,
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  timeRangeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeRangeButtonActive: {
    backgroundColor: Colors.primary,
  },
  timeRangeText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textTertiary,
  },
  timeRangeTextActive: {
    color: Colors.text,
  },
  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  statCardGradient: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 140,
  },
  statValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFF',
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  // Chart
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  chartContent: {
    paddingTop: 20,
  },
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 8,
    paddingBottom: 8,
  },
  barContainer: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  bar: {
    width: '100%',
    borderRadius: 8,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingVertical: 6,
    minHeight: 20,
  },
  barValue: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFF',
  },
  barLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.textTertiary,
  },
  emptyChartText: {
    fontSize: 14,
    color: Colors.textTertiary,
    textAlign: 'center',
    paddingVertical: 40,
  },
  // Patterns
  patternsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  patternsContent: {
    paddingTop: 8,
  },
  patternsList: {
    gap: 0,
  },
  patternItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },
  patternLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  patternValue: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  patternDivider: {
    height: 1,
    backgroundColor: Colors.border,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
});

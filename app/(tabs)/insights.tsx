import { useState, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { TrendingUp, Award, Moon, Sun, Brain, Zap } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSleep } from '../../contexts/SleepContext';
import Colors from '../../constants/colors';

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

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
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
            <Text style={styles.emptyTitle}>No Data Yet</Text>
            <Text style={styles.emptySubtitle}>
              Start tracking your sleep to see insights and trends
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
          contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 10 }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Sleep Insights</Text>
            <Text style={styles.subtitle}>Track your progress and patterns</Text>
          </View>

          <View style={styles.timeRangeSelector}>
            {(['week', 'month', 'all'] as const).map((range) => (
              <TouchableOpacity
                key={range}
                style={[
                  styles.rangeButton,
                  timeRange === range && styles.rangeButtonActive,
                ]}
                onPress={() => setTimeRange(range)}
              >
                <Text
                  style={[
                    styles.rangeButtonText,
                    timeRange === range && styles.rangeButtonTextActive,
                  ]}
                >
                  {range === 'week' ? '7 Days' : range === 'month' ? '30 Days' : 'All Time'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <LinearGradient
                colors={[Colors.primary, Colors.secondary]}
                style={styles.statGradient}
              >
                <Moon size={24} color="#FFF" />
                <Text style={styles.statValue}>{stats.totalSessions}</Text>
                <Text style={styles.statLabel}>Sleep Sessions</Text>
              </LinearGradient>
            </View>

            <View style={styles.statCard}>
              <LinearGradient
                colors={[Colors.accent, '#F59E0B']}
                style={styles.statGradient}
              >
                <Award size={24} color="#FFF" />
                <Text style={styles.statValue}>{Math.round(stats.averageQuality)}</Text>
                <Text style={styles.statLabel}>Avg Quality</Text>
              </LinearGradient>
            </View>

            <View style={styles.statCard}>
              <LinearGradient
                colors={['#8B5CF6', '#6366F1']}
                style={styles.statGradient}
              >
                <Zap size={24} color="#FFF" />
                <Text style={styles.statValue}>{stats.bestStreak}</Text>
                <Text style={styles.statLabel}>Best Streak</Text>
              </LinearGradient>
            </View>

            <View style={styles.statCard}>
              <LinearGradient
                colors={['#10B981', '#059669']}
                style={styles.statGradient}
              >
                <Sun size={24} color="#FFF" />
                <Text style={styles.statValue}>{formatDuration(stats.averageDuration)}</Text>
                <Text style={styles.statLabel}>Avg Sleep</Text>
              </LinearGradient>
            </View>
          </View>

          <View style={styles.chartCard}>
            <LinearGradient
              colors={[Colors.card, Colors.cardLight]}
              style={styles.chartGradient}
            >
              <View style={styles.chartHeader}>
                <Brain size={20} color={Colors.primaryLight} />
                <Text style={styles.chartTitle}>Sleep Duration Trend</Text>
              </View>
              
              {chartData.length > 0 ? (
                <View style={styles.chart}>
                  {chartData.map((session, index) => {
                    const barHeight = ((session.duration || 0) / maxDuration) * 150;
                    const quality = session.sleepQuality || 70;
                    const barColor = quality >= 80 ? '#10B981' : quality >= 60 ? Colors.accent : '#EF4444';
                    
                    return (
                      <View key={session.id} style={styles.barContainer}>
                        <View style={[styles.bar, { height: barHeight, backgroundColor: barColor }]}>
                          <Text style={styles.barLabel}>{formatDuration(session.duration || 0).split(' ')[0]}</Text>
                        </View>
                        <Text style={styles.barDate}>
                          {session.startTime.toLocaleDateString([], { month: 'short', day: 'numeric' }).split(' ')[1]}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              ) : (
                <Text style={styles.noDataText}>Not enough data to display chart</Text>
              )}
            </LinearGradient>
          </View>

          <View style={styles.detailsCard}>
            <LinearGradient
              colors={[Colors.card, Colors.cardLight]}
              style={styles.detailsGradient}
            >
              <Text style={styles.detailsTitle}>Sleep Patterns</Text>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Average Bedtime</Text>
                <Text style={styles.detailValue}>{stats.avgSleepTime}</Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Average Wake Time</Text>
                <Text style={styles.detailValue}>{stats.avgWakeTime}</Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Total Recordings</Text>
                <Text style={styles.detailValue}>{stats.totalRecordings}</Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Quality Score</Text>
                <View style={styles.qualityBadge}>
                  <Text style={styles.qualityText}>
                    {stats.averageQuality >= 80 ? 'Excellent' : stats.averageQuality >= 60 ? 'Good' : 'Fair'}
                  </Text>
                </View>
              </View>
            </LinearGradient>
          </View>
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
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradient: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  timeRangeSelector: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  rangeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: Colors.card,
    alignItems: 'center',
  },
  rangeButtonActive: {
    backgroundColor: Colors.primary,
  },
  rangeButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  rangeButtonTextActive: {
    color: '#FFF',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    width: (width - 52) / 2,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  statGradient: {
    padding: 20,
    alignItems: 'center',
    gap: 8,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: '#FFF',
  },
  statLabel: {
    fontSize: 12,
    color: '#FFF',
    opacity: 0.9,
    fontWeight: '600' as const,
  },
  chartCard: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  chartGradient: {
    padding: 20,
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  chart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 180,
    paddingTop: 20,
  },
  barContainer: {
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  bar: {
    width: 32,
    borderRadius: 8,
    minHeight: 20,
    justifyContent: 'flex-start',
    paddingTop: 4,
  },
  barLabel: {
    fontSize: 9,
    fontWeight: '600' as const,
    color: '#FFF',
    textAlign: 'center',
  },
  barDate: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
  },
  noDataText: {
    textAlign: 'center',
    color: Colors.textSecondary,
    fontSize: 14,
    paddingVertical: 40,
  },
  detailsCard: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  detailsGradient: {
    padding: 20,
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  detailLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  qualityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: Colors.primary,
    borderRadius: 12,
  },
  qualityText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#FFF',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.text,
    marginTop: 20,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});

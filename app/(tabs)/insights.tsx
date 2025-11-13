import { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Pressable,
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
      <View >
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (sessions.length === 0) {
    return (
      <View >
        <LinearGradient
          colors={[Colors.background, Colors.backgroundSecondary]}
          
        >
          <View  style={{ paddingTop: insets.top }}>
            <TrendingUp size={64} color={Colors.textTertiary} strokeWidth={1.5} />
            <Text >
              Sin datos aún
            </Text>
            <Text >
              Comienza a rastrear tu sueño para ver estadísticas y tendencias
            </Text>
          </View>
        </LinearGradient>
      </View>
    );
  }

  const maxDuration = Math.max(...chartData.map(s => s.duration || 0), 28800);

  return (
    <View >
      <LinearGradient
        colors={[Colors.background, Colors.backgroundSecondary]}
        
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
          <View >
            <View >
              <Sparkles size={24} color={Colors.accent} />
              <Text >Análisis de sueño</Text>
            </View>
            <Text >
              Rastrea tu progreso y patrones
            </Text>
          </View>

          {/* Time Range Selector */}
          <View >
            {(['week', 'month', 'all'] as const).map((range) => (
              <Pressable
                key={range}
                onPress={() => setTimeRange(range)}
                className={`flex-1 py-3 px-4 rounded-2xl ${
                  timeRange === range ? 'bg-primary' : 'bg-card'
                }`}
              >
                <Text className={`text-sm font-bold text-center ${
                  timeRange === range ? 'text-white' : 'text-muted-foreground'
                }`}>
                  {range === 'week' ? '7 Días' : range === 'month' ? '30 Días' : 'Todo'}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Stats Grid */}
          <View >
            <View 
              
              style={{ width: (width - 52) / 2 }}
            >
              <LinearGradient
                colors={[Colors.primary, Colors.primaryDark]}
                
              >
                <Moon size={28} color="#FFF" />
                <Text >
                  {stats.totalSessions}
                </Text>
                <Text >
                  Sesiones
                </Text>
              </LinearGradient>
            </View>

            <View 
              
              style={{ width: (width - 52) / 2 }}
            >
              <LinearGradient
                colors={[Colors.accent, Colors.accentDark]}
                
              >
                <Award size={28} color="#FFF" />
                <Text >
                  {Math.round(stats.averageQuality)}
                </Text>
                <Text >
                  Calidad promedio
                </Text>
              </LinearGradient>
            </View>

            <View 
              
              style={{ width: (width - 52) / 2 }}
            >
              <LinearGradient
                colors={['#8B5CF6', '#7C3AED']}
                
              >
                <Zap size={28} color="#FFF" />
                <Text >
                  {stats.bestStreak}
                </Text>
                <Text >
                  Mejor racha
                </Text>
              </LinearGradient>
            </View>

            <View 
              
              style={{ width: (width - 52) / 2 }}
            >
              <LinearGradient
                colors={[Colors.success, Colors.successDark]}
                
              >
                <Sun size={28} color="#FFF" />
                <Text >
                  {formatDuration(stats.averageDuration)}
                </Text>
                <Text >
                  Promedio
                </Text>
              </LinearGradient>
            </View>
          </View>

          {/* Chart Card */}
          <Card >
            <CardHeader>
              <View >
                <BarChart3 size={20} color={Colors.primaryLight} />
                <CardTitle >Tendencia de duración</CardTitle>
              </View>
            </CardHeader>
            <CardContent>
              {chartData.length > 0 ? (
                <View >
                  {chartData.map((session, index) => {
                    const barHeight = ((session.duration || 0) / maxDuration) * 150;
                    const quality = session.sleepQuality || 70;
                    const barColor = quality >= 80 
                      ? Colors.success 
                      : quality >= 60 
                      ? Colors.accent 
                      : Colors.error;
                    
                    return (
                      <View key={session.id} >
                        <View 
                          
                          style={{ 
                            height: Math.max(barHeight, 20), 
                            backgroundColor: barColor 
                          }}
                        >
                          <Text >
                            {formatDuration(session.duration || 0).split(' ')[0]}
                          </Text>
                        </View>
                        <Text >
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
                <Text >
                  No hay suficientes datos para mostrar el gráfico
                </Text>
              )}
            </CardContent>
          </Card>

          {/* Details Card */}
          <Card>
            <CardHeader>
              <CardTitle >Patrones de sueño</CardTitle>
            </CardHeader>
            <CardContent>
              <View >
                <View >
                  <Text >
                    Hora promedio de dormir
                  </Text>
                  <Text >
                    {stats.avgSleepTime}
                  </Text>
                </View>
                
                <View >
                  <Text >
                    Hora promedio de despertar
                  </Text>
                  <Text >
                    {stats.avgWakeTime}
                  </Text>
                </View>
                
                <View >
                  <Text >
                    Total de grabaciones
                  </Text>
                  <Text >
                    {stats.totalRecordings}
                  </Text>
                </View>
                
                <View >
                  <Text >
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
                    <Text >
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

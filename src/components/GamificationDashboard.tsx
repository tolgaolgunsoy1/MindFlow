// src/components/GamificationDashboard.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ProgressBarAndroid,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import GamificationService, {
  UserStats,
  Achievement,
  DailyChallenge,
  LeaderboardEntry
} from '../services/gamificationService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface GamificationDashboardProps {
  visible: boolean;
  onClose: () => void;
  userId?: string;
}

const GamificationDashboard: React.FC<GamificationDashboardProps> = ({
  visible,
  onClose,
  userId = 'current_user'
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'achievements' | 'challenges' | 'leaderboard'>('overview');
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [dailyChallenges, setDailyChallenges] = useState<DailyChallenge[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    if (visible) {
      loadData();
    }
  }, [visible, userId]);

  const loadData = () => {
    const stats = GamificationService.getUserStats(userId);
    const allAchievements = GamificationService.getAllAchievements();
    const challenges = GamificationService.getDailyChallenges();
    const board = GamificationService.getLeaderboard();

    setUserStats(stats);
    setAchievements(allAchievements);
    setDailyChallenges(challenges);
    setLeaderboard(board);
  };

  const getRarityColor = (rarity: Achievement['rarity']): string => {
    const colors = {
      common: '#9E9E9E',
      rare: '#2196F3',
      epic: '#9C27B0',
      legendary: '#FF9800'
    };
    return colors[rarity];
  };

  const getCategoryIcon = (category: Achievement['category']): string => {
    const icons = {
      creation: 'creation',
      collaboration: 'account-group',
      productivity: 'chart-line',
      learning: 'school',
      special: 'star'
    };
    return icons[category];
  };

  const renderProgressBar = (progress: number, total: number) => {
    const percentage = (progress / total) * 100;

    if (Platform.OS === 'android') {
      return (
        <ProgressBarAndroid
          styleAttr="Horizontal"
          indeterminate={false}
          progress={progress / total}
          color="#2196F3"
        />
      );
    }

    return (
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${percentage}%` }]} />
      </View>
    );
  };

  if (!visible || !userStats) return null;

  return (
    <View style={styles.overlay}>
      <View style={styles.panel}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Icon name="trophy" size={24} color="#FFD700" />
            <Text style={styles.headerTitle}>Gamification</Text>
          </View>
          <TouchableOpacity onPress={onClose}>
            <Icon name="close" size={24} color="#333" />
          </TouchableOpacity>
        </View>

        {/* User Stats Bar */}
        <View style={styles.userStatsBar}>
          <View style={styles.levelInfo}>
            <Text style={styles.levelText}>Level {userStats.level.level}</Text>
            <Text style={styles.levelTitle}>{userStats.level.title}</Text>
          </View>
          <View style={styles.xpInfo}>
            <Text style={styles.xpText}>
              {userStats.level.xp}/{userStats.level.xpToNext} XP
            </Text>
            {renderProgressBar(userStats.level.xp, userStats.level.xpToNext)}
          </View>
          <View style={styles.pointsInfo}>
            <Text style={styles.pointsText}>{userStats.points.total} pts</Text>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          {[
            { key: 'overview', label: 'Genel', icon: 'view-dashboard' },
            { key: 'achievements', label: 'Başarılar', icon: 'medal' },
            { key: 'challenges', label: 'Görevler', icon: 'target' },
            { key: 'leaderboard', label: 'Sıralama', icon: 'podium' }
          ].map(tab => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && styles.activeTab]}
              onPress={() => setActiveTab(tab.key as any)}
            >
              <Icon
                name={tab.icon}
                size={20}
                color={activeTab === tab.key ? '#2196F3' : '#666'}
              />
              <Text style={[styles.tabText, activeTab === tab.key && styles.activeTabText]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab Content */}
        <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
          {activeTab === 'overview' && (
            <View>
              {/* Quick Stats */}
              <View style={styles.statsGrid}>
                <View style={styles.statCard}>
                  <Icon name="node" size={24} color="#4CAF50" />
                  <Text style={styles.statValue}>{userStats.activity.nodesCreated}</Text>
                  <Text style={styles.statLabel}>Düğüm</Text>
                </View>
                <View style={styles.statCard}>
                  <Icon name="link" size={24} color="#2196F3" />
                  <Text style={styles.statValue}>{userStats.activity.connectionsMade}</Text>
                  <Text style={styles.statLabel}>Bağlantı</Text>
                </View>
                <View style={styles.statCard}>
                  <Icon name="check-circle" size={24} color="#9C27B0" />
                  <Text style={styles.statValue}>{userStats.activity.projectsCompleted}</Text>
                  <Text style={styles.statLabel}>Proje</Text>
                </View>
                <View style={styles.statCard}>
                  <Icon name="fire" size={24} color="#FF5722" />
                  <Text style={styles.statValue}>{userStats.streaks.current}</Text>
                  <Text style={styles.statLabel}>Seri</Text>
                </View>
              </View>

              {/* Badges */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Rozetler</Text>
                <View style={styles.badgesContainer}>
                  {Object.entries(userStats.badges).map(([badge, earned]) => (
                    <View key={badge} style={[styles.badge, earned && styles.badgeEarned]}>
                      <Icon
                        name={earned ? 'medal' : 'medal-outline'}
                        size={24}
                        color={earned ? '#FFD700' : '#CCC'}
                      />
                      <Text style={[styles.badgeText, earned && styles.badgeTextEarned]}>
                        {badge.replace(/([A-Z])/g, ' $1').trim()}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Recent Achievements */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Son Başarılar</Text>
                {userStats.achievements.slice(-3).map(achievement => (
                  <View key={achievement.id} style={styles.recentAchievement}>
                    <View style={[styles.achievementIcon, { backgroundColor: getRarityColor(achievement.rarity) }]}>
                      <Icon name={achievement.icon} size={20} color="#FFF" />
                    </View>
                    <View style={styles.achievementInfo}>
                      <Text style={styles.achievementName}>{achievement.name}</Text>
                      <Text style={styles.achievementDesc}>{achievement.description}</Text>
                    </View>
                    <Text style={styles.achievementPoints}>+{achievement.points}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {activeTab === 'achievements' && (
            <View>
              <Text style={styles.sectionTitle}>Tüm Başarılar ({userStats.achievements.length}/{achievements.length})</Text>
              {achievements.map(achievement => {
                const isUnlocked = userStats.achievements.some(a => a.id === achievement.id);
                const progress = GamificationService.getAchievementProgress(userId, achievement.id);

                return (
                  <View key={achievement.id} style={[styles.achievementCard, isUnlocked && styles.achievementUnlocked]}>
                    <View style={[styles.achievementIcon, { backgroundColor: getRarityColor(achievement.rarity) }]}>
                      <Icon name={achievement.icon} size={24} color="#FFF" />
                    </View>
                    <View style={styles.achievementContent}>
                      <View style={styles.achievementHeader}>
                        <Text style={[styles.achievementName, isUnlocked && styles.achievementNameUnlocked]}>
                          {achievement.name}
                        </Text>
                        <Text style={styles.achievementRarity}>{achievement.rarity.toUpperCase()}</Text>
                      </View>
                      <Text style={[styles.achievementDesc, isUnlocked && styles.achievementDescUnlocked]}>
                        {achievement.description}
                      </Text>
                      {!isUnlocked && (
                        <View style={styles.progressContainer}>
                          {renderProgressBar(progress, 100)}
                          <Text style={styles.progressText}>
                            {Math.round(progress)}% ({achievement.requirements.value - (achievement.requirements.value * progress / 100)} kaldı)
                          </Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.achievementReward}>
                      <Text style={styles.rewardPoints}>+{achievement.points}</Text>
                      <Text style={styles.rewardXP}>XP</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {activeTab === 'challenges' && (
            <View>
              <Text style={styles.sectionTitle}>Günlük Görevler</Text>
              {dailyChallenges.map(challenge => (
                <View key={challenge.id} style={[styles.challengeCard, challenge.completed && styles.challengeCompleted]}>
                  <View style={styles.challengeIcon}>
                    <Icon name="target" size={24} color={challenge.completed ? '#4CAF50' : '#2196F3'} />
                  </View>
                  <View style={styles.challengeContent}>
                    <Text style={[styles.challengeTitle, challenge.completed && styles.challengeTitleCompleted]}>
                      {challenge.title}
                    </Text>
                    <Text style={styles.challengeDesc}>{challenge.description}</Text>
                    <View style={styles.challengeProgress}>
                      {renderProgressBar(challenge.progress, challenge.target)}
                      <Text style={styles.challengeProgressText}>
                        {challenge.progress}/{challenge.target}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.challengeReward}>
                    <Text style={styles.rewardPoints}>+{challenge.reward.points}</Text>
                    <Text style={styles.rewardXP}>{challenge.reward.xp} XP</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {activeTab === 'leaderboard' && (
            <View>
              <Text style={styles.sectionTitle}>Lider Tablosu</Text>
              {leaderboard.map((entry, index) => (
                <View key={entry.userId} style={styles.leaderboardEntry}>
                  <View style={styles.rankContainer}>
                    <Text style={[styles.rank, index < 3 && styles.rankTop]}>
                      #{entry.rank}
                    </Text>
                  </View>
                  <View style={styles.userInfo}>
                    <Text style={styles.userName}>{entry.displayName}</Text>
                    <Text style={styles.userStats}>
                      Level {entry.level} • {entry.achievements} başarı
                    </Text>
                  </View>
                  <View style={styles.scoreContainer}>
                    <Text style={styles.score}>{entry.score.toLocaleString()}</Text>
                    <Text style={styles.scoreLabel}>puan</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  panel: {
    flex: 1,
    backgroundColor: '#FFF',
    marginTop: 50,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  userStatsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F8F9FA',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  levelInfo: {
    flex: 1,
  },
  levelText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  levelTitle: {
    fontSize: 12,
    color: '#666',
  },
  xpInfo: {
    flex: 2,
    marginHorizontal: 16,
  },
  xpText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2196F3',
    borderRadius: 2,
  },
  pointsInfo: {
    alignItems: 'flex-end',
  },
  pointsText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    gap: 4,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#2196F3',
  },
  tabText: {
    fontSize: 12,
    color: '#666',
  },
  activeTabText: {
    color: '#2196F3',
    fontWeight: '600',
  },
  tabContent: {
    flex: 1,
    padding: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    minWidth: (SCREEN_WIDTH - 32 - 24) / 2,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  badgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  badgeEarned: {
    backgroundColor: '#FFF3CD',
  },
  badgeText: {
    fontSize: 12,
    color: '#666',
  },
  badgeTextEarned: {
    color: '#856404',
    fontWeight: '600',
  },
  recentAchievement: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    gap: 12,
  },
  achievementIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  achievementInfo: {
    flex: 1,
  },
  achievementName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  achievementDesc: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  achievementPoints: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  achievementCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    gap: 12,
  },
  achievementUnlocked: {
    backgroundColor: '#E8F5E8',
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  achievementContent: {
    flex: 1,
  },
  achievementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  achievementNameUnlocked: {
    color: '#2E7D32',
  },
  achievementRarity: {
    fontSize: 10,
    color: '#666',
    backgroundColor: '#E0E0E0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  achievementDescUnlocked: {
    color: '#666',
  },
  progressContainer: {
    marginTop: 8,
  },
  progressText: {
    fontSize: 10,
    color: '#666',
    marginTop: 4,
  },
  achievementReward: {
    alignItems: 'center',
  },
  rewardPoints: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  rewardXP: {
    fontSize: 10,
    color: '#666',
  },
  challengeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    gap: 12,
  },
  challengeCompleted: {
    backgroundColor: '#E8F5E8',
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  challengeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  challengeContent: {
    flex: 1,
  },
  challengeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  challengeTitleCompleted: {
    color: '#2E7D32',
    textDecorationLine: 'line-through',
  },
  challengeDesc: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  challengeProgress: {
    marginTop: 8,
  },
  challengeProgressText: {
    fontSize: 10,
    color: '#666',
    marginTop: 4,
  },
  challengeReward: {
    alignItems: 'center',
  },
  leaderboardEntry: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    gap: 12,
  },
  rankContainer: {
    width: 40,
    alignItems: 'center',
  },
  rank: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
  },
  rankTop: {
    color: '#FFD700',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  userStats: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  scoreContainer: {
    alignItems: 'flex-end',
  },
  score: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  scoreLabel: {
    fontSize: 10,
    color: '#666',
  },
});

export default GamificationDashboard;
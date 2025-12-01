// src/services/gamificationService.ts

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'creation' | 'collaboration' | 'productivity' | 'learning' | 'special';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  points: number;
  requirements: {
    type: keyof UserStats['activity'];
    value: number;
  };
  unlockedAt?: number;
  progress?: number;
}

export interface UserLevel {
  level: number;
  xp: number;
  xpToNext: number;
  totalXp: number;
  title: string;
}

export interface UserStats {
  userId: string;
  level: UserLevel;
  achievements: Achievement[];
  points: {
    total: number;
    thisWeek: number;
    thisMonth: number;
  };
  streaks: {
    current: number;
    longest: number;
    lastActivity: number;
  };
  activity: {
    nodesCreated: number;
    connectionsMade: number;
    projectsCompleted: number;
    collaborationTime: number;
    exportsMade: number;
    reviewsGiven: number;
  };
  badges: {
    earlyAdopter: boolean;
    powerUser: boolean;
    collaborator: boolean;
    innovator: boolean;
    mentor: boolean;
  };
}

export interface DailyChallenge {
  id: string;
  title: string;
  description: string;
  type: 'nodes_created' | 'connections_made' | 'collaboration_time' | 'exports_made' | 'reviews_given';
  target: number;
  reward: {
    xp: number;
    points: number;
    achievement?: string;
  };
  expiresAt: number;
  completed: boolean;
  progress: number;
}

export interface LeaderboardEntry {
  userId: string;
  displayName: string;
  avatar?: string;
  score: number;
  level: number;
  achievements: number;
  rank: number;
}

export class GamificationService {
  private static instance: GamificationService;
  private achievements: Achievement[] = [];
  private userStats: Map<string, UserStats> = new Map();
  private dailyChallenges: DailyChallenge[] = [];
  private leaderboard: LeaderboardEntry[] = [];

  static getInstance(): GamificationService {
    if (!GamificationService.instance) {
      GamificationService.instance = new GamificationService();
    }
    return GamificationService.instance;
  }

  constructor() {
    this.initializeAchievements();
    this.generateDailyChallenges();
  }

  /**
   * Başarıları başlat
   */
  private initializeAchievements(): void {
    this.achievements = [
      // Creation Achievements
      {
        id: 'first_node',
        name: 'İlk Adım',
        description: 'İlk düğümünüzü oluşturun',
        icon: 'seed',
        category: 'creation',
        rarity: 'common',
        points: 10,
        requirements: { type: 'nodesCreated', value: 1 }
      },
      {
        id: 'node_master',
        name: 'Düğüm Ustası',
        description: '100 düğüm oluşturun',
        icon: 'atom',
        category: 'creation',
        rarity: 'rare',
        points: 100,
        requirements: { type: 'nodesCreated', value: 100 }
      },
      {
        id: 'connection_artist',
        name: 'Bağlantı Sanatçısı',
        description: '50 bağlantı oluşturun',
        icon: 'link-variant',
        category: 'creation',
        rarity: 'rare',
        points: 75,
        requirements: { type: 'connectionsMade', value: 50 }
      },

      // Collaboration Achievements
      {
        id: 'team_player',
        name: 'Takım Oyuncusu',
        description: 'İlk işbirliği oturumuna katılın',
        icon: 'account-group',
        category: 'collaboration',
        rarity: 'common',
        points: 25,
        requirements: { type: 'collaborationTime', value: 60 } // 1 hour
      },
      {
        id: 'meeting_host',
        name: 'Toplantı Lideri',
        description: '10 saat işbirliği yapın',
        icon: 'presentation',
        category: 'collaboration',
        rarity: 'epic',
        points: 200,
        requirements: { type: 'collaborationTime', value: 600 } // 10 hours
      },

      // Productivity Achievements
      {
        id: 'project_finisher',
        name: 'Proje Tamamlayıcısı',
        description: 'İlk projenizi tamamlayın',
        icon: 'check-circle',
        category: 'productivity',
        rarity: 'common',
        points: 50,
        requirements: { type: 'projectsCompleted', value: 1 }
      },
      {
        id: 'exporter',
        name: 'Dışa Aktarıcı',
        description: '10 proje dışa aktarın',
        icon: 'share-variant',
        category: 'productivity',
        rarity: 'rare',
        points: 75,
        requirements: { type: 'exportsMade', value: 10 }
      },

      // Learning Achievements
      {
        id: 'reviewer',
        name: 'Eleştirmen',
        description: '5 değerlendirme yapın',
        icon: 'star',
        category: 'learning',
        rarity: 'common',
        points: 30,
        requirements: { type: 'reviewsGiven', value: 5 }
      },

      // Special Achievements
      {
        id: 'early_adopter',
        name: 'Erken Kullanıcı',
        description: 'Uygulamanın ilk kullanıcılarından biri olun',
        icon: 'rocket',
        category: 'special',
        rarity: 'legendary',
        points: 1000,
        requirements: { type: 'nodesCreated', value: 1 }
      }
    ];
  }

  /**
   * Günlük görevleri oluştur
   */
  private generateDailyChallenges(): void {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    this.dailyChallenges = [
      {
        id: `daily_${today.getTime()}_nodes`,
        title: 'Düğüm Oluşturucu',
        description: 'Bugün 5 düğüm oluşturun',
        type: 'nodes_created',
        target: 5,
        reward: { xp: 50, points: 25 },
        expiresAt: today.getTime() + 24 * 60 * 60 * 1000,
        completed: false,
        progress: 0
      },
      {
        id: `daily_${today.getTime()}_connections`,
        title: 'Bağlantı Uzmanı',
        description: 'Bugün 3 bağlantı oluşturun',
        type: 'connections_made',
        target: 3,
        reward: { xp: 30, points: 15 },
        expiresAt: today.getTime() + 24 * 60 * 60 * 1000,
        completed: false,
        progress: 0
      },
      {
        id: `daily_${today.getTime()}_collaboration`,
        title: 'İşbirlikçi',
        description: 'Bugün 30 dakika işbirliği yapın',
        type: 'collaboration_time',
        target: 30,
        reward: { xp: 75, points: 40 },
        expiresAt: today.getTime() + 24 * 60 * 60 * 1000,
        completed: false,
        progress: 0
      }
    ];
  }

  /**
   * Kullanıcı istatistiklerini al
   */
  getUserStats(userId: string): UserStats {
    if (!this.userStats.has(userId)) {
      this.userStats.set(userId, this.createDefaultUserStats(userId));
    }
    return this.userStats.get(userId)!;
  }

  /**
   * Varsayılan kullanıcı istatistikleri oluştur
   */
  private createDefaultUserStats(userId: string): UserStats {
    return {
      userId,
      level: {
        level: 1,
        xp: 0,
        xpToNext: 100,
        totalXp: 0,
        title: 'Başlangıç'
      },
      achievements: [],
      points: {
        total: 0,
        thisWeek: 0,
        thisMonth: 0
      },
      streaks: {
        current: 0,
        longest: 0,
        lastActivity: Date.now()
      },
      activity: {
        nodesCreated: 0,
        connectionsMade: 0,
        projectsCompleted: 0,
        collaborationTime: 0,
        exportsMade: 0,
        reviewsGiven: 0
      },
      badges: {
        earlyAdopter: false,
        powerUser: false,
        collaborator: false,
        innovator: false,
        mentor: false
      }
    };
  }

  /**
   * Aktiviteyi kaydet ve ödülleri hesapla
   */
  async recordActivity(
    userId: string,
    activityType: keyof UserStats['activity'],
    value: number = 1
  ): Promise<{
    xpGained: number;
    pointsGained: number;
    newAchievements: Achievement[];
    levelUp: boolean;
  }> {
    const stats = this.getUserStats(userId);

    // Aktiviteyi kaydet
    stats.activity[activityType] += value;

    // XP hesapla
    const xpGained = this.calculateXpForActivity(activityType, value);
    stats.level.totalXp += xpGained;
    stats.level.xp += xpGained;

    // Level kontrolü
    let levelUp = false;
    while (stats.level.xp >= stats.level.xpToNext) {
      stats.level.xp -= stats.level.xpToNext;
      stats.level.level++;
      stats.level.xpToNext = this.calculateXpForLevel(stats.level.level);
      stats.level.title = this.getLevelTitle(stats.level.level);
      levelUp = true;
    }

    // Puan hesapla
    const pointsGained = Math.floor(xpGained / 10);
    stats.points.total += pointsGained;
    stats.points.thisWeek += pointsGained;
    stats.points.thisMonth += pointsGained;

    // Başarıları kontrol et
    const newAchievements = this.checkAchievements(stats);

    // Günlük görevleri güncelle
    this.updateDailyChallenges(userId, activityType, value);

    // Streak'i güncelle
    this.updateStreak(stats);

    // Rozetleri güncelle
    this.updateBadges(stats);

    return {
      xpGained,
      pointsGained,
      newAchievements,
      levelUp
    };
  }

  /**
   * Aktivite için XP hesapla
   */
  private calculateXpForActivity(activityType: keyof UserStats['activity'], value: number): number {
    const xpRates: Record<keyof UserStats['activity'], number> = {
      nodesCreated: 5,
      connectionsMade: 3,
      projectsCompleted: 50,
      collaborationTime: 1, // Dakika başına
      exportsMade: 10,
      reviewsGiven: 15
    };

    return xpRates[activityType] * value;
  }

  /**
   * Level için gerekli XP hesapla
   */
  private calculateXpForLevel(level: number): number {
    return 100 + (level - 1) * 50; // Her level için artan XP
  }

  /**
   * Level başlığını al
   */
  private getLevelTitle(level: number): string {
    const titles = [
      'Başlangıç',
      'Çırak',
      'Uzman',
      'Usta',
      'Master',
      'Grandmaster',
      'Legend',
      'Mythic'
    ];

    return titles[Math.min(level - 1, titles.length - 1)];
  }

  /**
   * Başarıları kontrol et
   */
  private checkAchievements(stats: UserStats): Achievement[] {
    const newAchievements: Achievement[] = [];

    for (const achievement of this.achievements) {
      // Zaten kazanıldı mı kontrol et
      if (stats.achievements.some(a => a.id === achievement.id)) continue;

      // Gereksinimleri karşılıyor mu kontrol et
      const currentValue = stats.activity[achievement.requirements.type];
      const requiredValue = achievement.requirements.value;

      if (currentValue >= requiredValue) {
        const unlockedAchievement = {
          ...achievement,
          unlockedAt: Date.now(),
          progress: currentValue
        };
        stats.achievements.push(unlockedAchievement);
        newAchievements.push(unlockedAchievement);
      }
    }

    return newAchievements;
  }

  /**
   * Günlük görevleri güncelle
   */
  private updateDailyChallenges(
    userId: string,
    activityType: keyof UserStats['activity'],
    value: number
  ): void {
    // Activity type'ı challenge type'a çevir
      const challengeTypeMap: Partial<Record<keyof UserStats['activity'], DailyChallenge['type']>> = {
        nodesCreated: 'nodes_created',
        connectionsMade: 'connections_made',
        collaborationTime: 'collaboration_time',
        exportsMade: 'exports_made',
        reviewsGiven: 'reviews_given'
      };

    const challengeType = challengeTypeMap[activityType];

    this.dailyChallenges.forEach(challenge => {
      if (challenge.type === challengeType && !challenge.completed) {
        challenge.progress += value;
        if (challenge.progress >= challenge.target) {
          challenge.completed = true;
          // Ödülü ver
          this.recordActivity(userId, 'nodesCreated', 0); // XP için dummy activity
        }
      }
    });
  }

  /**
   * Streak'i güncelle
   */
  private updateStreak(stats: UserStats): void {
    const now = Date.now();
    const lastActivity = new Date(stats.streaks.lastActivity);
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    lastActivity.setHours(0, 0, 0, 0);

    const daysDiff = Math.floor((today.getTime() - lastActivity.getTime()) / (24 * 60 * 60 * 1000));

    if (daysDiff === 1) {
      // Ardışık gün
      stats.streaks.current++;
      stats.streaks.longest = Math.max(stats.streaks.longest, stats.streaks.current);
    } else if (daysDiff > 1) {
      // Streak kırıldı
      stats.streaks.current = 1;
    }

    stats.streaks.lastActivity = now;
  }

  /**
   * Rozetleri güncelle
   */
  private updateBadges(stats: UserStats): void {
    stats.badges.earlyAdopter = stats.activity.nodesCreated >= 1;
    stats.badges.powerUser = stats.level.level >= 10;
    stats.badges.collaborator = stats.activity.collaborationTime >= 300; // 5 saat
    stats.badges.innovator = stats.achievements.filter(a => a.category === 'creation').length >= 5;
    stats.badges.mentor = stats.activity.reviewsGiven >= 20;
  }

  /**
   * Tüm başarıları al
   */
  getAllAchievements(): Achievement[] {
    return [...this.achievements];
  }

  /**
   * Kullanıcının başarılarını al
   */
  getUserAchievements(userId: string): Achievement[] {
    return this.getUserStats(userId).achievements;
  }

  /**
   * Günlük görevleri al
   */
  getDailyChallenges(): DailyChallenge[] {
    return [...this.dailyChallenges];
  }

  /**
   * Leaderboard'ı al
   */
  getLeaderboard(limit: number = 10): LeaderboardEntry[] {
    // Mock leaderboard - gerçek uygulamada veritabanından çekilecek
    return [
      {
        userId: 'user1',
        displayName: 'Ahmet Yılmaz',
        score: 2500,
        level: 15,
        achievements: 12,
        rank: 1
      },
      {
        userId: 'user2',
        displayName: 'Ayşe Kaya',
        score: 2200,
        level: 13,
        achievements: 10,
        rank: 2
      },
      {
        userId: 'user3',
        displayName: 'Mehmet Demir',
        score: 2000,
        level: 12,
        achievements: 9,
        rank: 3
      }
    ].slice(0, limit);
  }

  /**
   * Kullanıcının sıralamasını al
   */
  getUserRank(userId: string): number {
    const leaderboard = this.getLeaderboard(100);
    const userEntry = leaderboard.find(entry => entry.userId === userId);
    return userEntry?.rank || 0;
  }

  /**
   * Haftalık puanları sıfırla
   */
  resetWeeklyPoints(): void {
    this.userStats.forEach(stats => {
      stats.points.thisWeek = 0;
    });
  }

  /**
   * Aylık puanları sıfırla
   */
  resetMonthlyPoints(): void {
    this.userStats.forEach(stats => {
      stats.points.thisMonth = 0;
    });
  }

  /**
   * İlerleme yüzdesini hesapla
   */
  getAchievementProgress(userId: string, achievementId: string): number {
    const stats = this.getUserStats(userId);
    const achievement = this.achievements.find(a => a.id === achievementId);

    if (!achievement) return 0;

    const currentValue = stats.activity[achievement.requirements.type];
    const requiredValue = achievement.requirements.value;

    return Math.min((currentValue / requiredValue) * 100, 100);
  }
}

export default GamificationService.getInstance();
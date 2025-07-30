export interface Badge {
  id: string
  name: string
  description: string
  icon: string
  type: 'bronze' | 'silver' | 'gold' | 'platinum'
  category: 'problems' | 'solutions' | 'discussions' | 'community' | 'special'
  criteria: {
    type: 'count' | 'streak' | 'quality' | 'time' | 'special'
    value: number
    metric: string
  }
  points: number
}

export interface UserAchievement {
  id: string
  user_id: string
  badge_id: string
  earned_at: string
  progress?: number
  metadata?: Record<string, any>
}

export const BADGES: Badge[] = [
  // Problem Submission Badges
  {
    id: 'first_problem',
    name: 'Problem Pioneer',
    description: 'Submit your first problem',
    icon: '🚀',
    type: 'bronze',
    category: 'problems',
    criteria: { type: 'count', value: 1, metric: 'problems_submitted' },
    points: 10
  },
  {
    id: 'problem_finder',
    name: 'Problem Finder',
    description: 'Submit 10 problems',
    icon: '🔍',
    type: 'silver',
    category: 'problems',
    criteria: { type: 'count', value: 10, metric: 'problems_submitted' },
    points: 50
  },
  {
    id: 'problem_master',
    name: 'Problem Master',
    description: 'Submit 50 problems',
    icon: '🎯',
    type: 'gold',
    category: 'problems',
    criteria: { type: 'count', value: 50, metric: 'problems_submitted' },
    points: 200
  },
  {
    id: 'problem_legend',
    name: 'Problem Legend',
    description: 'Submit 100 problems',
    icon: '👑',
    type: 'platinum',
    category: 'problems',
    criteria: { type: 'count', value: 100, metric: 'problems_submitted' },
    points: 500
  },

  // Solution Badges
  {
    id: 'first_solution',
    name: 'Solution Seeker',
    description: 'Provide your first solution',
    icon: '💡',
    type: 'bronze',
    category: 'solutions',
    criteria: { type: 'count', value: 1, metric: 'solutions_posted' },
    points: 15
  },
  {
    id: 'solution_provider',
    name: 'Solution Provider',
    description: 'Provide 20 solutions',
    icon: '⚡',
    type: 'silver',
    category: 'solutions',
    criteria: { type: 'count', value: 20, metric: 'solutions_posted' },
    points: 75
  },
  {
    id: 'solution_master',
    name: 'Solution Master',
    description: 'Provide 75 solutions',
    icon: '🧩',
    type: 'gold',
    category: 'solutions',
    criteria: { type: 'count', value: 75, metric: 'solutions_posted' },
    points: 300
  },
  {
    id: 'solution_legend',
    name: 'Solution Legend',
    description: 'Provide 150 solutions',
    icon: '🌟',
    type: 'platinum',
    category: 'solutions',
    criteria: { type: 'count', value: 150, metric: 'solutions_posted' },
    points: 750
  },

  // Discussion Badges
  {
    id: 'first_discussion',
    name: 'Conversation Starter',
    description: 'Participate in your first discussion',
    icon: '💬',
    type: 'bronze',
    category: 'discussions',
    criteria: { type: 'count', value: 1, metric: 'discussions_participated' },
    points: 5
  },
  {
    id: 'discussion_enthusiast',
    name: 'Discussion Enthusiast',
    description: 'Participate in 25 discussions',
    icon: '🗣️',
    type: 'silver',
    category: 'discussions',
    criteria: { type: 'count', value: 25, metric: 'discussions_participated' },
    points: 40
  },
  {
    id: 'discussion_leader',
    name: 'Discussion Leader',
    description: 'Participate in 100 discussions',
    icon: '📢',
    type: 'gold',
    category: 'discussions',
    criteria: { type: 'count', value: 100, metric: 'discussions_participated' },
    points: 150
  },

  // Community Badges
  {
    id: 'community_favorite',
    name: 'Community Favorite',
    description: 'Receive 50 upvotes',
    icon: '⭐',
    type: 'silver',
    category: 'community',
    criteria: { type: 'count', value: 50, metric: 'total_votes_received' },
    points: 100
  },
  {
    id: 'highly_rated',
    name: 'Highly Rated',
    description: 'Receive 200 upvotes',
    icon: '🏆',
    type: 'gold',
    category: 'community',
    criteria: { type: 'count', value: 200, metric: 'total_votes_received' },
    points: 400
  },
  {
    id: 'community_champion',
    name: 'Community Champion',
    description: 'Receive 500 upvotes',
    icon: '💎',
    type: 'platinum',
    category: 'community',
    criteria: { type: 'count', value: 500, metric: 'total_votes_received' },
    points: 1000
  },

  // Special Badges
  {
    id: 'early_adopter',
    name: 'Early Adopter',
    description: 'One of the first 100 users',
    icon: '🌅',
    type: 'gold',
    category: 'special',
    criteria: { type: 'special', value: 100, metric: 'user_rank' },
    points: 250
  },
  {
    id: 'streak_master',
    name: 'Streak Master',
    description: 'Maintain a 30-day activity streak',
    icon: '🔥',
    type: 'gold',
    category: 'special',
    criteria: { type: 'streak', value: 30, metric: 'activity_streak' },
    points: 300
  },
  {
    id: 'helping_hand',
    name: 'Helping Hand',
    description: 'Help 10 different users',
    icon: '🤝',
    type: 'silver',
    category: 'community',
    criteria: { type: 'count', value: 10, metric: 'users_helped' },
    points: 80
  }
]

export class AchievementService {
  /**
   * Check which badges a user should earn based on their current stats
   */
  static checkEligibleBadges(userStats: {
    problems_submitted: number
    solutions_posted: number
    discussions_participated: number
    total_votes_received: number
    streak_days?: number
    users_helped?: number
    user_rank?: number
  }): Badge[] {
    const eligibleBadges: Badge[] = []

    for (const badge of BADGES) {
      const isEligible = this.checkBadgeEligibility(badge, userStats)
      if (isEligible) {
        eligibleBadges.push(badge)
      }
    }

    return eligibleBadges
  }

  /**
   * Check if a user is eligible for a specific badge
   */
  static checkBadgeEligibility(badge: Badge, userStats: any): boolean {
    const { criteria } = badge
    const userValue = userStats[criteria.metric] || 0

    switch (criteria.type) {
      case 'count':
        return userValue >= criteria.value
      case 'streak':
        return (userStats.streak_days || 0) >= criteria.value
      case 'special':
        if (criteria.metric === 'user_rank') {
          return (userStats.user_rank || Infinity) <= criteria.value
        }
        return false
      default:
        return false
    }
  }

  /**
   * Calculate total points from badges
   */
  static calculateTotalPoints(badges: Badge[]): number {
    return badges.reduce((total, badge) => total + badge.points, 0)
  }

  /**
   * Get badges by category
   */
  static getBadgesByCategory(category: Badge['category']): Badge[] {
    return BADGES.filter(badge => badge.category === category)
  }

  /**
   * Get badge by ID
   */
  static getBadgeById(id: string): Badge | undefined {
    return BADGES.find(badge => badge.id === id)
  }

  /**
   * Calculate progress towards next badge in a category
   */
  static getNextBadgeProgress(
    category: Badge['category'], 
    userStats: any, 
    earnedBadgeIds: string[]
  ): { badge: Badge | null; progress: number } {
    const categoryBadges = this.getBadgesByCategory(category)
      .filter(badge => !earnedBadgeIds.includes(badge.id))
      .sort((a, b) => a.criteria.value - b.criteria.value)

    const nextBadge = categoryBadges[0]
    if (!nextBadge) {
      return { badge: null, progress: 100 }
    }

    const userValue = userStats[nextBadge.criteria.metric] || 0
    const progress = Math.min(100, (userValue / nextBadge.criteria.value) * 100)

    return { badge: nextBadge, progress }
  }

  /**
   * Get user level based on total points
   */
  static getUserLevel(totalPoints: number): { level: number; pointsToNext: number; totalForNext: number } {
    // Level calculation: each level requires more points (exponential growth)
    let level = 1
    let pointsRequired = 100 // Points required for level 2
    let totalPoints_copy = totalPoints

    while (totalPoints_copy >= pointsRequired) {
      totalPoints_copy -= pointsRequired
      level++
      pointsRequired = Math.floor(pointsRequired * 1.5) // Increase by 50% each level
    }

    const pointsToNext = pointsRequired - totalPoints_copy
    const totalForNext = pointsRequired

    return { level, pointsToNext, totalForNext }
  }

  /**
   * Format badge type for display
   */
  static formatBadgeType(type: Badge['type']): string {
    return type.charAt(0).toUpperCase() + type.slice(1)
  }

  /**
   * Get badge color based on type
   */
  static getBadgeColor(type: Badge['type']): string {
    switch (type) {
      case 'bronze': return 'bg-orange-600 text-white'
      case 'silver': return 'bg-gray-400 text-white'
      case 'gold': return 'bg-yellow-500 text-white'
      case 'platinum': return 'bg-gray-800 text-white'
      default: return 'bg-gray-200 text-gray-800'
    }
  }

  /**
   * Generate achievement notification message
   */
  static generateAchievementMessage(badge: Badge): string {
    return `🎉 Congratulations! You've earned the "${badge.name}" badge for ${badge.description.toLowerCase()}!`
  }
} 
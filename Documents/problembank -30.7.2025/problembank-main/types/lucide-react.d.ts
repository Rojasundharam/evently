declare module 'lucide-react' {
  import { ComponentType, SVGProps } from 'react'
  
  export interface LucideProps extends SVGProps<SVGSVGElement> {
    size?: number | string
    strokeWidth?: number | string
    absoluteStrokeWidth?: boolean
  }
  
  export type LucideIcon = ComponentType<LucideProps>
  
  export const Search: LucideIcon
  export const TrendingUp: LucideIcon
  export const Users: LucideIcon
  export const Lightbulb: LucideIcon
  export const Target: LucideIcon
  export const Plus: LucideIcon
  export const Sparkles: LucideIcon
  export const Brain: LucideIcon
  export const ArrowUpRight: LucideIcon
  export const Trophy: LucideIcon
  export const Medal: LucideIcon
  export const Star: LucideIcon
  export const Zap: LucideIcon
  export const Flame: LucideIcon
  export const Clock: LucideIcon
  export const MessageSquare: LucideIcon
  export const BookOpen: LucideIcon
  export const Award: LucideIcon
  export const Crown: LucideIcon
  export const Calendar: LucideIcon
  export const Activity: LucideIcon
  export const UserCheck: LucideIcon
  export const TrendingDown: LucideIcon
  export const X: LucideIcon
  export const RefreshCw: LucideIcon
  export const Tag: LucideIcon
  export const CheckCircle: LucideIcon
  export const AlertCircle: LucideIcon
  export const ArrowRight: LucideIcon
  export const Save: LucideIcon
  export const DollarSign: LucideIcon
  export const ArrowLeft: LucideIcon
  export const User: LucideIcon
  export const ThumbsUp: LucideIcon
  export const ThumbsDown: LucideIcon
  export const MessageCircle: LucideIcon
  export const Send: LucideIcon
} 
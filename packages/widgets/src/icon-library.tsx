import type { ComponentType, SVGProps } from 'react'
import {
  AlertCircle,
  ArrowDown,
  ArrowRight,
  ArrowUp,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Copy,
  CreditCard,
  Database,
  Download,
  Eye,
  EyeOff,
  Filter,
  GripVertical,
  Heart,
  Home,
  Loader2,
  Mic,
  Minus,
  Pencil,
  Phone,
  Plus,
  RotateCw,
  Search,
  Send,
  Settings,
  Smile,
  Star,
  User,
  Users,
  X,
} from 'lucide-react'
import {
  ArrowDownIcon,
  ArrowPathIcon,
  ArrowDownTrayIcon,
  ArrowRightIcon,
  ArrowUpIcon,
  Bars2Icon,
  CalendarIcon,
  CheckCircleIcon,
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  CircleStackIcon,
  Cog6ToothIcon,
  CreditCardIcon,
  DocumentDuplicateIcon,
  EyeIcon,
  EyeSlashIcon,
  FaceSmileIcon,
  ExclamationCircleIcon,
  FunnelIcon,
  HeartIcon,
  HomeIcon,
  MagnifyingGlassIcon,
  MicrophoneIcon,
  MinusIcon,
  PaperAirplaneIcon,
  PencilIcon,
  PhoneIcon,
  PlusIcon,
  StarIcon,
  UserIcon,
  UsersIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid'
import { FaceSmileIcon as FaceSmileSolidIcon } from '@heroicons/react/24/solid'
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid'

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>

const LUCIDE_ICONS: Record<string, IconComponent> = {
  star: Star,
  starfilled: Star,
  heart: Heart,
  heartfilled: Heart,
  smile: Smile,
  smilefilled: Smile,
  alert: AlertCircle,
  user: User,
  users: Users,
  settings: Settings,
  home: Home,
  check: Check,
  checkcircle: CheckCircle2,
  edit: Pencil,
  search: Search,
  arrowright: ArrowRight,
  arrowup: ArrowUp,
  arrowdown: ArrowDown,
  download: Download,
  send: Send,
  eye: Eye,
  eyeoff: EyeOff,
  mic: Mic,
  calendar: Calendar,
  phone: Phone,
  creditcard: CreditCard,
  chevrondown: ChevronDown,
  chevronup: ChevronUp,
  chevronleft: ChevronLeft,
  chevronright: ChevronRight,
  plus: Plus,
  minus: Minus,
  x: X,
  copy: Copy,
  database: Database,
  filter: Filter,
  rotatecw: RotateCw,
  gripvertical: GripVertical,
  loader: Loader2,
}

const HEROICONS: Record<string, IconComponent> = {
  star: StarIcon,
  starfilled: StarSolidIcon,
  heart: HeartIcon,
  heartfilled: HeartSolidIcon,
  smile: FaceSmileIcon,
  smilefilled: FaceSmileSolidIcon,
  alert: ExclamationCircleIcon,
  user: UserIcon,
  users: UsersIcon,
  settings: Cog6ToothIcon,
  home: HomeIcon,
  check: CheckIcon,
  checkcircle: CheckCircleIcon,
  edit: PencilIcon,
  search: MagnifyingGlassIcon,
  arrowright: ArrowRightIcon,
  arrowup: ArrowUpIcon,
  arrowdown: ArrowDownIcon,
  download: ArrowDownTrayIcon,
  send: PaperAirplaneIcon,
  eye: EyeIcon,
  eyeoff: EyeSlashIcon,
  mic: MicrophoneIcon,
  calendar: CalendarIcon,
  phone: PhoneIcon,
  creditcard: CreditCardIcon,
  chevrondown: ChevronDownIcon,
  chevronup: ChevronUpIcon,
  chevronleft: ChevronLeftIcon,
  chevronright: ChevronRightIcon,
  plus: PlusIcon,
  minus: MinusIcon,
  x: XMarkIcon,
  copy: DocumentDuplicateIcon,
  database: CircleStackIcon,
  filter: FunnelIcon,
  rotatecw: ArrowPathIcon,
  gripvertical: Bars2Icon,
  loader: ArrowPathIcon,
}

const normalizeLibrary = (library?: string) => {
  const normalized = library?.trim().toLowerCase()
  if (!normalized) {
    return 'lucide'
  }
  if (normalized === 'heroicons') {
    return 'heroicons'
  }
  if (normalized === 'hugeicons') {
    return 'heroicons'
  }
  return 'lucide'
}

const normalizeIconKey = (iconName?: string) => {
  if (!iconName) {
    return ''
  }
  const normalized = iconName.trim().toLowerCase()
  if (!normalized) {
    return ''
  }
  const compact = normalized.replace(/[^a-z0-9]/g, '')
  if (!compact) {
    return ''
  }
  if (compact.includes('home')) {
    return 'home'
  }
  if (compact.includes('setting') || compact.includes('cog')) {
    return 'settings'
  }
  if (compact.includes('usermultiple') || compact.includes('users')) {
    return 'users'
  }
  if (compact.includes('user')) {
    return 'user'
  }
  if (compact.includes('alert') || compact.includes('exclamation')) {
    return 'alert'
  }
  if (compact.includes('heart')) {
    return 'heart'
  }
  if (compact.includes('smile') || compact.includes('face')) {
    return 'smile'
  }
  return compact
}

export const getWidgetIconComponent = (iconName?: string, library?: string) => {
  const key = normalizeIconKey(iconName)
  if (!key) {
    return null
  }
  const resolvedLibrary = normalizeLibrary(library)
  const icons = resolvedLibrary === 'heroicons' ? HEROICONS : LUCIDE_ICONS
  return icons[key] ?? null
}

export const renderWidgetIcon = (
  iconName?: string,
  options?: {
    library?: string
    className?: string
    size?: number
  }
) => {
  const Icon = getWidgetIconComponent(iconName, options?.library)
  if (!Icon) {
    return null
  }
  const size = options?.size ?? 16
  return (
    <Icon
      className={options?.className}
      style={size ? { width: size, height: size } : undefined}
      aria-hidden="true"
    />
  )
}

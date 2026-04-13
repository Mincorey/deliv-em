// ── Database Types (generated from delivem_schema.sql) ──────────────────────

export type UserRole = 'customer' | 'courier'

export type TaskType =
  | 'documents'
  | 'groceries'
  | 'materials'
  | 'gift'
  | 'meeting'
  | 'parcel'

export type TaskStatus =
  | 'draft'
  | 'published'
  | 'matched'
  | 'in_progress'
  | 'completed'
  | 'cancelled'

export type TransactionType = 'top_up' | 'task_fee' | 'payout' | 'refund'

export type TransportType = 'foot' | 'bicycle' | 'motorcycle' | 'car' | 'truck'

// ── Table Types ──────────────────────────────────────────────────────────────

export interface Profile {
  id: string
  role: UserRole
  full_name: string
  phone: string
  email: string
  city: string
  avatar_url: string | null
  bio: string | null
  wallet_balance: number
  is_verified: boolean
  is_active: boolean
  push_token: string | null
  created_at: string
  updated_at: string
}

export interface CourierProfile {
  id: string
  transport_type: TransportType
  rating: number
  total_tasks: number
  completed_tasks: number
  is_available: boolean
  current_lat: number | null
  current_lng: number | null
  updated_at: string
}

export interface Task {
  id: string
  customer_id: string
  courier_id: string | null
  title: string
  description: string | null
  task_type: TaskType
  status: TaskStatus
  reward: number
  from_address: string
  from_lat: number | null
  from_lng: number | null
  to_address: string
  to_lat: number | null
  to_lng: number | null
  deadline: string | null
  started_at: string | null
  completed_at: string | null
  placement_fee: number
  is_private: boolean
  created_at: string
  updated_at: string
  // Joined
  customer?: Profile
  courier?: Profile
}

export interface TaskInvitation {
  id: string
  task_id: string
  courier_id: string
  status: 'pending' | 'accepted' | 'declined'
  created_at: string
}

export interface Message {
  id: string
  task_id: string
  sender_id: string
  content: string
  is_read: boolean
  created_at: string
  sender?: Profile
}

export interface Rating {
  id: string
  task_id: string
  from_user_id: string
  to_user_id: string
  score: number
  comment: string | null
  created_at: string
}

export interface Transaction {
  id: string
  user_id: string
  task_id: string | null
  type: TransactionType
  amount: number
  balance_after: number
  description: string | null
  anypay_order_id: string | null
  created_at: string
}

export interface Notification {
  id: string
  user_id: string
  type: string
  title: string
  body: string | null
  task_id: string | null
  is_read: boolean
  created_at: string
}

export interface Feedback {
  id: string
  user_id: string | null
  name: string
  email: string
  subject: string
  message: string
  is_answered: boolean
  created_at: string
}

export interface City {
  id: number
  name: string
  lat: number | null
  lng: number | null
}

// ── UI Types ─────────────────────────────────────────────────────────────────

export interface CourierWithProfile extends Profile {
  courier_profile: CourierProfile
}

export interface TaskWithProfiles extends Omit<Task, 'customer' | 'courier'> {
  customer: Profile
  courier: Profile | null
}

export const TASK_TYPE_META: Record<
  TaskType,
  { label: string; icon: string; color: string }
> = {
  documents: { label: 'Документы', icon: 'description', color: '#00236f' },
  groceries: { label: 'Продукты', icon: 'shopping_basket', color: '#006c49' },
  materials: { label: 'Материалы', icon: 'construction', color: '#7b5e00' },
  gift: { label: 'Подарок', icon: 'redeem', color: '#ba1a1a' },
  meeting: { label: 'Встреча', icon: 'groups', color: '#4b1c00' },
  parcel: { label: 'Посылка', icon: 'inventory_2', color: '#004d6e' },
}

export const STATUS_META: Record<
  TaskStatus,
  { label: string; cls: string }
> = {
  draft: { label: 'Черновик', cls: 'badge-gray' },
  published: { label: 'Свободен', cls: 'badge-green' },
  matched: { label: 'Принят', cls: 'badge-orange' },
  in_progress: { label: 'Выполняется', cls: 'badge-orange' },
  completed: { label: 'Выполнено', cls: 'badge-blue' },
  cancelled: { label: 'Отменено', cls: 'badge-red' },
}

export const TRANSPORT_META: Record<
  TransportType,
  { label: string; icon: string }
> = {
  foot: { label: 'Пешком', icon: 'directions_walk' },
  bicycle: { label: 'Велосипед', icon: 'directions_bike' },
  motorcycle: { label: 'Мотоцикл', icon: 'two_wheeler' },
  car: { label: 'Автомобиль', icon: 'directions_car' },
  truck: { label: 'Грузовик', icon: 'local_shipping' },
}

export const CITIES = [
  'Сухум',
  'Гагра',
  'Гудаута',
  'Новый Афон',
  'Очамчыра',
  'Ткуарчал',
  'Гал',
  'Пицунда',
]

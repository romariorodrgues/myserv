// Author: Romário Rodrigues <romariorodrigues.dev@gmail.com>
// Centralized type definitions for MyServ platform

import { $Enums } from '@prisma/client'

export type PrismaUserType = $Enums.UserType

export const UserTypeValues = {
  CLIENT: 'CLIENT',
  SERVICE_PROVIDER: 'SERVICE_PROVIDER',
  ADMIN: 'ADMIN',
} as const

export type UserType = typeof UserTypeValues[keyof typeof UserTypeValues]

// ─── LEGACY ENUMS (DEPRECATED) ─────────────────────────────────────────
// Note: these enums were replaced by the corresponding $Enums from Prisma

// export enum UserType {
//   CLIENT = 'CLIENT',
//   SERVICE_PROVIDER = 'SERVICE_PROVIDER',
//   ADMIN = 'ADMIN',
// }

export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  OTHER = 'OTHER',
  PREFER_NOT_TO_SAY = 'PREFER_NOT_TO_SAY',
}

export enum MaritalStatus {
  SINGLE = 'SINGLE',
  MARRIED = 'MARRIED',
  DIVORCED = 'DIVORCED',
  WIDOWED = 'WIDOWED',
  OTHER = 'OTHER',
}

export enum RequestType {
  SCHEDULING = 'SCHEDULING',
  QUOTE = 'QUOTE',
}

export enum RequestStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
}

export enum PaymentMethod {
  CREDIT_CARD = 'CREDIT_CARD',
  DEBIT_CARD = 'DEBIT_CARD',
  PIX = 'PIX',
  BANK_TRANSFER = 'BANK_TRANSFER',
  BOLETO = 'BOLETO',
}

export enum PaymentGateway {
  MERCADO_PAGO = 'MERCADO_PAGO',
  PAGAR_ME = 'PAGAR_ME',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
}

export enum BillingCycle {
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  ANNUALLY = 'ANNUALLY',
}

export enum SubscriptionStatus {
  ACTIVE = 'ACTIVE',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
  SUSPENDED = 'SUSPENDED',
}

export enum NotificationType {
  SERVICE_REQUEST = 'SERVICE_REQUEST',
  PAYMENT = 'PAYMENT',
  SYSTEM = 'SYSTEM',
  PROMOTIONAL = 'PROMOTIONAL',
}

export enum ProfileVisibility {
  PUBLIC = 'PUBLIC',
  PRIVATE = 'PRIVATE',
}

// ─── INTERFACES ──────────────────────────────────────────────────────────

export interface ClientProfileData {
  id: string
  name: string
  email: string
  phone?: string
  cpfCnpj: string
  description?: string
  userType: UserType
  profileImage?: string | null
  address?: {
    street?: string
    number?: string
    city?: string
    state?: string
    zipCode?: string
    complement?: string
    district?: string
    latitude?: number
    longitude?: number
  }
  preferences?: {
    emailNotifications?: boolean
    smsNotifications?: boolean
    whatsappNotifications?: boolean
    marketingEmails?: boolean
    serviceReminders?: boolean
    reviewRequests?: boolean
  }
  privacy?: {
    profileVisibility?: ProfileVisibility
    showPhone?: boolean
    showEmail?: boolean
    showLocation?: boolean
  }
  serviceProviderSettings?: {
    chargesTravel: boolean
    travelCost?: number
    travelRatePerKm?: number
    travelMinimumFee?: number
    serviceRadiusKm?: number
    waivesTravelOnHire: boolean
  }
  plan: string,
}

export interface User {
  id: string
  email: string
  phone: string
  name: string
  cpfCnpj: string
  profileImage?: string
  userType: UserType
  isActive: boolean
  isApproved: boolean
  gender?: Gender
  maritalStatus?: MaritalStatus
  description?: string
  createdAt: Date
  updatedAt: Date
  address?: Address
  serviceProvider?: ServiceProvider
  clientProfile?: ClientProfile
}

export interface ClientProfile {
  id: string
  userId: string
  preferences?: Record<string, unknown>
  createdAt: Date
  updatedAt: Date
}

export interface ServiceProvider {
  id: string
  userId: string
  hasScheduling: boolean
  hasQuoting: boolean
  chargesTravel: boolean
  travelCost?: number
  travelRatePerKm?: number
  travelMinimumFee?: number
  serviceRadiusKm?: number
  waivesTravelOnHire: boolean
  isHighlighted: boolean
  highlightUntil?: Date
  planId?: string
  user: User
  services: ServiceProviderService[]
  availability: Availability[]
}

export interface ServiceRequest {
  id: string
  clientId: string
  providerId: string
  serviceId: string
  requestType: RequestType
  scheduledDate?: Date
  scheduledTime?: string
  description?: string
  status: RequestStatus
  estimatedPrice?: number
  finalPrice?: number
  travelCost?: number
  basePriceSnapshot?: number
  travelDistanceKm?: number
  travelDurationMinutes?: number
  travelRatePerKmSnapshot?: number
  travelMinimumFeeSnapshot?: number
  travelFixedFeeSnapshot?: number
  schedulingFee?: number
  isVisitVirtual: boolean
  expiresAt?: Date
  client: User
  provider: User
  service: Service
}

export interface Address {
  id: string
  userId: string
  state: string
  city: string
  district: string
  street: string
  number: string
  zipCode: string
  latitude?: number
  longitude?: number
}

export interface Service {
  id: string
  name: string
  description?: string
  categoryId: string
  isActive: boolean
  category: ServiceCategory
}

export interface ServiceCategory {
  id: string
  name: string
  description?: string
  icon?: string
  isActive: boolean
  allowScheduling?: boolean
  services: Service[]
}

export interface ServiceProviderService {
  id: string
  serviceProviderId: string
  serviceId: string
  basePrice?: number
  description?: string
  isActive: boolean
  offersScheduling?: boolean
  service: Service
}

export interface Availability {
  id: string
  serviceProviderId: string
  dayOfWeek: number
  startTime: string
  endTime: string
  isActive: boolean
}

export interface Payment {
  id: string
  userId: string
  serviceRequestId?: string
  subscriptionId?: string
  amount: number
  currency: string
  paymentMethod: PaymentMethod
  gateway: PaymentGateway
  gatewayPaymentId?: string
  status: PaymentStatus
  description?: string
}

export interface Plan {
  id: string
  name: string
  description?: string
  price: number
  billingCycle: BillingCycle
  features: string[]
  isActive: boolean
}

export interface Review {
  id: string
  serviceRequestId: string
  giverId: string
  receiverId: string
  rating: number
  comment?: string
  giver: User
  receiver: User
}

export interface Notification {
  id: string
  userId: string
  type: NotificationType
  title: string
  message: string
  isRead: boolean
  data?: Record<string, unknown>
  createdAt: Date
}

export interface SupportedRegion {
  id: string
  state: string
  city: string
  isActive: boolean
}

// ─── FORMS ───────────────────────────────────────────────────────────────

export interface RegisterFormData {
  name: string
  email: string
  phone: string
  cpfCnpj: string
  userType: UserType
  password: string
  confirmPassword: string
  acceptTerms: boolean
  profileImage?: File
}

export interface AddressFormData {
  state: string
  city: string
  district: string
  street: string
  number: string
  zipCode: string
  gender: Gender
  maritalStatus: MaritalStatus
}

export interface ServiceProviderFormData {
  hasScheduling: boolean
  hasQuoting: boolean
  chargesTravel: boolean
  travelCost?: number
  travelRatePerKm?: number
  travelMinimumFee?: number
  waivesTravelOnHire: boolean
  description: string
  services: string[]
}

// ─── UTILS / API ─────────────────────────────────────────────────────────

export interface SearchFilters {
  query?: string
  serviceId?: string
  location?: {
    latitude: number
    longitude: number
    radius?: number
  }
  address?: string
  hasScheduling?: boolean
  hasQuoting?: boolean
}

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

export interface PaginationParams {
  page: number
  limit: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

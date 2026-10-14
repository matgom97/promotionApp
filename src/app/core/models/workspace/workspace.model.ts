/**
 * Usuario autenticado dentro de PromoApp.
 */
export interface WorkspaceUser {
  id: string;
  email: string;
  firstName: string;
  status: string;
  createdAt: string;
}

/**
 * Restaurante o sede activa.
 */
export interface WorkspaceRestaurant {
  id: string;
  organizationId: string;
  name: string;
  city: string;
  status: string;
}

/**
 * Rol asignado al usuario dentro del workspace.
 */
export interface WorkspaceRole {
  code: string;
  name: string;
}

/**
 * Suscripción del restaurante.
 */
export interface WorkspaceSubscription {
  id: string;
  status: string;
  startsAt: string;
  trialEndsAt: string | null;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  canceledAt: string | null;
}

/**
 * Límites establecidos por el plan contratado.
 */
export interface WorkspacePlanLimits {
  maxUsers: number;
  maxActivePromotions: number;
  maxRestaurants: number;
}

/**
 * Funcionalidad disponible en el plan.
 */
export interface WorkspaceFeature {
  code: string;
  name: string;
  description: string | null;
}

/**
 * Información del plan de suscripción.
 */
export interface WorkspacePlan {
  id: string;
  code: string;
  name: string;
  description: string | null;
  priceAmount: string;
  currency: string;
  billingInterval: string;
  limits: WorkspacePlanLimits;
  features: WorkspaceFeature[];
}

/**
 * Contexto del workspace activo.
 */
export interface WorkspaceContext {
  membershipId: string;
  restaurant: WorkspaceRestaurant;
  role: WorkspaceRole;
  permissions: string[];
  subscription: WorkspaceSubscription | null;
  plan: WorkspacePlan | null;
}

/**
 * Respuesta del endpoint GET /me/workspace.
 */
export interface WorkspaceResponse {
  message: string;

  data: {
    user: WorkspaceUser;
    workspace: WorkspaceContext;
  };
}
export type MembershipRole =
  | 'OWNER'
  | 'ADMIN'
  | 'MANAGER'
  | 'STAFF';

export interface TeamRestaurant {
  id: string;
  name: string;
  status: string;
  role: MembershipRole;
  roleId: string | null;
}

export interface TeamMemberUser {
  id: string;
  email: string;
  firstName: string;
  status: string;
}

export interface TeamMember {
  id: string;
  userId: string;
  role: MembershipRole;
  roleName: string;
  allRestaurants: boolean;
  createdAt: string;
  updatedAt: string;
  user: TeamMemberUser;
  restaurants: TeamRestaurant[];
}

export interface TeamPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface TeamMembersResponse {
  data: TeamMember[];
  pagination: TeamPagination;
}

export interface CreateTeamMemberRequest {
  email: string;
  firstName: string;
  password?: string;
  role: MembershipRole;
  allRestaurants: boolean;
  restaurantIds?: string[];
}

export interface UpdateTeamMemberRequest {
  role?: MembershipRole;
  allRestaurants?: boolean;
  password?: string;
  restaurantIds?: string[];
}

export interface TeamMembersQuery {
  page?: number;
  limit?: number;
  role?: MembershipRole;
  restaurantIds?: string[];
  allRestaurants?: boolean;
}

export interface TeamRestaurantOption {
  id: string;
  name: string;
  status: string;
}

export interface TeamRestaurantsResponse {
  message: string;
  data: TeamRestaurantOption[];
}


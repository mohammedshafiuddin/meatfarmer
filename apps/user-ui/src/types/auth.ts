export interface User {
  id: number;
  name: string;
  email: string | null;
  mobile: string | null;
  profileImage?: string | null;
  createdAt: string;
}

export interface UserDetails {
  id: number;
  name: string;
  email: string | null;
  mobile: string | null;
  profileImage?: string | null;
  bio?: string | null;
  dateOfBirth?: string | null;
  gender?: string | null;
  occupation?: string | null;
}

export interface AuthState {
  user: User | null;
  userDetails: UserDetails | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  token: string | null;
}

export interface LoginCredentials {
  identifier: string; // email or mobile
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  mobile: string;
  password: string;
  profileImage?: string;
}

export interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: FormData) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: Partial<User>) => void;
  updateUserDetails: (userDetails: Partial<UserDetails>) => void;
}
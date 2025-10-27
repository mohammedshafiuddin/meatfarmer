import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getAuthToken, saveAuthToken, deleteAuthToken, saveUserId, getUserId } from '../../hooks/useJWT';
import { getCurrentUserId } from '@/utils/getCurrentUserId';
import { useLogin, useRegister } from '@/src/api-hooks/auth.api';
import { AuthState, AuthContextType, LoginCredentials, RegisterData, User } from '@/src/types/auth';
import { trpc } from '@/src/trpc-client';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    token: null,
  });

  const loginMutation = useLogin();
  const registerMutation = useRegister();

  // Initialize auth state on app startup
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = await getAuthToken();
        const userId = await getCurrentUserId();

        if (token && userId) {
          // Use existing token, only fetch user data
          setAuthState({
            user: {
              id: userId,
              name: '', // Will be populated by useQuery
              email: '',
              mobile: '',
              createdAt: '',
            },
            isAuthenticated: true,
            isLoading: true, // Keep loading while fetching user data
            token,
          });
        } else {
          setAuthState(prev => ({
            ...prev,
            isLoading: false,
          }));
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        setAuthState(prev => ({
          ...prev,
          isLoading: false,
        }));
      }
    };

    initializeAuth();
  }, []);

  // Fetch user data using tRPC query
  const { data: selfData, error: selfDataError } = trpc.user.user.getSelfData.useQuery(undefined, {
    enabled: !!(authState.token && authState.user?.id), // Only run if we have token and userId
    retry: false, // Don't retry on auth errors
  });

  // Handle user data response
  useEffect(() => {
    if (selfData && authState.isAuthenticated) {
      const { user } = selfData.data;

      setAuthState(prev => ({
        ...prev,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          mobile: user.mobile,
          createdAt: '',
        },
        isLoading: false,
      }));
    } else if (selfDataError && authState.isAuthenticated) {
      console.error('Failed to fetch user data:', selfDataError);
      // If token is invalid, clear auth state
      // deleteAuthToken();
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        token: null,
      });
    }
  }, [selfData, selfDataError, authState.isAuthenticated]);

  const login = async (credentials: LoginCredentials): Promise<void> => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));

      const response = await loginMutation.mutateAsync(credentials);
      // const response = loginMutation.mutate(credentials);
      const { token, user } = response;
      console.log({token,user})
      
      await saveAuthToken(token);
      await saveUserId(user.id.toString());

      setAuthState({
        user,
        isAuthenticated: true,
        isLoading: false,
        token,
      });
    } catch (error) {
      setAuthState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  };

  const register = async (data: RegisterData): Promise<void> => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));

      const response = await registerMutation.mutateAsync(data);
      const { token, user } = response;

      await saveAuthToken(token);
      await saveUserId(user.id.toString());

      setAuthState({
        user,
        isAuthenticated: true,
        isLoading: false,
        token,
      });
    } catch (error) {
      setAuthState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await deleteAuthToken();
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        token: null,
      });
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear local state even if deleteJWT fails
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        token: null,
      });
    }
  };

  const updateUser = (userData: Partial<User>): void => {
    setAuthState(prev => ({
      ...prev,
      user: prev.user ? { ...prev.user, ...userData } : null,
    }));
  };

  const contextValue: AuthContextType = {
    ...authState,
    login,
    register,
    logout,
    updateUser,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
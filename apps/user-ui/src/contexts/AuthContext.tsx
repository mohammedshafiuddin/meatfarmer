import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getAuthToken, saveAuthToken, deleteAuthToken, saveUserId, getUserId } from '../../hooks/useJWT';
import { getCurrentUserId } from '@/utils/getCurrentUserId';
import { useLogin, useRegister } from '@/src/api-hooks/auth.api';
import { AuthState, AuthContextType, LoginCredentials, RegisterData, User } from '@/src/types/auth';

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
          // TODO: Validate token with backend or decode to get user info
          // For now, create a basic user object
          const user: User = {
            id: userId,
            name: '', // TODO: Fetch from backend
            email: '',
            mobile: '',
            createdAt: '',
          };

          setAuthState({
            user,
            isAuthenticated: true,
            isLoading: false,
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

  const login = async (credentials: LoginCredentials): Promise<void> => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));

      const response = await loginMutation.mutateAsync(credentials);
      const { token, user } = response;
      console.log({token, user, response})

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
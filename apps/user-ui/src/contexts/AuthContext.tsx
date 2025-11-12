import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getAuthToken, saveAuthToken, deleteAuthToken, saveUserId, getUserId } from '../../hooks/useJWT';
import { getCurrentUserId } from '@/utils/getCurrentUserId';
import { useRegister } from '@/src/api-hooks/auth.api';
import { AuthState, AuthContextType, LoginCredentials, RegisterData, User, UserDetails } from '@/src/types/auth';
import { trpc } from '@/src/trpc-client';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    userDetails: null,
    isAuthenticated: false,
    isLoading: true,
    token: null,
  });

  // const loginMutation = useLogin();
  const loginMutation = trpc.user.auth.login.useMutation();
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
                profileImage: '',
                createdAt: '',
              },
              userDetails: null,
             isAuthenticated: true,
             isLoading: true, // Keep loading while fetching user data
             token,
           });
        } else {
          setAuthState(prev => ({
            ...prev,
            userDetails: null,
            isLoading: false,
          }));
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        setAuthState(prev => ({
          ...prev,
          userDetails: null,
          isLoading: false,
        }));
      }
    };

    initializeAuth();
  }, []);

  // Fetch user data using tRPC query
  const { data: selfData, error: selfDataError, refetch: refetchSelfData } = trpc.user.user.getSelfData.useQuery(undefined, {
    enabled: !!(authState.token && authState.user?.id), // Only run if we have token and userId
    retry: false, // Don't retry on auth errors
    refetchOnMount: true, // Refetch on every component mount (app startup)
    refetchOnWindowFocus: false, // Don't refetch on window focus
    staleTime: 0, // Consider data stale immediately
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
          profileImage: user.profileImage,
          createdAt: '',
        },
        userDetails: user,
        isLoading: false,
      }));
    } else if (selfDataError && authState.isAuthenticated) {
      console.error('Failed to fetch user data:', selfDataError);
      // If token is invalid, clear auth state
      // deleteAuthToken();
      setAuthState({
        user: null,
        userDetails: null,
        isAuthenticated: false,
        isLoading: false,
        token: null,
      });
    }
  }, [selfData, selfDataError, authState.isAuthenticated]);

  const loginWithToken = async (token: string, user: User): Promise<void> => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));

      await saveAuthToken(token);
      await saveUserId(user.id.toString());

      setAuthState({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          mobile: user.mobile,
          profileImage: user.profileImage,
          createdAt: '',
        },
        userDetails: user,
        isAuthenticated: true,
        isLoading: false,
        token,
      });
    } catch (error) {
      console.error('Login with token error:', error);
      setAuthState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  };

  const login = async (credentials: LoginCredentials): Promise<void> => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));

      const response = await loginMutation.mutateAsync(credentials);
      // const response = loginMutation.mutate(credentials);
      const { token, user } = response.data;

      await saveAuthToken(token);
      await saveUserId(user.id.toString());

      setAuthState({
        user: {
          id: user.id,
          name: user.name || null,
          email: user.email,
          mobile: user.mobile,
          profileImage: user.profileImage,
          createdAt: '',
        },
        userDetails: user,
        isAuthenticated: true,
        isLoading: false,
        token,
      });

      // Refetch user details to ensure we have the latest data
      refetchSelfData();
    } catch (error) {
      setAuthState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  };
  console.log(authState.userDetails)
  
  const register = async (data: FormData): Promise<void> => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));

      const response = await registerMutation.mutateAsync(data);
      const { token, user } = response;

      await saveAuthToken(token);
      await saveUserId(user.id.toString());

      setAuthState({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          mobile: user.mobile,
          profileImage: user.profileImage,
          createdAt: '',
        },
        userDetails: user,
        isAuthenticated: true,
        isLoading: false,
        token,
      });

      // Refetch user details to ensure we have the latest data
      refetchSelfData();
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
        userDetails: null,
        isAuthenticated: false,
        isLoading: false,
        token: null,
      });
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear local state even if deleteJWT fails
      setAuthState({
        user: null,
        userDetails: null,
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

  const updateUserDetails = (userDetailsData: Partial<UserDetails>): void => {
    setAuthState(prev => ({
      ...prev,
      userDetails: prev.userDetails ? { ...prev.userDetails, ...userDetailsData } : null,
    }));
  };

  const contextValue: AuthContextType = {
    ...authState,
    login,
    loginWithToken,
    register,
    logout,
    updateUser,
    updateUserDetails,
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

export const useUserDetails = (): UserDetails | null => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useUserDetails must be used within an AuthProvider');
  }
  return context.userDetails;
};
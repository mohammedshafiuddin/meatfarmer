import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useRouter, usePathname } from "expo-router";
import queryClient from "@/utils/queryClient";
import { DeviceEventEmitter } from "react-native";
import { FORCE_LOGOUT_EVENT } from "common-ui/src/lib/const-strs";
import { useStaffLogin } from "@/src/api-hooks/staff.api";
import { saveJWT, getJWT, deleteJWT } from "@/hooks/useJWT";

interface Staff {
  id: number;
  name: string;
}

interface StaffAuthContextType {
  isLoggedIn: boolean;
  isLoading: boolean;
  staff: Staff | null;
  login: (name: string, password: string) => Promise<void>;
  logout: () => void;
  isLoggingIn: boolean;
  loginError: string | null;
}

const StaffAuthContext = createContext<StaffAuthContextType | undefined>(undefined);

export const StaffAuthProvider = ({ children }: { children: ReactNode }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [staff, setStaff] = useState<Staff | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);

  const { mutate: loginMutation, isPending: isLoggingIn } = useStaffLogin();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const checkAuth = async () => {
      const token = await getJWT();
      if (token) {
        // TODO: Optionally decode token to get staff info
        setIsLoggedIn(true);
        // For now, assume staff info is not needed beyond login state
      } else {
        setIsLoggedIn(false);
        if (!pathname.includes("login")) {
          router.replace("/login" as any);
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (name: string, password: string) => {
    setLoginError(null);
    loginMutation(
      { name, password },
      {
        onSuccess: async (data) => {
          await saveJWT(data.token);
          setStaff(data.staff);
          setIsLoggedIn(true);
          router.replace("/(drawer)/dashboard");
        },
        onError: (error: any) => {
          setLoginError(error.message || "Login failed");
        },
      }
    );
  };

  const logout = async () => {
    await deleteJWT();
    setIsLoggedIn(false);
    setStaff(null);
    queryClient.clear();
    router.replace("/login" as any);
  };

  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener(FORCE_LOGOUT_EVENT, () => {
      logout();
    });

    return () => {
      subscription.remove();
    };
  }, []);

  return (
    <StaffAuthContext.Provider
      value={{
        isLoggedIn,
        isLoading,
        staff,
        login,
        logout,
        isLoggingIn,
        loginError,
      }}
    >
      {children}
    </StaffAuthContext.Provider>
  );
};

export const useStaffAuth = () => {
  const context = useContext(StaffAuthContext);
  if (!context) {
    throw new Error("useStaffAuth must be used within a StaffAuthProvider");
  }
  return context;
};
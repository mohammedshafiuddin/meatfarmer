// import React, {
//   createContext,
//   useContext,
//   useEffect,
//   useState,
//   ReactNode,
// } from "react";
// import {
//   getJWT,
//   deleteJWT,
//   getRoles,
//   saveJWT,
//   saveRoles,
//   saveUserId,
//   getUserId,
// } from "../../hooks/useJWT";
// import { useFocusEffect, usePathname, useRouter } from "expo-router";
// import queryClient from "@/utils/queryClient";
// import { DeviceEventEmitter } from "react-native";
// import { FORCE_LOGOUT_EVENT, SESSION_EXPIRED_MSG } from "common-ui/src/lib/const-strs";
// import { useLogin, useLogout } from "@/api-hooks/auth.api";
// import {
//   useUserResponsibilities,
//   UserResponsibilities,
// } from "@/api-hooks/user.api";
// import { InfoToast, SuccessToast } from "@/services/toaster";
// import { useNotification } from "@/services/notif-service/notif-context";

// interface LoginFormInputs {
//   login: string;
//   password: string;
//   useUsername?: boolean;
//   expoPushToken?: string | null;
// }

// interface AuthContextType {
//   isLoggedIn: boolean;
//   setIsLoggedIn: (value: boolean) => void;
//   logout: ({
//     isSessionExpired,
//   }: {
//     isSessionExpired?: boolean;
//   }) => Promise<void>;
//   responsibilities: UserResponsibilities | null;
//   responsibilitiesLoading: boolean;
//   responsibilitiesError: Error | null;
//   roles: string[] | null;
//   setRoles: (roles: string[] | null) => void;
//   refreshRoles: () => Promise<void>;
//   loginFunc: (payload: LoginFormInputs) => Promise<void>;
//   userId: number | null;
//   isLoggingIn: boolean;
//   loginError?: string;
// }

// const defaultResponsibilities: UserResponsibilities = {
//   hospitalAdminFor: null,
//   secretaryFor: [],
// };

// export const AuthContext = createContext<AuthContextType | undefined>(
//   undefined
// );

// export const AuthProvider = ({ children }: { children: ReactNode }) => {
//   const { mutate: loginApi, isPending: isLoggingIn, error: loginError } = useLogin();
//   const [isLoggedIn, setIsLoggedIn] = useState(false);
//   const [roles, setRoles] = useState<string[] | null>(null);
//   const [userId, setUserId] = useState<number | null>(null);

//   const refreshRoles = async () => {
//     const r = await getRoles();
//     setRoles(r);
//   };

  

//   useEffect(() => {
//     refreshRoles();
//   }, []);
//   const { mutate: logoutApi } = useLogout();
//   const router = useRouter();
//   const [responsibilitiesError, setResponsibilitiesError] =
//     useState<Error | null>(null);

//   const {
//     data: responsibilities,
//     isLoading: responsibilitiesLoading,
//     isFetching: responsibilitiesFetching,
//     refetch: refetchResponsibilities,
//     error: queryError,
//   } = useUserResponsibilities(userId);
  

//   React.useEffect(() => {
//     (async () => {
//       const token = await getJWT();

//       setIsLoggedIn(!!token);
//       if (!token) {
//         if (!pathname.includes("login")) {
//           router.replace("/login" as any);
//         }
//       } else {
//         refetchResponsibilities();
//         router.replace("/(drawer)/dashboard");
//         const userId = await getUserId();
//         setUserId(userId ? parseInt(userId) : null);
//       }
//     })();
//   }, []);

//   const pathname = usePathname();


//   const logout = async ({
//     isSessionExpired,
//   }: {
//     isSessionExpired?: boolean;
//   }) => {

//     const pageConditon =
//       pathname.includes("/login") ||
//       pathname.includes("/signup") ||
//       pathname === "/";

//     if (!isSessionExpired) {
//       logoutApi({} as any, {
//         onSuccess: () => {},
//         onSettled: () => {
          
//           if (!pageConditon) {
//             router.replace({
//               pathname: "/login" as any,
//               params: isSessionExpired ? { message: SESSION_EXPIRED_MSG } : {},
//             });
//           }
//           deleteJWT();
//         },
//       });
//       setIsLoggedIn(false);
//     } else {
//       deleteJWT();
//       setIsLoggedIn(false);
//       InfoToast("Session expired. Please log in again.");
//       if (!pageConditon) {
//         router.replace({
//           pathname: "/login" as any,
//           params: { message: SESSION_EXPIRED_MSG },
//         });
//       }
//     }
//     queryClient.clear();
//   };

//   const loginFunc = async (data: LoginFormInputs) => {
//     loginApi(data, {
//       onSuccess: async (result) => {

//         // refetchUserId();
//         // await refetchUserData();

//         await saveUserId(result.user.id.toString());
//         setUserId(result.user.id);

//         await saveJWT(result.token);
        
//         // Update login state in auth context
//         setIsLoggedIn(true);

//         // Handle roles if available
//         if (result.user.roles) {
//           await saveRoles(result.user.roles);
//           await refreshRoles();
//         }
//         await refetchResponsibilities();

//         // Clear the 'message' search param from the URL after login
//         router.replace({
//           pathname: "/(drawer)/dashboard",
//           params: {},
//         });
//       },
//       onError: (e: any) => {
//         // setError("login", {
//         //   type: "manual",
//         //   message: e.message || "Login failed",
//         // });
//       },
//     });
//   };

//   React.useEffect(() => {
//     const subscription = DeviceEventEmitter.addListener(
//       FORCE_LOGOUT_EVENT,
//       () => {
//         logout({ isSessionExpired: true });
//       }
//     );

//     return () => {
//       subscription.remove();
//     };
//   }, []);
  

//   return (
//     <AuthContext.Provider
//       value={{
//         isLoggedIn,
//         setIsLoggedIn,
//         logout,
//         responsibilities: responsibilities || defaultResponsibilities,
//         responsibilitiesLoading,
//         responsibilitiesError,
//         roles,
//         setRoles,
//         refreshRoles,
//         loginFunc,
//         userId,
//         isLoggingIn,
//         loginError: loginError?.message
//       }}
//     >
//       {children}
//     </AuthContext.Provider>
//   );
// };

// export const useAuth = () => {
//   const context = useContext(AuthContext);
//   if (!context) {
//     throw new Error("useAuth must be used within an AuthProvider");
//   }
//   return context;
// };

// /**
//  * Hook to check if the current user is a hospital admin
//  * @param hospitalId Hospital ID to check against
//  * @returns Boolean indicating if user is admin for that hospital
//  */
// export const useIsHospitalAdmin = (hospitalId?: number | string): boolean => {
//   const { responsibilities } = useAuth();

//   // If no hospitalId provided, return false
//   if (hospitalId === undefined) {
//     return false;
//   }

//   // Check if user is admin for the specified hospital
//   return responsibilities?.hospitalAdminFor === hospitalId;
// };

// /**
//  * Hook to check if the current user is a secretary for a specific doctor
//  * @param doctorId Doctor ID to check against
//  * @returns Boolean indicating if user is a secretary for that doctor
//  */
// export const useIsDoctorSecretary = (doctorId?: number): boolean => {
//   const { responsibilities } = useAuth();

//   // If no doctorId provided, return false
//   if (doctorId === undefined) {
//     return false;
//   }

//   // Check if user is a secretary for the specified doctor
//   return responsibilities?.secretaryFor?.includes(doctorId) || false;
// };

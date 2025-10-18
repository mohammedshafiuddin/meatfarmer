import React from 'react'
import { View, ActivityIndicator } from 'react-native'
import { tw , MyText , ROLE_NAMES } from "common-ui";
import DoctorDashboard from '@/components/doctor-dashboard'
import { useThemeColor } from '@/hooks/useThemeColor'
import { ThemedView } from '@/components/ThemedView'
import { useRoles } from '@/components/context/roles-context'
import useHideDrawerHeader from '@/hooks/useHideDrawerHeader'
import HospitalAdminDashboard from '@/components/hospital-admin-dashboard'
import { useAuth } from '@/components/context/auth-context'
import { useGetUserById } from '@/api-hooks/user.api'

function Index() {
    const roles = useRoles()
    const { userId } = useAuth()
    const { data: user, isLoading: isUserLoading } = useGetUserById(userId)
    
    const accentColor = useThemeColor({ light: '#4f46e5', dark: '#818cf8' }, 'tint')
    
    // Use the hook to hide the drawer header if needed
    
    // If roles or user data are still loading, show a loading indicator
    if (!roles || isUserLoading) {
        return (
            <ThemedView style={tw`flex-1 justify-center items-center`}>
                <ActivityIndicator size="large" color={accentColor} />
                <MyText style={tw`mt-4`}>Loading dashboard...</MyText>
            </ThemedView>
        )
    }

    // Logic to determine which dashboard to show based on roles
    if (roles.includes(ROLE_NAMES.HOSPITAL_ADMIN)) {
        return <HospitalAdminDashboard />
    } else if (roles.includes(ROLE_NAMES.DOCTOR)) {
        return <DoctorDashboard />
    } else if (roles.includes(ROLE_NAMES.DOCTOR_SECRETARY)) {
        // TODO: Add SecretaryDashboard component
        return (
            <ThemedView style={tw`flex-1 justify-center items-center`}>
                <MyText style={tw`text-xl font-semibold`}>Secretary Dashboard</MyText>
                <MyText style={tw`mt-2`}>Coming soon...</MyText>
            </ThemedView>
        )
    }
}

export default Index

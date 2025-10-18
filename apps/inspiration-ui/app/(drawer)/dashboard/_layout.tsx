import { Stack } from 'expo-router'
import React, { useEffect } from 'react'
import { useAuth } from '@/components/context/auth-context'

function DashboardLayout() {
    const { isLoggedIn, responsibilities } = useAuth();
    
    return (
        <Stack screenOptions={{ headerShown: false }} />
    )
}

export default DashboardLayout

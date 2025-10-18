import { Stack } from 'expo-router'
import React from 'react'

interface Props {}

function _layout(props: Props) {
    const {} = props

    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name='index' />
            <Stack.Screen name='edit' />
        </Stack>
    )
}

export default _layout

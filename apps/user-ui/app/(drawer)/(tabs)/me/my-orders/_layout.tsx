import { Stack } from 'expo-router'

function MyOrdersLayout() {
    return (
        <Stack screenOptions={{ headerShown: true, title: "My Orders" }}>
            <Stack.Screen name="[id]" options={{ headerShown: true, title: "Order Details" }} />
        </Stack>
    )
}

export default MyOrdersLayout
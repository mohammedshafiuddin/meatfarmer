import { Stack } from 'expo-router'

function MyOrdersLayout() {
    return (
        <Stack screenOptions={{ headerShown: false, title: "My Orders" }}>
            <Stack.Screen name="[id]" options={{ title: "Order Details" }} />
        </Stack>
    )
}

export default MyOrdersLayout
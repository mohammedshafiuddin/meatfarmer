import { Stack } from 'expo-router'

function MyOrdersLayout() {
    return (
        <Stack screenOptions={{ headerShown: false, title: "My Orders" }} />
    )
}

export default MyOrdersLayout
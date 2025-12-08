import { Stack } from 'expo-router'

function AboutLayout() {
    return (
        <Stack screenOptions={{ headerShown: true, title: "About" }} />
    )
}

export default AboutLayout
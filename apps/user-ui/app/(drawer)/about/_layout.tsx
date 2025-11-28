import { Stack } from 'expo-router'

function AboutLayout() {
    return (
        <Stack screenOptions={{ headerShown: false, title: "About" }} />
    )
}

export default AboutLayout
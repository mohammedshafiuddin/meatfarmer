import { Stack } from 'expo-router'

function EditProfileLayout() {
    return (
    <Stack screenOptions={{ headerShown: true }}>
      <Stack.Screen name="index" options={{ title: 'Edit Profile' }} />
    </Stack>
    )
}

export default EditProfileLayout
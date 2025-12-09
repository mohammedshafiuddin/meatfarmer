import { Stack } from 'expo-router';

export default function SearchResultsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        title: "Search Results",
      }}
    />
  );
}
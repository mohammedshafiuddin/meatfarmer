import { Redirect } from 'expo-router';

export default function HospitalDetailsRedirect() {
  // Redirect to the my-hospital index page
  return <Redirect href="/(drawer)/my-hospital" />;
}

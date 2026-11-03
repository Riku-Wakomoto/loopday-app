import { Redirect } from 'expo-router';
import { useAppState } from '../state/AppState';

export default function Index() {
  const { profile } = useAppState();
  return <Redirect href={profile ? '/rooms' : '/onboarding'} />;
}

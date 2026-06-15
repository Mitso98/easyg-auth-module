import { LogOut } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/Button';
import styles from './AppPage.module.css';

export function AppPage() {
  const { signOut } = useAuth();

  return (
    <main className={styles.page}>
      <h1>Welcome to the application.</h1>
      <Button variant="ghost" onClick={() => void signOut()}>
        <LogOut size={18} aria-hidden="true" /> Sign out
      </Button>
    </main>
  );
}

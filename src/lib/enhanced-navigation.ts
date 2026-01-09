// 增强导航功能
import { useRouter } from 'next/navigation';

export const useEnhancedNavigation = () => {
  const router = useRouter();

  const navigateToEnhancedHome = () => {
    router.push('/enhanced-home');
  };

  const navigateToLibrary = () => {
    router.push('/library');
  };

  const navigateToEnhancedEditor = () => {
    router.push('/enhanced-editor');
  };

  const navigateToDataPersistenceDemo = () => {
    router.push('/data-persistence-demo');
  };

  const navigateToOriginalHome = () => {
    router.push('/');
  };

  const navigateToOriginalEditor = () => {
    router.push('/game-editor');
  };

  return {
    navigateToEnhancedHome,
    navigateToLibrary,
    navigateToEnhancedEditor,
    navigateToDataPersistenceDemo,
    navigateToOriginalHome,
    navigateToOriginalEditor
  };
};
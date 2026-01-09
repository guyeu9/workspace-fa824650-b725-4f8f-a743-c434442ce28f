// 导航功能

export const useAppNavigation = () => {
  const navigateToValidator = () => {
    window.location.href = '/validator';
  };

  const navigateToGameEditor = () => {
    window.location.href = '/game-editor';
  };

  return {
    navigateToValidator,
    navigateToGameEditor
  };
};

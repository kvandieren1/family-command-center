// Utility functions for managing household data in localStorage

export const getHouseholdData = () => {
  const stored = localStorage.getItem('householdData');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error('Error parsing household data:', e);
      return null;
    }
  }
  return null;
};

export const saveHouseholdData = (data) => {
  try {
    localStorage.setItem('householdData', JSON.stringify(data));
    return true;
  } catch (e) {
    console.error('Error saving household data:', e);
    return false;
  }
};

export const isOnboardingComplete = () => {
  return localStorage.getItem('onboardingComplete') === 'true';
};

export const resetOnboarding = () => {
  localStorage.removeItem('onboardingComplete');
  localStorage.removeItem('householdData');
};

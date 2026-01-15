
/**
 * OAuth Service - Enterprise AI V7
 * Google Login is gedeactiveerd ten gunste van directe API Key toegang.
 */

export const initiateOAuth = async (provider: 'google'): Promise<any> => {
  console.warn("OAuth via frontend is gedeactiveerd. Gebruik Settings voor API-integraties.");
  return Promise.reject(new Error("Gebruik de directe API Key configuratie in Settings."));
};

export const getRedirectUri = () => {
  return window.location.origin + '/';
};

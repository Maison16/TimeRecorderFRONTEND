export const msalConfig = {
  auth: {
    clientId: '0a3b5598-f6e6-4732-8d5a-32890df2952d',
    authority: 'https://login.microsoftonline.com/c2a90a0c-eea6-43ab-acf1-bab1bec0c26e',
    redirectUri: 'https://localhost:5173', 
    postLogoutRedirectUri: 'https://localhost:5173', 
  },
  cache: {
    cacheLocation: 'localStorage',
    storeAuthStateInCookie: false,
  },
}

export const loginRequest = {
  scopes: ['api://8b8a49ef-3242-4695-985d-9a7eb39071ae/.default'], 
}

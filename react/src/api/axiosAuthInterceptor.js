import instance from './axios';

function isProtectedUrl(url) {
  if (!url) {
    return false;
  }

  var hasApiPrefix = url.indexOf('/api/') === 0;
  if (!hasApiPrefix) {
    return false;
  }

  var isLogin = url.indexOf('/api/auth/login') === 0;
  var isRegister = url.indexOf('/api/auth/register') === 0;

  if (isLogin || isRegister) {
    return false;
  }

  return true;
}

instance.interceptors.request.use(
  function attachAuthToken(config) {
    try {
      var url = config.url || '';
      var shouldAttach = isProtectedUrl(url);

      if (shouldAttach && typeof window !== 'undefined' && window.localStorage) {
        var token = window.localStorage.getItem('authToken');
        if (token) {
          if (!config.headers) {
            config.headers = {};
          }
          config.headers.Authorization = 'Token ' + token;
        }
      }
    } catch (error) {
      // Silent catch to avoid breaking requests due to localStorage issues
    }

    return config;
  },
  function onRequestError(error) {
    return Promise.reject(error);
  }
);

export default instance;

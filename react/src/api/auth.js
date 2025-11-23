import instance from './axios';

export async function register(payload) {
  const body = {
    username: payload.username,
    password: payload.password,
  };

  const response = await instance.post('/api/auth/register', body);
  return response.data;
}

export async function login(payload) {
  const body = {
    username: payload.username,
    password: payload.password,
  };

  const response = await instance.post('/api/auth/login', body);
  return response.data;
}

export async function logout() {
  const response = await instance.post('/api/auth/logout');
  return response.data || null;
}

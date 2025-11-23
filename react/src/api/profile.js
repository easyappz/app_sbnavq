import instance from './axios';

export async function getProfile() {
  const response = await instance.get('/api/profile');
  return response.data;
}

export async function updateProfile(payload) {
  const body = {};

  if (typeof payload.username === 'string') {
    body.username = payload.username;
  }

  const response = await instance.put('/api/profile', body);
  return response.data;
}

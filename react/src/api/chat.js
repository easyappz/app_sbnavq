import instance from './axios';

export async function getMessages() {
  const response = await instance.get('/api/chat/messages');
  return response.data;
}

export async function sendMessage(payload) {
  const body = {
    text: payload.text,
  };

  const response = await instance.post('/api/chat/messages', body);
  return response.data;
}

import client from './client.js';

export const getMe   = ()     => client.request('/api/users/me');
export const updateMe = (data) => client.request('/api/users/me', {
  method: 'PATCH',
  body: JSON.stringify(data),
});

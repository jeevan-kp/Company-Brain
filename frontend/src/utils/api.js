import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const setPersonaHeader = (persona) => {
  if (persona) {
    api.defaults.headers.common['X-Persona'] = persona;
  } else {
    delete api.defaults.headers.common['X-Persona'];
  }
};

export default api;

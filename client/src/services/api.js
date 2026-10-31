import axios from 'axios';
const api = axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL || '/api', timeout: 120000 });
export const createCase = async (payload) => (await api.post('/cases', payload)).data;
export const getCase = async (id) => (await api.get(`/cases/${id}`)).data;
export const discoverClue = async (id, clueId) => (await api.post(`/cases/${id}/clues/${clueId}/discover`)).data;
export const requestHint = async (id) => (await api.post(`/cases/${id}/hints`)).data;
export const accuse = async (id, suspectId) => (await api.post(`/cases/${id}/accuse`, { suspectId })).data;
export const getResult = async (id) => (await api.get(`/cases/${id}/result`)).data;

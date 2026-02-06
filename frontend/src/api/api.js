import axios from 'axios';

const API_BASE = 'http://localhost:3003/api';

export const fetchContacts = () => axios.get(`${API_BASE}/contacts`);
export const fetchGroups = () => axios.get(`${API_BASE}/groups`);
export const sendMessage = (data) => axios.post(`${API_BASE}/send-message`, data);
export const sendBulk = (data) => axios.post(`${API_BASE}/send-bulk`, data);
export const sendGroup = (data) => axios.post(`${API_BASE}/send-group`, data);

export const getAppPicInfo = (appId) => axios.get(`${API_BASE}/pic-management/${appId}`);
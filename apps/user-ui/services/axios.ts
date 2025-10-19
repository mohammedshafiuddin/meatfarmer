import axiosParent from 'common-ui/src/services/axios';
import { getAuthToken, deleteAuthToken } from '../hooks/useJWT';
import { DeviceEventEmitter } from 'react-native';
import { FORCE_LOGOUT_EVENT } from 'common-ui/src/lib/const-strs';

const axios = axiosParent;

// Add JWT token to requests
axios.interceptors.request.use(
  async (config) => {
    const token = await getAuthToken();

    if (token) {
      config.headers = config.headers || {};
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle 401 responses by logging out
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      // Clear token and emit logout event
      deleteAuthToken();
      DeviceEventEmitter.emit(FORCE_LOGOUT_EVENT);
    }
    return Promise.reject(error);
  }
);

export default axios;
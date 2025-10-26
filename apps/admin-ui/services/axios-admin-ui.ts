import axiosParent from 'axios';
import { FORCE_LOGOUT_EVENT } from 'common-ui/src/lib/const-strs';
import { DeviceEventEmitter } from 'react-native'
import { getJWT } from '@/hooks/useJWT';
import { BASE_API_URL } from 'common-ui';

// export const API_BASE_URL = 'http://192.168.100.95:4000'; // Change to your API base URL
// const API_BASE_URL = 'https://www.technocracy.ovh/mf'; // Change to your API base URL
// const API_BASE_URL = 'http://10.195.26.42:4000'; // Change to your API base URL
// const API_BASE_URL = 'http://localhost:4000/api/mobile/'; // Change to your API base URL
// const API_BASE_URL = 'https://car-safar.com/api/mobile/'; // Change to your API base URL

const axios = axiosParent.create({
  baseURL: BASE_API_URL + '/api/v1',
  timeout: 60000,
  // headers: {
  //   'Content-Type': 'application/json',
  // },
});


axios.interceptors.request.use(
  async (config) => {
    const token = await getJWT();
    
    if (token) {
      config.headers = config.headers || {};
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

axios.interceptors.response.use(
  (response) => response,
  (error) => {

    const status = error?.status;
    const msg = error.response?.data?.error;

    if (status === 401 && msg.startsWith('Access denied')) {
      // Handle unauthorized access
      DeviceEventEmitter.emit(FORCE_LOGOUT_EVENT);
    }
    const message = error?.response?.data?.error;
    
    if (msg) {
      // Optionally, you can attach the message to the error object or throw a new error
      const err = new Error(msg);
      // Optionally attach the original error for debugging
      (err as any).original = error;
      return Promise.reject(err);
    }
    return Promise.reject(error);
  }
);

export default axios;

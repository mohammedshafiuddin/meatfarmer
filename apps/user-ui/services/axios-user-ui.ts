import axiosParent from 'axios';

export const API_BASE_URL = 'http://192.168.100.95:4000'; // Change to your API base URL
// const API_BASE_URL = 'https://www.technocracy.ovh/mf'; // Change to your API base URL
// const API_BASE_URL = 'http://10.195.26.42:4000'; // Change to your API base URL
// const API_BASE_URL = 'http://localhost:4000/api/mobile/'; // Change to your API base URL
// const API_BASE_URL = 'https://car-safar.com/api/mobile/'; // Change to your API base URL

const axios = axiosParent.create({
  baseURL: API_BASE_URL + '/api/v1',
  timeout: 60000,
  // headers: {
  //   'Content-Type': 'application/json',
  // },
});

export default axios;
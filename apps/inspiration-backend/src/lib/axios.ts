import axiosParent from "axios";
import { phonePeBaseUrl } from "./env-exporter";

export const phonepeAxios = axiosParent.create({
  baseURL: phonePeBaseUrl,
  timeout: 40000,
  headers: {
    "Content-Type": "application/x-www-form-urlencoded",
  },
});

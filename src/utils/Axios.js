import axios from "axios";
import { getUserData } from "../auth/UserContext";

const axiosInstance = axios.create({
    baseURL: "http://localhost:8000/api",
});

axiosInstance.interceptors.request.use((config) => {
    const userData = getUserData();
    const token = userData?.token;

    if (token) {
        config.headers = config.headers ?? {};
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

export default axiosInstance;
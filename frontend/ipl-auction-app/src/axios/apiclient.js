import axios from "axios";
import interceptor from "./axiosInterceptor";

const axiosClient = axios.create(
    {
        baseURL: VITE_BASE_URL,
        withCredentials: true,
        headers: {
            "Content-Type": "application/json"
        }
    }
)

interceptor(axiosClient);

export default axiosClient;

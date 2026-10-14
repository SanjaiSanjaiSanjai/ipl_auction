import axios from "axios";
import interceptor from "./axiosInterceptor";

const axiosClient = axios.create(
    {
        baseURL: "http://localhost:4000",
        withCredentials: true,
        headers: {
            "Content-Type": "application/json"
        }
    }
)

interceptor(axiosClient);

export default axiosClient;
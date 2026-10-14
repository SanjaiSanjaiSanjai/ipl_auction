import { getLocalStorage, removeLocalStorage, setLocalstorage } from "../service/storage/localstorage";

const interceptor = (axiosInstance) => {
    const ACCESS_TOKEN_KEY = import.meta.env.VITE_ACCESS_TOKEN_KEY;
    if (!ACCESS_TOKEN_KEY || ACCESS_TOKEN_KEY === undefined) {
        console.error("ACCESS_TOKEN_KEY is undefined. Make sure VITE_ACCESS_TOKEN_KEY is set in .env file");
        return;
    }

    axiosInstance.interceptors.request.use(
        (config) => {
            const access_token = getLocalStorage(ACCESS_TOKEN_KEY);
            if (access_token) {
                config.headers.Authorization = `Bearer ${access_token}`;
            }
            return config;
        },
        (error) => {
            return Promise.reject(error);
        }
    )

    let isRefreshing = false;
    let failedRequestsQueue = [];

    const processQueue = (error, accesstoken) => {
        failedRequestsQueue.forEach((promise) => {
            if (error) {
                promise.reject(error);
            } else {
                promise.resolve(accesstoken);
            }
        })
        failedRequestsQueue = [];
    }

    axiosInstance.interceptors.response.use(
        (response) => {
            return response;
        },
        async (error) => {
            const originalRequest = error.config;

            if (error.response?.status !== 401) {
                return Promise.reject(error);
            }

            if (originalRequest.url.includes('/v1/api/token')) {
                removeLocalStorage(ACCESS_TOKEN_KEY);
                return Promise.reject(error);
            }

            if (originalRequest._retry) {
                removeLocalStorage(ACCESS_TOKEN_KEY);
                return Promise.reject(error);
            }
            originalRequest._retry = true;
            removeLocalStorage(ACCESS_TOKEN_KEY);

            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedRequestsQueue.push({ resolve, reject });
                }).then((accesstoken) => {
                    originalRequest.headers["Authorization"] = `Bearer ${accesstoken}`;
                    return axiosInstance.request(originalRequest); // if it is not working try this => return axiosInstance(originalRequest);
                })
            }

            isRefreshing = true;
            try {
                const response = await axiosInstance.post("/v1/api/token"); // BUG FIX: must await the token refresh call
                const newAccessToken = response.data.access_token || response.data.accessToken;
                if (!newAccessToken) { throw new Error("Refresh API did not return a new access token."); }
                removeLocalStorage(ACCESS_TOKEN_KEY);
                setLocalstorage(ACCESS_TOKEN_KEY, newAccessToken);
                processQueue(null, newAccessToken);
                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                return axiosInstance(originalRequest); // BUG FIX: axiosClient was undefined here; use axiosInstance
            } catch (refreshError) {
                removeLocalStorage(ACCESS_TOKEN_KEY);
                processQueue(refreshError, null);
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }
    )
}

export default interceptor;
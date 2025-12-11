import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  AxiosError,
} from "axios";

// 1️⃣ Tạo axios instance với config mặc định
const apiClient: AxiosInstance = axios.create({
  baseURL: process.env.API_BASE_URL || "http://localhost:3001",
  timeout: 10000, // 10s
  headers: {
    "Content-Type": "application/json",
  },
});

// 2️⃣ Interceptor: Request logger
apiClient.interceptors.request.use(
  (config) => {
    console.log("📤 [Request]");
    console.log(`URL: ${config.baseURL ?? ""}${config.url ?? ""}`);
    console.log("Method:", config.method?.toUpperCase());
    console.log("Params:", config.params || {});
    console.log("Headers:", config.headers || {});
    console.log("Data:", config.data || {});
    return config;
  },
  (error) => {
    console.error("❌ Request Error:", error.message);
    return Promise.reject(error);
  }
);

// 3️⃣ Interceptor: Response + Error logger
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    console.log("📥 [Response]", {
      status: response.status,
      url: response.config.url,
    });
    return response;
  },
  (error: AxiosError) => {
    if (error.response) {
      console.error("❌ [Backend Error]", {
        url: error.config?.url,
        status: error.response.status,
        data: error.response.data,
      });
    } else if (error.request) {
      console.error("⚠️ [No Response]", error.message);
    } else {
      console.error("💥 [Config Error]", error.message);
    }
    return Promise.reject(error);
  }
);

// 4️⃣ Các hàm tiện ích (GET, POST, PUT, DELETE)
// 🧩 Merge thêm config từ caller
export async function apiClientGet<T = any>(
  path: string,
  config?: AxiosRequestConfig
): Promise<AxiosResponse<T>> {
  return await apiClient.get<T>(path, { ...config });
}

export async function apiClientPost<T = any>(
  path: string,
  data?: any,
  config?: AxiosRequestConfig
): Promise<AxiosResponse<T>> {
  return await apiClient.post<T>(path, data, { ...config });
}

export async function apiClientPut<T = any>(
  path: string,
  data?: any,
  config?: AxiosRequestConfig
): Promise<AxiosResponse<T>> {
  return await apiClient.put<T>(path, data, { ...config });
}

export async function apiClientDelete<T = any>(
  path: string,
  config?: AxiosRequestConfig
): Promise<AxiosResponse<T>> {
  return await apiClient.delete<T>(path, { ...config });
}

// 5️⃣ Export mặc định nếu cần dùng raw axios instance
export default apiClient;

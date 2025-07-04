// src/api.js
import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api",
});

// Automatically add token to headers
API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

// Auth APIs
export const signup = (formData) => API.post("/auth/signup", formData);
export const login = (credentials) => API.post("/auth/login", credentials);

// Space APIs
export const createSpace = (data) => API.post("/spaces/create", data);
export const getMySpaces = () => API.get("/spaces/myspace");
export const getSpaceById = (id) => API.get(`/spaces/${id}`);
export const updateSpace = (id, data) => API.put(`/spaces/update/${id}`, data);

// User APIs
export const getUser = () => API.get("/auth/user");



export default API;

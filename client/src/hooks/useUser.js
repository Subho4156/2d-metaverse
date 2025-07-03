import { useEffect, useState } from 'react';
import axios from 'axios';

export default function useUser() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    axios.get("http://localhost:5000/api/auth/user", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    .then(res => setUser(res.data))
    .catch(() => console.log("Failed to fetch user"))
    .finally(() => setLoading(false));
  }, []);

  return { user, loading };
}

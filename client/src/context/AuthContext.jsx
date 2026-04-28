// import { useState, useEffect, createContext } from "react";
// import axios from "axios";
// import toast from "react-hot-toast";
// import { io } from "socket.io-client";

// const backendUrl = import.meta.env.VITE_BACKEND_URL;
// axios.defaults.baseURL = backendUrl;

// export const AuthContext = createContext();

// export const AuthProvider = ({ children }) => {

//     const [token, setToken] = useState(localStorage.getItem("token"));
//     const [authUser, setAuthUser] = useState(null);
//     const [onlineUser, setOnlineUser] = useState([]);
//     const [socket, setSocket] = useState(null);

//     // Check authentication
//     const checkAuth = async () => {
//         try {
//             const { data } = await axios.get("/api/auth/check");
//             if (data.success) {
//                 setAuthUser(data.user);
//                 connectSocket(data.user);
//             }
//         } catch (error) {
//             toast.error(error.message);
//         }
//     };

//     // Login
//     const login = async (state, credentials) => {
//         try {
//             const { data } = await axios.post(`/api/auth/${state}`, credentials);

//             if (data.success) {
//                 setAuthUser(data.userData);
//                 setToken(data.token);
//                 localStorage.setItem("token", data.token);

//                 axios.defaults.headers.common["token"] = data.token;

//                 connectSocket(data.userData);

//                 toast.success(data.message);
//             } else {
//                 toast.error(data.message);
//             }

//         } catch (error) {
//             toast.error(error.message);
//         }
//     };

//     // Logout
//     const logout = () => {
//         localStorage.removeItem("token");
//         setToken(null);
//         setAuthUser(null);
//         setOnlineUser([]);

//         axios.defaults.headers.common["token"] = null;

//         socket?.disconnect();

//         toast.success("Logout successfully");
//     };

//     // Update Profile
//     const updateProfile = async (body) => {
//         try {
//             const { data } = await axios.put("/api/auth/update-profile", body);

//             if (data.success) {
//                 setAuthUser(data.user);
//                 toast.success("Profile updated successfully");
//             }
//         } catch (error) {
//             toast.error(error.message);
//         }
//     };

//     // Connect Socket
//     const connectSocket = (userData) => {
//         if (!userData || socket?.connected) return;

//         const newSocket = io(backendUrl, {
//             query: {
//                 userId: userData._id,
//             }
//         });

//         newSocket.connect();
//         setSocket(newSocket);

//         newSocket.on("getOnlineUsers", (userIds) => {
//             setOnlineUser(userIds);
//         });
//     };

//     useEffect(() => {
//         if (token) {
//             axios.defaults.headers.common["token"] = token;
//             checkAuth();
//         }
//     }, [token]);

//     const value = {
//         axios,
//         authUser,
//         onlineUser,
//         socket,
//         login,
//         logout,
//         updateProfile
//     };

//     return (
//         <AuthContext.Provider value={value}>
//             {children}
//         </AuthContext.Provider>
//     );
// };

import { useState, useEffect, createContext } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { io } from "socket.io-client";

const backendUrl = import.meta.env.VITE_BACKEND_URL;
axios.defaults.baseURL = backendUrl;

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [authUser, setAuthUser] = useState(null);
  const [onlineUser, setOnlineUser] = useState([]);
  const [socket, setSocket] = useState(null);

  // -------------------------
  // CHECK AUTH (AUTO LOGIN)
  // -------------------------
  const checkAuth = async () => {
    try {
      const { data } = await axios.get("/api/auth/check");

      if (data.success) {
        const user = data.user || data.userData;
        setAuthUser(user);
        connectSocket(user);
      }
    } catch (error) {
      console.log(error.message);
    }
  };

  // -------------------------
  // LOGIN / SIGNUP
  // -------------------------
  const login = async (state, credentials) => {
    try {
      const { data } = await axios.post(`/api/auth/${state}`, credentials);

      if (data.success) {
        const user = data.user || data.userData;

        setAuthUser(user);
        setToken(data.token);

        localStorage.setItem("token", data.token);

        axios.defaults.headers.common["Authorization"] = `Bearer ${data.token}`;

        connectSocket(user);

        toast.success(data.message);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  // -------------------------
  // LOGOUT
  // -------------------------
  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setAuthUser(null);
    setOnlineUser([]);

    axios.defaults.headers.common["Authorization"] = null;

    socket?.disconnect();
    setSocket(null);

    toast.success("Logout successfully");
  };

  // -------------------------
  // UPDATE PROFILE
  // -------------------------
  const updateProfile = async (body) => {
    try {
      const { data } = await axios.put("/api/auth/update-profile", body);

      if (data.success) {
        const user = data.user || data.userData;
        setAuthUser(user);
        toast.success("Profile updated successfully");
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  // -------------------------
  // SOCKET CONNECTION
  // -------------------------
  const connectSocket = (userData) => {
    if (!userData || socket) return;

    const newSocket = io(backendUrl, {
      query: {
        userId: userData._id,
      },
    });

    newSocket.connect();
    setSocket(newSocket);

    newSocket.on("getOnlineUsers", (userIds) => {
      setOnlineUser(userIds);
    });
  };

  // -------------------------
  // AUTO LOGIN ON REFRESH
  // -------------------------
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      checkAuth();
    }
  }, [token]);

  // -------------------------
  // SOCKET CLEANUP
  // -------------------------
  useEffect(() => {
    return () => {
      socket?.disconnect();
    };
  }, [socket]);

  // -------------------------
  // CONTEXT VALUE
  // -------------------------
  const value = {
    axios,
    authUser,
    onlineUser,
    socket,
    login,
    logout,
    updateProfile,
  };

    return <AuthContext.Provider value={value}>
        {children}
    </AuthContext.Provider>;
};
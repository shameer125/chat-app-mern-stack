import React, { useContext } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import ProfilePage from "./pages/ProfilePage";
import { Toaster } from "react-hot-toast";
import { AuthContext } from "./context/AuthContext";
import CallOverlay from "./components/CallOverlay";

const App = () => {
  const { authUser, token } = useContext(AuthContext);

  const hydrating = token && !authUser;

  return (
    <div className="bg-[#0b141a] min-h-screen text-[#e9edef]">
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: "#202c33",
            color: "#e9edef",
            border: "1px solid #2a3942",
          },
        }}
      />
      {hydrating ? (
        <div className="flex items-center justify-center min-h-screen text-[#8696a0] text-sm">
          Loading…
        </div>
      ) : (
        <Routes>
          <Route
            path="/"
            element={authUser ? <HomePage /> : <Navigate to="/login" />}
          />
          <Route
            path="/login"
            element={!authUser ? <LoginPage /> : <Navigate to="/" />}
          />
          <Route
            path="/profile"
            element={authUser ? <ProfilePage /> : <Navigate to="/login" />}
          />
        </Routes>
      )}
      {authUser && <CallOverlay />}
    </div>
  );
};

export default App;

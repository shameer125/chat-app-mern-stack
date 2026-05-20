import React, { useState, useContext } from "react";
import {
  IoChatbubbleEllipsesOutline,
  IoEyeOutline,
  IoEyeOffOutline,
  IoLockClosedOutline,
} from "react-icons/io5";
import { FaArrowLeft, FaCheckCircle } from "react-icons/fa";
import { AuthContext } from "../context/AuthContext";

const LoginPage = () => {
  const [currState, setCurrState] = useState("Sign up");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [bio, setBio] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [step, setStep] = useState(1);
  const [agreed, setAgreed] = useState(false);

  const { login } = useContext(AuthContext);

  const isSignup = currState === "Sign up";

  const onSubmit = (e) => {
    e.preventDefault();
    if (isSignup && step === 1) {
      setStep(2);
      return;
    }
    if (isSignup && !agreed) return;
    login(isSignup ? "signup" : "login", { fullName, email, password, bio });
  };

  return (
    <div className="min-h-screen wa-login-bg flex flex-col">
      {/* Top bar */}
      <div className="h-32 bg-[#00a884] flex items-end justify-center pb-4">
        <div className="flex items-center gap-3 text-white">
          <IoChatbubbleEllipsesOutline className="text-3xl" />
          <h1 className="text-xl font-medium tracking-wide">QUICKCHAT</h1>
        </div>
      </div>

      <div className="flex-1 flex items-start justify-center -mt-16 px-4 pb-10">
        <div
          className="w-full max-w-md bg-[#111b21] rounded-2xl shadow-2xl border 
        border-[#222d34] overflow-hidden"
        >
          <form onSubmit={onSubmit} className="p-8 flex flex-col gap-5">
            <div className="flex items-center gap-3">
              {isSignup && step === 2 && (
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-[#aebac1] hover:text-white p-1"
                >
                  <FaArrowLeft />
                </button>
              )}
              <div>
                <h2 className="text-2xl text-white font-medium">
                  {isSignup
                    ? step === 1
                      ? "Create your account"
                      : "Tell us about yourself"
                    : "Welcome back"}
                </h2>
                <p className="text-sm text-[#8696a0] mt-1">
                  {isSignup
                    ? step === 1
                      ? "Sign up to start chatting securely"
                      : "Add a bio (optional)"
                    : "Login to continue your conversations"}
                </p>
              </div>
            </div>

            {isSignup && step === 1 && (
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                type="text"
                placeholder="Full name"
                required
                className="bg-[#202c33] text-white px-4 py-3 rounded-lg 
                border border-[#2a3942]
                focus:border-[#00a884] transition placeholder-[#8696a0]"
              />
            )}

            {(!isSignup || step === 1) && (
              <>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  placeholder="Email"
                  required
                  className="bg-[#202c33] text-white px-4 py-3 rounded-lg border border-[#2a3942]
                  focus:border-[#00a884] transition placeholder-[#8696a0]"
                />

                <div
                  className="bg-[#202c33] flex items-center rounded-lg border border-[#2a3942]
                 focus-within:border-[#00a884] transition"
                >
                  <input
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    type={showPwd ? "text" : "password"}
                    placeholder="Password"
                    required
                    minLength={6}
                    className="flex-1 bg-transparent text-white px-4 py-3 placeholder-[#8696a0]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd((v) => !v)}
                    className="text-[#8696a0] hover:text-white px-3"
                  >
                    {showPwd ? <IoEyeOffOutline /> : <IoEyeOutline />}
                  </button>
                </div>
              </>
            )}

            {isSignup && step === 2 && (
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={4}
                placeholder="A short bio about yourself..."
                className="bg-[#202c33] text-white px-4 py-3 rounded-lg border border-[#2a3942]
                focus:border-[#00a884] transition placeholder-[#8696a0] resize-none"
              />
            )}

            {isSignup && step === 2 && (
              <label className="flex items-center gap-2 text-xs text-[#aebac1] cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="accent-[#00a884]"
                />
                I agree to the Terms of Service and Privacy Policy
              </label>
            )}

            <button
              type="submit"
              disabled={isSignup && step === 2 && !agreed}
              className="bg-[#00a884] disabled:opacity-50 disabled:cursor-not-allowed
              hover:bg-[#06cf9c] text-white py-3 rounded-lg font-medium transition flex 
              items-center justify-center gap-2"
            >
              {isSignup
                ? step === 1
                  ? "Continue"
                  : "Create account"
                : "Login"}
              {!isSignup && <FaCheckCircle className="text-sm" />}
            </button>

            <div className="text-center text-sm text-[#8696a0]">
              {isSignup ? (
                <>
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setCurrState("Login");
                      setStep(1);
                    }}
                    className="text-[#00a884] hover:underline font-medium"
                  >
                    Login
                  </button>
                </>
              ) : (
                <>
                  Don't have an account?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setCurrState("Sign up");
                      setStep(1);
                    }}
                    className="text-[#00a884] hover:underline font-medium"
                  >
                    Sign up
                  </button>
                </>
              )}
            </div>

            <div
              className="flex items-center gap-2 justify-center text-xs
             text-[#8696a0] pt-2"
            >
              <IoLockClosedOutline />
              Your messages are end-to-end encrypted
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

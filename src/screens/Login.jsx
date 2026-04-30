import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../utils/Axios";
import { saveUserData } from "../auth/UserContext";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please enter both email and password");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post("/auth/login", { email, password });
      const { token, user } = res.data;
      saveUserData(user, token);
      navigate("/admin");
    } catch (err) {
      const errorMsg =
        err.response?.data?.message || "Login failed. Check your credentials.";
      setError(errorMsg);
      console.error(err.response?.data ?? err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-background flex flex-col items-center justify-center px-4 py-8">
      <div className="mb-8 animate-in fade-in slide-in-from-top duration-500">
        <img
          src="https://res.cloudinary.com/dtdix9mey/image/upload/v1777405258/logo_kvfdvg.png"
          alt="CampusLink"
          className="h-12 object-contain rounded-lg"
        />
      </div>

      <div className="w-full max-w-sm bg-primary rounded-2xl shadow-lg border border-surface p-8 animate-in fade-in slide-in-from-bottom-5 duration-500">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-text-primary text-center">
            Welcome Back
          </h1>
          <p className="text-sm text-text-secondary text-center mt-2">
            Sign in to manage your events
          </p>
        </div>
        {error && (
          <div className="mb-6 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 text-sm animate-in fade-in slide-in-from-top duration-300">
            <i className="ri-error-warning-line text-red-600 mt-0.5 shrink-0" />
            <span className="text-red-700">{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@campuslink.com"
              disabled={loading}
              className="w-full px-4 py-2.5 text-sm border border-surface rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition disabled:bg-surface disabled:text-text-secondary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              disabled={loading}
              className="w-full px-4 py-2.5 text-sm border border-surface rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition disabled:bg-surface disabled:text-text-secondary"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full h-10 mt-2 bg-secondary text-black text-sm font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <>
                <i className="ri-loader-4-line animate-spin text-base" />
                Signing in...
              </>
            ) : (
              <>
                <i className="ri-login-box-line" />
                Sign In
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-surface text-center">
          <p className="text-xs text-text-secondary">
            Made with ❤️ by{" "}
            <span className="text-blue-700 font-medium underline">Team Indecisive</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;

import { useState } from "react";
import Navbar from "../components/layout/Navbar.jsx";
import Footer from "../components/layout/Footer.jsx";
import { User } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";

export default function Profile() {
  const { user, profilePic, updateProfile } = useAuth();
  const [username, setUsername] = useState(user.username);
  const [email, setEmail] = useState(user.email);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const dirty =
    username.trim() !== user.username || email.trim() !== user.email;
  const expiryValue = user.subscription_expiry;
  const expiry = expiryValue
    ? new Date(
        /Z$|[+-]\d{2}:\d{2}$/.test(expiryValue)
          ? expiryValue
          : `${expiryValue}Z`,
      )
    : null;
  const tier =
    expiry && expiry < new Date() ? "basic" : user.subscription_tier || "basic";
  async function save(event) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);
    try {
      const updated = await updateProfile({
        username: username.trim(),
        email: email.trim(),
      });
      setUsername(updated.username);
      setEmail(updated.email);
      setSuccess("Your profile has been saved.");
    } catch (err) {
      setError(err.message || "Unable to save. Please retry.");
    } finally {
      setSaving(false);
    }
  }
  return (
    <div className="min-h-screen bg-[#f6f9fb] text-slate-900">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 pt-28 pb-20">
        <header className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-black">
            Profile & Settings
          </h1>
          <p className="text-slate-500 mt-3">
            Keep your account details up to date.
          </p>
        </header>
        <section className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 mb-6 flex items-center gap-5">
          <div className="w-20 h-20 shrink-0 rounded-full bg-blue-50 overflow-hidden grid place-items-center">
            {profilePic ? (
              <img
                src={profilePic}
                alt="Your profile"
                width="80"
                height="80"
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="text-primary" size={32} />
            )}
          </div>
          <div className="min-w-0 break-words">
            <h2 className="text-xl font-bold">{user.username}</h2>
            <p className="text-slate-500">{user.email}</p>
            <p className="mt-2 text-sm capitalize text-primary">
              {tier} plan · {user.role}
            </p>
          </div>
        </section>
        <form
          onSubmit={save}
          className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 space-y-5"
          aria-busy={saving}
        >
          <h2 className="text-xl font-bold">Personal information</h2>
          <div>
            <label
              htmlFor="profile-username"
              className="block font-semibold mb-2"
            >
              Username
            </label>
            <input
              id="profile-username"
              autoComplete="username"
              required
              maxLength={50}
              disabled={saving}
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setSuccess("");
              }}
              className="w-full border border-slate-300 rounded-md p-3"
            />
          </div>
          <div>
            <label htmlFor="profile-email" className="block font-semibold mb-2">
              Email
            </label>
            <input
              id="profile-email"
              autoComplete="email"
              type="email"
              required
              maxLength={254}
              disabled={saving}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setSuccess("");
              }}
              className="w-full border border-slate-300 rounded-md p-3"
            />
          </div>
          {error && (
            <p role="alert" className="text-red-700">
              {error}
            </p>
          )}
          {success && (
            <p role="status" className="text-teal-700">
              {success}
            </p>
          )}
          <button
            type="submit"
            disabled={saving || !dirty}
            className="w-full bg-primary text-white rounded-md py-3 font-bold disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        </form>
        <p className="text-sm text-slate-500 mt-5">
          You can customize your picture and earned rewards from the dashboard.
        </p>
      </main>
      <Footer />
    </div>
  );
}

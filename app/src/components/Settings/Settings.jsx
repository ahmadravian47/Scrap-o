import React, { useState, useEffect } from "react";
import axios from "axios";
import "./Settings.css";

/** Simple labeled input */
function InputField({ label, value, onChange, placeholder, type = "text" }) {
  return (
    <label className="block mb-4">
      <div className="text-sm font-medium text-gray-700 mb-1">{label}</div>
      <input
        className="w-full rounded-md border border-gray-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 px-4 py-2 text-gray-800 placeholder:text-gray-400"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        type={type}
      />
    </label>
  );
}

/** Simple toggle switch */
function Toggle({ value, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={`relative inline-flex h-6 w-11 rounded-full transition-colors duration-200 focus:outline-none border-2 border-transparent ${
        value ? "bg-emerald-600" : "bg-gray-300"
      }`}
    >
      <span
        className={`inline-block h-5 w-5 transform bg-white rounded-full shadow transition duration-200 ${
          value ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

export default function EmailSettings() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [userEmail, setUserEmail] = useState("");

  // SMTP settings
  const [smtpHost, setSmtpHost] = useState("");
  const [smtpPort, setSmtpPort] = useState(587);
  const [smtpSecure, setSmtpSecure] = useState(false);
  const [smtpUser, setSmtpUser] = useState("");
  const [smtpPass, setSmtpPass] = useState("");

  // IMAP settings
  const [imapHost, setImapHost] = useState("");
  const [imapPort, setImapPort] = useState(993);
  const [imapSecure, setImapSecure] = useState(true);
  const [imapUser, setImapUser] = useState("");
  const [imapPass, setImapPass] = useState("");

  const REACT_APP_SERVER_URL = import.meta.env.VITE_SERVER_URL;

  const fetchUserEmail = async () => {
    try {
      const response = await axios.get(`${REACT_APP_SERVER_URL}/userprofile`, {
        withCredentials: true,
      });
      setUserEmail(response.data.email || "");
      return response.data.email;
    } catch (err) {
      setError("Could not fetch user profile.");
      return "";
    }
  };

  const fetchSettings = async (email) => {
    if (!email) return;
    setLoading(true);
    setError("");
    try {
      const res = await axios.get(`${REACT_APP_SERVER_URL}/settings`, {
        params: { email },
        withCredentials: true,
      });

      const s = res.data || {};

      setSmtpHost(s.smtpHost || "");
      setSmtpPort(s.smtpPort || 587);
      setSmtpSecure(Boolean(s.smtpSecure));
      setSmtpUser(s.smtpUser || "");
      setSmtpPass("");

      setImapHost(s.imapHost || "");
      setImapPort(s.imapPort || 993);
      setImapSecure(Boolean(s.imapSecure));
      setImapUser(s.imapUser || "");
      setImapPass("");
    } catch (err) {
      if (err?.response?.status !== 404) {
        setError("Failed to load settings.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      const email = await fetchUserEmail();
      await fetchSettings(email);
    })();
  }, []);

  const onSave = async () => {
    setSaving(true);
    setError("");

    const payload = {
      smtpHost,
      smtpPort: Number(smtpPort),
      smtpSecure,
      smtpUser,
      ...(smtpPass ? { smtpPass } : {}),

      imapHost,
      imapPort: Number(imapPort),
      imapSecure,
      imapUser,
      ...(imapPass ? { imapPass } : {}),
    };

    try {
      await axios.post(`${REACT_APP_SERVER_URL}/settings`, payload, {
        withCredentials: true,
      });
      alert("Settings saved!");
      await fetchSettings(userEmail);
    } catch (err) {
      setError(
        err?.response?.data?.message || "Failed to save settings."
      );
      alert("Failed to save settings.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gray-100 pb-16">
      <div className="px-6 py-12 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-10">
          <h1 className="text-3xl font-extrabold text-gray-900">
            Email Settings
          </h1>

          <div className="flex gap-3">
            <button
              onClick={onSave}
              disabled={saving}
              className="rounded-sm text-white px-6 py-3 font-semibold shadow-sm hover:bg-emerald-700 disabled:opacity-60"
              style={{ backgroundColor: "#010101" }}
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>

        {loading && <p className="text-gray-600">Loading settings…</p>}
        {error && <p className="text-red-600 mb-4">{error}</p>}

        {/* SMTP */}
        <section className="mb-10 p-8 bg-white rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold mb-1">SMTP Settings</h2>
          <p className="text-sm text-gray-500 mb-6">
            Used to send outreach emails from your mailbox.
          </p>

          <InputField
            label="SMTP Host"
            value={smtpHost}
            onChange={setSmtpHost}
            placeholder="smtp.gmail.com"
          />

          <div className="grid grid-cols-2 gap-4">
            <InputField
              label="SMTP Port"
              value={smtpPort}
              onChange={setSmtpPort}
              type="number"
              placeholder="587"
            />
            <div className="mb-4">
              <div className="text-sm font-medium text-gray-700 mb-1">
                Use Secure (SSL/TLS)
              </div>
              <Toggle value={smtpSecure} onChange={setSmtpSecure} />
            </div>
          </div>

          <InputField
            label="SMTP Username"
            value={smtpUser}
            onChange={setSmtpUser}
            placeholder="you@example.com"
          />
          <InputField
            label="SMTP Password"
            value={smtpPass}
            onChange={setSmtpPass}
            placeholder="••••••"
            type="password"
          />
        </section>

        {/* IMAP */}
        <section className="mb-10 p-8 bg-white rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold mb-1">IMAP Settings</h2>
          <p className="text-sm text-gray-500 mb-6">
            Used to read incoming replies for campaigns.
          </p>

          <InputField
            label="IMAP Host"
            value={imapHost}
            onChange={setImapHost}
            placeholder="imap.gmail.com"
          />

          <div className="grid grid-cols-2 gap-4">
            <InputField
              label="IMAP Port"
              value={imapPort}
              onChange={setImapPort}
              type="number"
              placeholder="993"
            />
            <div className="mb-4">
              <div className="text-sm font-medium text-gray-700 mb-1">
                Use Secure (SSL/TLS)
              </div>
              <Toggle value={imapSecure} onChange={setImapSecure} />
            </div>
          </div>

          <InputField
            label="IMAP Username"
            value={imapUser}
            onChange={setImapUser}
            placeholder="you@example.com"
          />
          <InputField
            label="IMAP Password"
            value={imapPass}
            onChange={setImapPass}
            placeholder="••••••"
            type="password"
          />
        </section>

        <div className="flex justify-end gap-4">
          <button
            onClick={() => window.location.reload()}
            className="rounded-sm bg-white text-gray-700 px-6 py-3 font-semibold border border-gray-300 hover:bg-gray-50"
          >
            Reset
          </button>

          <button
            onClick={onSave}
            disabled={saving}
            className="rounded-sm text-white px-6 py-3 font-semibold shadow-sm hover:bg-emerald-700 disabled:opacity-60"
            style={{ backgroundColor: "#010101" }}
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

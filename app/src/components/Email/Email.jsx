import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Mail,
  Pencil,
  Upload,
  Search,
  RotateCw,
  Square,
  ChevronLeft,
  ChevronRight,
  Settings,
  LayoutGrid,
  X,
} from "lucide-react";

// Skeleton Loader
const TicketSkeleton = () => (
  <div className="flex items-start py-3 px-4 border-b animate-pulse">
    <div className="flex items-center pt-1 pr-4">
      <div className="w-5 h-5 bg-gray-300 rounded-full" />
    </div>
    <div className="flex-grow min-w-0 space-y-2">
      <div className="h-4 bg-gray-300 rounded w-1/3"></div>
      <div className="h-3 bg-gray-200 rounded w-1/4"></div>
      <div className="h-3 bg-gray-200 rounded w-3/4 mt-2"></div>
    </div>
  </div>
);

// Row for each sent email
const TicketRow = ({ ticket }) => {
  const opened = !!ticket.openedAt;

  return (
    <div className="flex items-start py-3 px-4 border-b hover:bg-gray-50 transition cursor-pointer">
      <div className="flex items-center pt-1 pr-4">
        <Mail className="w-5 h-5 text-gray-500" />
      </div>

      <div className="flex-grow min-w-0">
        <div className="flex items-center justify-between">
          <div className="flex flex-col sm:flex-row sm:items-baseline sm:space-x-3">
            <p className="font-semibold text-gray-800 truncate">{ticket.to}</p>
            <p className="text-sm text-gray-500 truncate">{ticket.subject}</p>
          </div>

          <div className="flex items-center space-x-2">
            <span
              className={`w-3 h-3 rounded-full ${
                opened ? "bg-green-500" : "bg-gray-400"
              }`}
              title={opened ? "Opened" : "Not Opened"}
            ></span>

            <span className="text-sm text-gray-500 whitespace-nowrap">
              {new Date(ticket.sentAt).toLocaleString()}
            </span>
          </div>
        </div>

        <p className="text-sm text-gray-600 mt-1 truncate">{ticket.body}</p>

       
      </div>
    </div>
  );
};

const Email = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);

  // Compose Modal state
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [receiver, setReceiver] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const REACT_APP_SERVER_URL = import.meta.env.VITE_SERVER_URL;

  // Fetch sent emails
  useEffect(() => {
    const fetchSent = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${REACT_APP_SERVER_URL}/get-sent-emails`, {
          withCredentials: true,
        });
        setTickets(res.data);
      } catch (err) {
        console.error("Failed to fetch emails:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSent();
  }, []);

  // Send email
  const handleSendEmail = async () => {
    if (!receiver || !subject || !body) {
      setError("All fields are required");
      return;
    }

    try {
      setSending(true);
      setError("");
      await axios.post(
        `${REACT_APP_SERVER_URL}/send-email`,
        { to: receiver, subject, body },
        { withCredentials: true }
      );

      alert("Email sent successfully!");
      setIsComposeOpen(false);
      setReceiver("");
      setSubject("");
      setBody("");

      // Refresh list
      const res = await axios.get(`${REACT_APP_SERVER_URL}/get-sent-emails`, {
        withCredentials: true,
      });
      setTickets(res.data);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to send email");
    } finally {
      setSending(false);
    }
  };

  // Header with Compose, Bulk, Search
  const Header = () => (
    <header className="flex items-center justify-between p-4 border-b border-gray-300">
      <h1 className="text-xl font-medium text-gray-800">Sent Emails</h1>
      <div className="flex items-center space-x-4 bg-[#fafafa]">
        <div className="relative hidden md:block bg-[#fafafa]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search"
            className="w-64 py-2 pl-10 pr-4 border rounded-lg text-sm bg-[#fafafa]"
          />
        </div>

        <button
          className="flex items-center border px-3 py-2 rounded-lg text-sm bg-[#fafafa]"
          onClick={() => setIsComposeOpen(true)}
        >
          <Pencil className="w-4 h-4 mr-2" />
          Compose
        </button>

        <label className="flex items-center border px-3 py-2 rounded-lg text-sm bg-[#fafafa] cursor-pointer">
          <Upload className="w-4 h-4 mr-1" /> Send Bulk
          <input type="file" accept=".json,.csv" className="hidden" />
        </label>

        <div className="hidden sm:flex items-center space-x-2 border-l pl-4 text-gray-500">
          <Settings className="w-5 h-5" />
          <LayoutGrid className="w-5 h-5" />
        </div>
      </div>
    </header>
  );

  const SubToolbar = () => (
    <div className="flex items-center justify-between p-4 border-b border-gray-300">
      <div className="flex items-center space-x-4">
        <button className="flex items-center text-sm font-medium text-gray-600">
          <Square className="w-4 h-4 mr-2" />
          Select All
        </button>
        <button className="flex items-center text-sm font-medium text-gray-600">
          <RotateCw className="w-4 h-4 mr-2" />
          Reload
        </button>
      </div>

      <div className="flex items-center space-x-4 text-sm text-gray-600">
        <span className="hidden sm:block">{tickets.length} Sent</span>
        <div className="flex items-center space-x-1">
          <button className="p-1 rounded-md hover:bg-gray-200">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button className="p-1 rounded-md hover:bg-gray-200">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <div className="flex sm:hidden items-center space-x-2 text-gray-500 border-l pl-4">
          <LayoutGrid className="w-5 h-5" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen font-sans text-gray-800">
      <div className="mx-auto w-full max-w-7xl shadow-lg rounded-xl border">
        <Header />
        <SubToolbar />

        <div className="divide-y divide-gray-200">
          {loading
            ? [...Array(5)].map((_, i) => <TicketSkeleton key={i} />)
            : tickets.map((item, i) => <TicketRow key={i} ticket={item} />)}
        </div>
      </div>

      {/* Compose Modal */}
      {isComposeOpen && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
          <div className="bg-white rounded-xl w-180 p-6 relative">
            <button
              className="absolute top-3 right-3"
              onClick={() => setIsComposeOpen(false)}
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-semibold mb-4">Compose Email</h2>

            <input
              type="email"
              placeholder="Recipient"
              value={receiver}
              onChange={(e) => setReceiver(e.target.value)}
              className="w-full mb-3 px-3 py-2 border rounded"
            />

            <input
              type="text"
              placeholder="Subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full mb-3 px-3 py-2 border rounded"
            />

            <textarea
              placeholder="Message"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full mb-3 px-3 py-2 border rounded"
              rows={5}
            />

            {error && <p className="text-red-600 mb-2">{error}</p>}

            <button
              onClick={handleSendEmail}
              disabled={sending}
              className="w-full bg-gray-900 text-white py-2 rounded hover:bg-gray-700 disabled:opacity-60"
            >
              {sending ? "Sending..." : "Send"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Email;

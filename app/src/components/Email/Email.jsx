import React, { useState, useEffect } from "react";
import axios from "axios";
import { Mail, Pencil, Upload, Search, RotateCw, Square, ChevronLeft, ChevronRight, Settings, LayoutGrid, X } from "lucide-react";

// Skeleton for loading
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

const TicketRow = ({ ticket }) => (
  <div className="flex items-start py-3 px-4 border-b hover:bg-gray-50 transition duration-150 cursor-pointer">
    <div className="flex items-center pt-1 pr-4 text-gray-400">
      <Mail className={`w-5 h-5 ${ticket.isRead ? 'text-gray-300' : 'text-gray-600'}`} />
    </div>
    <div className="flex-grow min-w-0">
      <div className="flex items-center justify-between">
        <div className="flex flex-col sm:flex-row sm:items-baseline sm:space-x-3">
          <p className="font-semibold text-gray-800 truncate" style={{ maxWidth: '80vw' }}>{ticket.from}</p>
          <p className="text-sm text-gray-500 truncate">{ticket.to}</p>
        </div>
        <div className="flex-shrink-0 flex items-center space-x-2 text-sm text-gray-500 ml-4">
          <span className="whitespace-nowrap">{new Date(ticket.date).toLocaleString()}</span>
        </div>
      </div>
      <p className="text-sm text-gray-600 mt-1 truncate" style={{ maxWidth: '90vw' }}>
        {ticket.text || ticket.html || ""}
      </p>
    </div>
  </div>
);

const Email = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);

  // Compose modal state
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [receiver, setReceiver] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const REACT_APP_SERVER_URL = import.meta.env.VITE_SERVER_URL;

  useEffect(() => {
    const fetchInbox = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${REACT_APP_SERVER_URL}/get-user-inbox`, { withCredentials: true });
        setTickets(res.data);
        setLoading(false);
      } catch (err) {
        console.error("Failed to fetch inbox:", err);
      }
    };
    fetchInbox();
  }, []);

  const totalCount = tickets.length;
  const isSelected = false;

  // Send email
  const handleSendEmail = async () => {
    if (!receiver || !subject || !body) {
      setError("All fields are required");
      return;
    }
    setSending(true);
    setError("");
    try {
      await axios.post(`${REACT_APP_SERVER_URL}/send-email`, { to: receiver, subject, body }, { withCredentials: true });
      setIsComposeOpen(false);
      setReceiver("");
      setSubject("");
      setBody("");
      alert("Email sent successfully!");
    } catch (err) {
      console.error("Error sending email:", err);
      setError(err?.response?.data?.message || "Failed to send email");
    } finally {
      setSending(false);
    }
  };

  // Header with Compose button and all your existing buttons preserved
  const Header = () => (
    <header className="flex items-center justify-between p-4 border-b border-gray-300">
      <h1 className="text-xl font-medium text-gray-800">Waiting for help</h1>
      <div className="flex items-center space-x-4 bg-[#fafafa]">
        <div className="relative hidden md:block bg-[#fafafa]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search customer email"
            className="w-64 py-2 pl-10 pr-4 border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition bg-[#fafafa]"
          />
        </div>

        <button className="flex items-center border border-gray-300 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 transition bg-[#fafafa]" onClick={() => setIsComposeOpen(true)}>
          <Pencil className="w-4 h-4 mr-2" />
          Compose
        </button>

        <label className="flex items-center border border-gray-300 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 transition bg-[#fafafa] cursor-pointer">
          <Upload className="w-4 h-4 mr-1" /> Send Bulk
          <input type="file" accept=".json,.csv" className="hidden" />
        </label>

        <div className="hidden sm:flex items-center space-x-2 text-gray-500 border-l pl-4">
          <Settings className="w-5 h-5 cursor-pointer hover:text-gray-700" />
          <LayoutGrid className="w-5 h-5 cursor-pointer hover:text-gray-700" />
        </div>
      </div>
    </header>
  );

  // SubToolbar same as before
  const SubToolbar = () => (
    <div className="flex items-center justify-between p-4 border-b border-gray-300">
      <div className="flex items-center space-x-4">
        <button className="flex items-center text-sm font-medium text-gray-600 hover:text-gray-800 transition">
          <Square className={`w-4 h-4 mr-2 ${isSelected ? 'text-blue-500 fill-blue-500' : 'text-gray-400'}`} />
          Select All
        </button>
        <button className="flex items-center text-sm font-medium text-gray-600 hover:text-gray-800 transition">
          <RotateCw className="w-4 h-4 mr-2" />
          Reload
        </button>
      </div>
      <div className="flex items-center space-x-4 text-sm text-gray-600">
        <span className="hidden sm:block">{totalCount} Inbox</span>
        <div className="flex items-center space-x-1">
          <button className="p-1 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed" disabled>
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button className="p-1 rounded-md hover:bg-gray-200">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <div className="flex sm:hidden items-center space-x-2 text-gray-500 border-l pl-4">
          <LayoutGrid className="w-5 h-5 cursor-pointer hover:text-gray-700" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen font-sans antialiased text-gray-800">
      <div className="mx-auto w-full max-w-7xl shadow-lg rounded-xl overflow-hidden border border-gray-200">
        <Header />
        <SubToolbar />
        <div className="divide-y divide-gray-200">
          {loading
            ? Array.from({ length: 5 }).map((_, idx) => <TicketSkeleton key={idx} />)
            : tickets.map((ticket, idx) => <TicketRow key={idx} ticket={ticket} />)}
        </div>
      </div>

      {/* Compose Modal */}
      {isComposeOpen && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
          <div className="bg-white rounded-xl w-96 p-6 relative">
            <button className="absolute top-3 right-3" onClick={() => setIsComposeOpen(false)}>
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
              className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition disabled:opacity-60"
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

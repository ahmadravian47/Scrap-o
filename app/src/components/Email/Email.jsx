import React, { useState } from 'react';
import { Upload, Pencil, Search, ChevronDown, Filter, RotateCw, ChevronLeft, ChevronRight, Mail, LayoutGrid, Settings, Square } from 'lucide-react';

// Mock data for the tickets/emails
const initialTickets = [
  {
    id: 1,
    name: "Emily Clark",
    email: "emily.clark@email.com",
    snippet: "Hello, I noticed that my latest invoice seems incorrect. The amount charged is higher than what I expected. Could you please review it and let me know if there's an...",
    time: "Just now",
    isRead: false,
  },
  {
    id: 2,
    name: "John Doe",
    email: "johndoe123@email.com",
    snippet: "Hi, I've been trying to access the new feature you recently released, but it doesn't seem to be available in my account. Could you let me know if there's anything I ne...",
    time: "2h ago",
    isRead: true,
  },
  {
    id: 3,
    name: "Michael Smith",
    email: "michael.smith@email.com",
    snippet: "Hi, I've encountered an issue with your mobile app. It crashes every time I try to log in. I've already reinstalled it, but the problem persists. Could you help me trouble...",
    time: "3h ago",
    isRead: false,
  },
  {
    id: 4,
    name: "Jessica Brown",
    email: "jessica.brown@email.com",
    snippet: "Hello, I wanted to ask about upgrading my plan. I'm currently on the basic tier, but I'm interested in moving to the premium plan. Could you guide me through the pro...",
    time: "3h ago",
    isRead: false,
  },
];

// Helper Component for a single ticket row
const TicketRow = ({ ticket }) => (
  <div className="flex items-start py-3 px-4 border-b hover:bg-gray-50 transition duration-150 cursor-pointer">

    {/* Mail Icon/Checkbox Area */}
    <div className="flex items-center pt-1 pr-4 text-gray-400">
      <Mail className={`w-5 h-5 ${ticket.isRead ? 'text-gray-300' : 'text-gray-600'}`} />
    </div>

    {/* Content Area */}
    <div className="flex-grow min-w-0">
      <div className="flex items-center justify-between">
        <div className="flex flex-col sm:flex-row sm:items-baseline sm:space-x-3">
          {/* Name and Email */}
          <p className="font-semibold text-gray-800 truncate" style={{ maxWidth: '80vw' }}>{ticket.name}</p>
          <p className="text-sm text-gray-500 truncate">{ticket.email}</p>
        </div>

        {/* Timestamp/Options Area (Right side) */}
        <div className="flex-shrink-0 flex items-center space-x-2 text-sm text-gray-500 ml-4">
          <span className="whitespace-nowrap">{ticket.time}</span>
          {/* Options button mimic, styled like the image */}
          <button className="p-1 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-200 transition">
            {/* Text 'Just now' in the image is next to a small button area. */}
            <span className="text-xs">
              Just now
            </span>
          </button>
        </div>
      </div>

      {/* Snippet */}
      <p className="text-sm text-gray-600 mt-1 truncate" style={{ maxWidth: '90vw' }}>
        {ticket.snippet}
      </p>
    </div>
  </div>
);

// Main Application Component
const App = () => {
  const [tickets, setTickets] = useState(initialTickets);
  const totalCount = tickets.length;
  const isSelected = false; // State for 'Select All' in a real app

  // The Header component
  const Header = () => (
    <header className="flex items-center justify-between" style={{ padding: '0.8rem', borderBottom: '1px solid #cac8c8ff' }}>
      {/* Title */}
      <h1 className="text-xl font-medium text-gray-800">Waiting for help</h1>

      {/* Search and Action Buttons */}
      <div className="flex items-center space-x-4 bg-[#fafafa]">

        {/* Search Bar */}
        <div className="relative hidden md:block bg-[#fafafa]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search customer email"
            className="w-64 py-2 pl-10 pr-4 border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition bg-[#fafafa]"
          />
        </div>

        {/* Action Buttons */}
        <button className="flex items-center border border-gray-300 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 transition bg-[#fafafa]">
          <Pencil className="w-4 h-4 mr-2" />
          Compose

        </button>

        <label className="flex items-center border border-gray-300 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 transition bg-[#fafafa] cursor-pointer">
          <Upload className="w-4 h-4 mr-1" /> Upload
          <input type="file" accept=".json,.csv" className="hidden" />
        </label>


        {/* Settings/View Icons */}
        <div className="hidden sm:flex items-center space-x-2 text-gray-500 border-l pl-4">
          <Settings className="w-5 h-5 cursor-pointer hover:text-gray-700" />
          <LayoutGrid className="w-5 h-5 cursor-pointer hover:text-gray-700" />
        </div>
      </div>
    </header>
  );

  // The Sub-Toolbar component
  const SubToolbar = () => (
    <div className="flex items-center justify-between p-4" style={{borderBottom: '1px solid #cac8c8ff'}}>

      {/* Left Actions: Select All & Reload */}
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

      {/* Right Actions: Count & Pagination */}
      <div className="flex items-center space-x-4 text-sm text-gray-600">
        <span className="hidden sm:block">
          {totalCount} Inbox
        </span>

        {/* Pagination Controls */}
        <div className="flex items-center space-x-1">
          <button
            className="p-1 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={true} // Mimic first page being disabled
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            className="p-1 rounded-md hover:bg-gray-200"
            disabled={false}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* View Toggle Icons (Moved from main header to here for better responsiveness) */}
        <div className="flex sm:hidden items-center space-x-2 text-gray-500 border-l pl-4">
          <LayoutGrid className="w-5 h-5 cursor-pointer hover:text-gray-700" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen font-sans antialiased text-gray-800">

      {/* Main Container Card (Optional, but helps center the view) */}
      <div className="mx-auto w-full max-w-7xl shadow-lg rounded-xl overflow-hidden border border-gray-200">

        <Header />

        <SubToolbar />

        {/* Ticket List */}
        <div className="divide-y divide-gray-200">
          {tickets.map(ticket => (
            <TicketRow key={ticket.id} ticket={ticket} />
          ))}
        </div>

        {/* Footer/Empty Space */}
        <div className="h-10 bg-gray-50"></div>
      </div>
    </div>
  );
};

export default App;
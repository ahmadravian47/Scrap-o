import React, { useState } from 'react';
import { Send, Star, Sparkle, Download } from 'lucide-react';

// ---------------------------------------------------------
// Filter Pill Component
// ---------------------------------------------------------
const FilterPill = ({ label, isSelected, onClick, isStar }) => {
  const baseClasses =
    'px-3 py-1 text-sm font-medium rounded-full transition-colors duration-150 cursor-pointer flex items-center justify-center whitespace-nowrap';
  const selectedClasses = 'bg-gray-100 text-gray-800 border border-gray-300';
  const unselectedClasses = 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50';

  return (
    <button
      onClick={onClick}
      className={`${baseClasses} ${isSelected ? selectedClasses : unselectedClasses}`}
    >
      {isStar && <Star className="w-3.5 h-3.5 mr-1 fill-yellow-400 text-yellow-500" />}
      {label}
    </button>
  );
};

// ---------------------------------------------------------
// Skeleton Loader Component
// ---------------------------------------------------------
const SkeletonRow = () => (
  <div className="animate-pulse flex flex-col sm:flex-row px-4 py-4 bg-white border border-gray-100 rounded-xl my-2">
    <div className="w-full sm:w-1/4">
      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
      <div className="h-3 bg-gray-200 rounded w-1/3 mt-2"></div>
    </div>
    <div className="w-full sm:w-1/6 mt-3 sm:mt-0">
      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
    </div>
    <div className="w-full sm:w-1/6 mt-3 sm:mt-0">
      <div className="h-4 bg-gray-200 rounded w-2/3"></div>
    </div>
    <div className="w-full sm:w-1/4 mt-3 sm:mt-0">
      <div className="h-4 bg-gray-200 rounded w-full"></div>
    </div>
    <div className="w-full sm:w-1/6 mt-3 sm:mt-0">
      <div className="h-4 bg-gray-200 rounded w-1/3"></div>
    </div>
  </div>
);

// ---------------------------------------------------------
// Main Leads Component
// ---------------------------------------------------------
export default function Leads() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocations, setSelectedLocations] = useState(['United States']);
  const [selectedRatings, setSelectedRatings] = useState([]);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const locations = ['Address', 'Phone', 'Website'];
  const ratings = ['1 star', '2 stars', '3 stars', '4 stars', '5 stars'];

  const toggleSelection = (list, setList, item) => {
    setList(prev =>
      prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]
    );
  };

  const handleSearch = async () => {
    if (!searchQuery) return;

    setLoading(true);
    setHasSearched(true);

    try {
      const res = await fetch(`${import.meta.env.VITE_SERVER_URL}/scrape`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: searchQuery,
          mustHave: selectedLocations,
          ratings: selectedRatings
        })
      });

      const data = await res.json();
      setLeads(data.results || []);
    } catch (err) {
      console.error('Error fetching leads:', err);
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------
  // Download functions
  // ---------------------------
  const downloadJSON = () => {
    const blob = new Blob([JSON.stringify(leads, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'leads.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadCSV = () => {
    if (!leads.length) return;

    // Only include relevant columns
    const headers = ['name', 'rating', 'phone', 'address', 'website'];
    const csvRows = [
      headers.join(','), // header row
      ...leads.map(lead =>
        headers.map(h => `"${lead[h] || ''}"`).join(',')
      )
    ];
    const csvContent = csvRows.join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'leads.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen flex flex-col items-center p-4 sm:p-8">
      <div className="w-full max-w-5xl mx-auto">
        <h1 className="text-xl sm:text-2xl font-normal text-gray-800 mb-8 text-center mt-12">
          Use Scrap-o to find the perfect leads
        </h1>

        {/* Search Bar */}
        <div className="flex items-center bg-white border border-gray-300 rounded-xl shadow-md overflow-hidden p-2 mb-4 w-full">
          <Sparkle className="w-5 h-5 text-gray-500 ml-2 mr-3" />
          <input
            type="text"
            className="flex-grow p-2 text-base text-gray-700 placeholder-gray-400 focus:outline-none focus:border-none focus:ring-0"
            placeholder="Example: Dentists in Connecticut"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            style={{ border: 'none' }}
          />
          <button
            onClick={handleSearch}
            className="p-2 text-gray-700 hover:text-black transition duration-150 rounded-lg mr-1"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Filters */}
        <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg border border-gray-100 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Quick filters</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 sm:gap-y-0 sm:gap-x-12">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Must Have</h3>
              <div className="flex flex-wrap gap-2">
                {locations.map(loc => (
                  <FilterPill
                    key={loc}
                    label={loc}
                    isSelected={selectedLocations.includes(loc)}
                    onClick={() => toggleSelection(selectedLocations, setSelectedLocations, loc)}
                  />
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Ratings</h3>
              <div className="flex flex-wrap gap-2">
                {ratings.map(rating => (
                  <FilterPill
                    key={rating}
                    label={rating}
                    isStar
                    isSelected={selectedRatings.includes(rating)}
                    onClick={() => toggleSelection(selectedRatings, setSelectedRatings, rating)}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Download Buttons */}
        {hasSearched && leads.length > 0 && (
          <div className="flex gap-4 mb-4">
            <button
              onClick={downloadJSON}
              className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-xl hover:bg-blue-600 transition"
            >
              <Download className="w-4 h-4" /> Download JSON
            </button>
            <button
              onClick={downloadCSV}
              className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-xl hover:bg-green-600 transition"
            >
              <Download className="w-4 h-4" /> Download CSV
            </button>
          </div>
        )}

        {/* Leads Section */}
        <div className="w-full">
          {/* Table Header */}
          {(hasSearched && (loading || leads.length > 0)) && (
            <div className="hidden sm:flex items-center px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-200">
              <div className="w-1/4">Name</div>
              <div className="w-1/6">Rating</div>
              <div className="w-1/6">Phone</div>
              <div className="w-1/4">Address</div>
              <div className="w-1/6">Website</div>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="flex flex-col items-center justify-center p-4 bg-gray-100 border border-gray-300 rounded-xl my-4 text-gray-900">
              <p className="text-sm text-center mt-1">
                Fetching your leads… this might take a moment. Thanks for hanging in there!
              </p>
            </div>
          )}
          {loading && Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}

          {/* No Leads */}
          {!loading && hasSearched && leads.length === 0 && (
            <div className="text-center p-12 bg-red-50 border border-red-200 rounded-xl my-4">
              <p className="text-red-700 font-medium text-lg">No leads found.</p>
              <p className="text-red-500 text-sm mt-1">Try broadening your search query or adjusting the filters.</p>
            </div>
          )}

          {/* Actual Leads */}
          {!loading && leads.map((lead, idx) => (
            <div
              key={idx}
              className="flex flex-col sm:flex-row items-start sm:items-center px-4 py-4 bg-white border border-gray-100 rounded-xl my-2 shadow-sm hover:shadow-md hover:-translate-y-[1px] transition-all duration-150"
            >
              <div className="w-full sm:w-1/4">
                <p className="font-medium text-gray-900">{lead.name || 'No name'}</p>
                {lead.url && (
                  <a
                    href={lead.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 text-xs hover:underline"
                  >
                    View on Maps
                  </a>
                )}
              </div>

              <div className="w-full sm:w-1/6 mt-2 sm:mt-0 text-gray-600 text-sm">
                ⭐ {lead.rating || 'N/A'}
              </div>

              <div className="w-full sm:w-1/6 mt-2 sm:mt-0 text-gray-600 text-sm">
                {lead.phone || '—'}
              </div>

              <div className="w-full sm:w-1/4 mt-2 sm:mt-0 text-gray-600 text-sm">
                {lead.address || '—'}
              </div>

              <div className="w-full sm:w-1/6 mt-2 sm:mt-0">
                {lead.website ? (
                  <a
                    href={lead.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 text-sm hover:underline"
                  >
                    Visit
                  </a>
                ) : (
                  <span className="text-gray-400 text-sm">—</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

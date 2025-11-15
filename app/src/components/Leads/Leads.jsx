import React, { useState } from 'react';
import { Send, Star, Sparkle } from 'lucide-react';

const FilterPill = ({ label, isSelected, onClick, isStar }) => {
  const baseClasses = 'px-3 py-1 text-sm font-medium rounded-full transition-colors duration-150 cursor-pointer flex items-center justify-center whitespace-nowrap';
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

export default function Leads() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocations, setSelectedLocations] = useState(['United States']);
  const [selectedIndustries, setSelectedIndustries] = useState([]);
  const [selectedRatings, setSelectedRatings] = useState(['3 stars', '4 stars']);
  const [leads, setLeads] = useState([]); // <-- Store scraped leads
  const [loading, setLoading] = useState(false);

  const locations = ['Address', 'Phone','Website'];
  const ratings = ['1 star', '2 stars', '3 stars', '4 stars', '5 stars'];

  const toggleSelection = (list, setList, item) => {
    setList(prev =>
      prev.includes(item)
        ? prev.filter(i => i !== item)
        : [...prev, item]
    );
  };

const handleSearch = async () => {
  if (!searchQuery) return;
  setLoading(true);

  try {
    const res = await fetch(`${import.meta.env.VITE_SERVER_URL}/scrape`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: searchQuery,
        mustHave: selectedLocations,   // e.g. ["Phone", "Website"]
        ratings: selectedRatings       // e.g. ["3 stars", "4 stars"]
      }),
    });

    const data = await res.json();
    console.log('Data', data);
    setLeads(data.results || []);
  } catch (err) {
    console.error("Error fetching leads:", err);
  } finally {
    setLoading(false);
  }
};


  return (
    <div className="min-h-screen flex flex-col items-center p-4 sm:p-8">
      <div className="max-w-3xl w-full">
        <h1 className="text-xl sm:text-2xl font-normal text-gray-800 mb-8 text-center mt-12">
          Use Scrap-o to find the perfect leads
        </h1>

        {/* Search Bar */}
        <div className="flex items-center bg-white border border-gray-300 rounded-xl shadow-md overflow-hidden p-2 mb-10 w-full">
          <Sparkle className="w-5 h-5 text-gray-500 ml-2 mr-3" />
          <input
            type="text"
            className="flex-grow p-2 text-base text-gray-700 placeholder-gray-400 focus:outline-none"
            style={{ border: 'none' }}
            placeholder="Example: Dentists in Connecticut"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button
            onClick={handleSearch}
            className="p-2 text-gray-700 hover:text-black transition duration-150 rounded-lg mr-1"
            aria-label="Search"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Filters Card */}
        <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg border border-gray-100 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Quick filters</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 sm:gap-y-0 sm:gap-x-12">
            <div className="space-y-6">
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
           
            </div>
            <div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Ratings</h3>
                <div className="flex flex-wrap gap-2">
                  {ratings.map(rating => (
                    <FilterPill
                      key={rating}
                      label={rating.split(' ')[0] + ' ' + rating.split(' ')[1]}
                      isStar={true}
                      isSelected={selectedRatings.includes(rating)}
                      onClick={() => toggleSelection(selectedRatings, setSelectedRatings, rating)}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Display scraped leads */}
        <div className="w-full">
          {loading && <p className="text-gray-500 mb-4">Loading leads...</p>}
          {!loading && leads.length === 0 && <p className="text-gray-500 mb-4">No leads found yet.</p>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {leads.map((lead, idx) => (
              <div key={idx} className="bg-white border border-gray-200 rounded-xl shadow p-4 flex flex-col gap-2">
                <h3 className="text-gray-800 font-semibold">{lead.name || 'No name'}</h3>
                <p className="text-gray-600 text-sm">Rating: {lead.rating || 'N/A'}</p>
                {lead.phone && <p className="text-gray-600 text-sm">Phone: {lead.phone}</p>}
                {lead.address && <p className="text-gray-600 text-sm">Address: {lead.address}</p>}
                {lead.website && <p className="text-gray-600 text-sm">Website: {lead.website}</p>}
                {lead.url && (
                  <a
                    href={lead.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 text-sm hover:underline"
                  >
                    View on Google Maps
                  </a>
                )}
              </div>
            ))}
          </div>

        </div>

      </div>
    </div>
  );
}

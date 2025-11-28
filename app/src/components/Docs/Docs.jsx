import React, { useState } from 'react';
import './Docs.css';
import Navbar from '../Navbar/Navbar';

const Docs = () => {
  const [activeSection, setActiveSection] = useState('overview');

  const sections = {
    overview: {
      title: "Overview",
      content: `
        Scrapo is a powerful SAAS platform that transforms Google business data into qualified leads 
        and enables bulk email outreach. Our platform extracts comprehensive business information including 
        names, addresses, ratings, websites, and phone numbers, then provides robust filtering and 
        email automation tools to supercharge your lead generation efforts.
      `
    },
    features: {
      title: "Key Features",
      content: `
        <div class="feature-grid">
          <div class="feature-card">
            <h3>🔍 Smart Lead Extraction</h3>
            <p>Extract business data directly from Google including names, addresses, ratings, websites, and phone numbers</p>
          </div>
          <div class="feature-card">
            <h3>🎯 Advanced Filtering</h3>
            <p>Filter leads based on presence of address, phone, website, and specific Google ratings</p>
          </div>
          <div class="feature-card">
            <h3>📧 Bulk Email Campaigns</h3>
            <p>Upload CSV files and send personalized emails to hundreds of leads in moments</p>
          </div>
          <div class="feature-card">
            <h3>📊 Analytics Dashboard</h3>
            <p>Track email performance, open rates, and lead conversion metrics</p>
          </div>
        </div>
      `
    },
    gettingStarted: {
      title: "Getting Started",
      content: `
        <h4>Step 1: Extract Leads</h4>
        <p>Use our Google lead extraction tool to gather business data based on your criteria.</p>
        
        <h4>Step 2: Filter & Refine</h4>
        <p>Apply filters to narrow down your leads:</p>
        <ul>
          <li>Filter by businesses with complete addresses</li>
          <li>Select leads with verified phone numbers</li>
          <li>Choose businesses with active websites</li>
          <li>Set minimum Google rating thresholds</li>
        </ul>
        
        <h4>Step 3: Prepare Your CSV</h4>
        <p>Download filtered leads or prepare your CSV with columns: Name, Email, Business, Phone, etc.</p>
        
        <h4>Step 4: Send Bulk Emails</h4>
        <p>Upload your CSV and launch your email campaign with our built-in email templates.</p>
      `
    },
    filters: {
      title: "Advanced Filtering",
      content: `
        <div class="filter-examples">
          <div class="filter-item">
            <strong>Presence Filters:</strong>
            <ul>
              <li>✅ Has Address - Only show businesses with complete addresses</li>
              <li>✅ Has Phone - Filter for businesses with verified phone numbers</li>
              <li>✅ Has Website - Select leads with active websites</li>
            </ul>
          </div>
          
          <div class="filter-item">
            <strong>Rating Filters:</strong>
            <ul>
              <li>⭐ 4.0+ Stars - High-rated businesses only</li>
              <li>⭐ 3.5-4.0 Stars - Good quality leads</li>
              <li>⭐ Custom Range - Set your preferred rating range</li>
            </ul>
          </div>
          
          <div class="filter-item">
            <strong>Combination Filters:</strong>
            <p>Combine multiple filters like: "Businesses with 4+ stars AND website AND phone"</p>
          </div>
        </div>
      `
    },
    emailCampaigns: {
      title: "Bulk Email Campaigns",
      content: `
        <h4>CSV Upload Requirements</h4>
        <p>Your CSV file should include these columns:</p>
        <ul>
          <li><code>name</code> - Contact person's name</li>
          <li><code>email</code> - Valid email address</li>
          <li><code>business</code> - Business name</li>
          <li><code>phone</code> - Phone number (optional)</li>
          <li><code>website</code> - Website URL (optional)</li>
        </ul>
        
        <h4>Email Templates</h4>
        <p>Choose from pre-designed templates or create your own with dynamic variables:</p>
        <ul>
          <li><code>{{name}}</code> - Contact's name</li>
          <li><code>{{business}}</code> - Business name</li>
          <li><code>{{phone}}</code> - Phone number</li>
        </ul>
        
        <h4>Campaign Management</h4>
        <p>Track sent emails, opens, clicks, and responses in real-time through our dashboard.</p>
      `
    },
    api: {
      title: "API Integration",
      content: `
        <p>Integrate Scrapo with your existing workflow using our REST API:</p>
        
        <h4>Extract Leads Endpoint</h4>
        <pre><code>POST /api/v1/leads/extract
{
  "location": "New York",
  "business_type": "restaurant",
  "min_rating": 4.0,
  "has_website": true
}</code></pre>
        
        <h4>Send Email Campaign</h4>
        <pre><code>POST /api/v1/campaigns/send
{
  "template_id": "template_123",
  "csv_data": "base64_encoded_csv",
  "schedule": "immediate"
}</code></pre>
      `
    }
  };

  const sectionKeys = Object.keys(sections);
  const currentIndex = sectionKeys.indexOf(activeSection);

  const goNext = () => {
    if (currentIndex < sectionKeys.length - 1) {
      setActiveSection(sectionKeys[currentIndex + 1]);
    }
  };

  const goPrev = () => {
    if (currentIndex > 0) {
      setActiveSection(sectionKeys[currentIndex - 1]);
    }
  };

  return (
    <>
      <Navbar />

      <div className="docs-container">

        <div className="docs-content">
          <div className="docs-header">
            <h1>Scrapo Documentation</h1>
            <p>Complete guide to extracting Google business leads and sending bulk emails</p>
          </div>

          <div className="navigation-arrows">
            <button className="nav-arrow" onClick={goPrev} disabled={currentIndex === 0}>
              ← Previous
            </button>

            <span className="section-indicator">
              {currentIndex + 1} / {sectionKeys.length}
            </span>

            <button className="nav-arrow" onClick={goNext} disabled={currentIndex === sectionKeys.length - 1}>
              Next →
            </button>
          </div>

          <div className="section-content">
            <h2>{sections[activeSection].title}</h2>

            <div
              dangerouslySetInnerHTML={{
                __html: sections[activeSection].content
              }}
            />
          </div>

        </div>
      </div>
    </>
  );
};

export default Docs;

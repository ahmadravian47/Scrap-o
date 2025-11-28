import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";
import Leads from "../Leads/Leads";
import Email from "../Email/Email";
import Settings from "../Settings/Settings";
import logo from "./logo.png";

import leadsIcon from "../Dashboard/leads.png";
import emailIcon from "../Dashboard/email.png";
import settingsIcon from "../Dashboard/settings.png";
import logoutIcon from "../Dashboard/power-off.png";

export default function Dashboard() {
  const [activeComponent, setActiveComponent] = useState("Leads");
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const REACT_APP_SERVER_URL = import.meta.env.VITE_SERVER_URL;

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await fetch(`${REACT_APP_SERVER_URL}/userprofile`, {
          method: "GET",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        });

        if (!response.ok) {
          navigate("/blocked");
          return;
        }
      } catch (error) {
        navigate("/blocked");
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [navigate, REACT_APP_SERVER_URL]);

  const handleLogout = async () => {
    try {
      await fetch(`${REACT_APP_SERVER_URL}/logout`, {
        method: "POST",
        credentials: "include",
      });
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const renderComponent = () => {
    switch (activeComponent) {
      case "Leads":
        return <Leads />;
      case "Email":
        return <Email />;
      case "Settings":
        return <Settings />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="loader-container">
        <div className="loader"></div>
      </div>
    );
  }

  return (
    <div className="dashboard">

      {/* ------ HAMBURGER BUTTON (Appears only on small screens) ------ */}
      <button
        className={`hamburger-btn ${sidebarOpen ? "open" : ""}`}
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        <span className="bar"></span>
        <span className="bar"></span>
        <span className="bar"></span>
      </button>

      {/* ------ SIDEBAR ------ */}
      <div className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="scrapo-logo">
          <img src={logo} alt="Logo" />
        </div>
        <hr />

        <button
          className={`sidebar-btn ${
            activeComponent === "Leads" ? "active" : ""
          }`}
          style={{ marginTop: "4rem" }}
          onClick={() => {
            setActiveComponent("Leads");
            setSidebarOpen(false);
          }}
        >
          <img src={leadsIcon} alt="Leads" className="icon" />
          Leads
        </button>

        <button
          className={`sidebar-btn ${
            activeComponent === "Email" ? "active" : ""
          }`}
          onClick={() => {
            setActiveComponent("Email");
            setSidebarOpen(false);
          }}
        >
          <img src={emailIcon} alt="Email" className="icon" />
          Email
        </button>

        <button
          className={`sidebar-btn ${
            activeComponent === "Settings" ? "active" : ""
          }`}
          onClick={() => {
            setActiveComponent("Settings");
            setSidebarOpen(false);
          }}
        >
          <img src={settingsIcon} alt="Settings" className="icon" />
          Settings
        </button>

        <button className="sidebar-btn logout-btn" onClick={handleLogout}>
          <img src={logoutIcon} alt="Logout" className="icon" />
          Logout
        </button>
      </div>

      {/* ------ MAIN CONTENT ------ */}
      <div className="main-content">{renderComponent()}</div>
    </div>
  );
}

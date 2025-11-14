import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import './Teams.css';

const Teams = () => {
  const [userEmail, setUserEmail] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [text, setText] = useState("");
  const [isExtracting, setIsExtracting] = useState(false);
  const [teamMembers, setTeamMembers] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const REACT_APP_SERVER_URL = import.meta.env.VITE_SERVER_URL;

  const fetchUserEmail = async () => {
    try {
      const response = await axios.get(`${REACT_APP_SERVER_URL}/userprofile`, {
        withCredentials: true,
      });
      setUserEmail(response.data.email);
      return response.data.email;
    } catch (error) {
      console.error("Failed to fetch user email:", error);
      return null;
    }
  };

  const fetchTeamMembers = async (email) => {
    if (!email) return;
    try {
      setIsLoading(true);
      const response = await fetch(
        `${REACT_APP_SERVER_URL}/team-members?email=${encodeURIComponent(email)}`,
        {
          method: "GET",
          headers: { Accept: "application/json" },
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setTeamMembers(data);
    } catch (error) {
      console.error("Error fetching team members:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const getData = async () => {
      const email = await fetchUserEmail();
      if (email) {
        fetchTeamMembers(email);
      }
    };
    getData();
  }, []);

  const handleSubmit = async () => {
    setIsExtracting(true);
    try {
      setText("");
      setShowForm(false);
      const response = await axios.post(
        `${REACT_APP_SERVER_URL}/invite-member`,
        { emails: text },
        { withCredentials: true }
      );

      if (response.status === 200) {
        toast.success("Invites Sent!");
      }
    } catch (error) {
      console.log(error);
      toast.error(error.response?.data?.message || "Team member not saved!");
    } finally {
      setIsExtracting(false);
    }
  };

  const handleOutsideClick = (e) => {
    if (e.target.className === "form-overlay") {
      setShowForm(false);
    }
  };

  const handleCheckboxChange = (email) => {
    setSelectedMembers((prev) =>
      prev.includes(email)
        ? prev.filter((e) => e !== email)
        : [...prev, email]
    );
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedMembers([]);
    } else {
      setSelectedMembers(teamMembers.map((t) => t.email));
    }
    setSelectAll(!selectAll);
  };

  const handleDeleteMembers = async () => {
    if (!window.confirm("Are you sure you want to delete selected team members?")) return;

    try {
      const response = await axios.post(
        `${REACT_APP_SERVER_URL}/delete-member`,
        { emails: selectedMembers },
        { withCredentials: true }
      );

      if (response.status === 200) {
        toast.success("Team members deleted!");
        setTeamMembers((prev) =>
          prev.filter((member) => !selectedMembers.includes(member.email))
        );
        setSelectedMembers([]);
        setSelectAll(false);
      }
    } catch (error) {
      console.error("Error deleting team members:", error);
      toast.error("Failed to delete team members.");
    }
  };

  return (
    <div className="box">
      {showForm && (
        <div className="form-overlay" onClick={handleOutsideClick}>
          <div className="form">
            <h2>Enter your team members' emails, and we'll send invites.</h2>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="john@gmail.com, trevis@gmail.com"
              disabled={isExtracting}
            />
            <button onClick={handleSubmit}>Send Invite</button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="loader-container">
          <div className="loader"></div>
        </div>
      ) : (
        <>
          <div className="header">
            <input type="text" placeholder="Search by Name, Address, Phone" className="search-bar" />
            <div className="actions">
              <button className="add-button" onClick={() => setShowForm(true)}>
                + Add Member
              </button>
              {selectedMembers.length > 0 && (
                <button className="delete-button" onClick={handleDeleteMembers}>
                  🗑 Delete
                </button>
              )}
            </div>
          </div>

          <div className="table-container">
            <table className="appointment-table">
              <thead>
                <tr>
                  <th>
                    <input type="checkbox" checked={selectAll} onChange={handleSelectAll} />
                  </th>
                  <th style={{ fontWeight: '300' }}>Person</th>
                  <th style={{ fontWeight: '300' }}>Home Address</th>
                  <th style={{ fontWeight: '300' }}>Phone</th>
                  <th style={{ fontWeight: '300' }}>Email</th>
                </tr>
              </thead>

              <tbody>
                {teamMembers.map((member, idx) => (
                  <tr
                    key={idx}
                    style={{ backgroundColor: idx % 2 === 0 ? 'white' : 'transparent' }}
                  >
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedMembers.includes(member.email)}
                        onChange={() => handleCheckboxChange(member.email)}
                      />
                    </td>
                    <td>{member.name}</td>
                    <td>{member.address}</td>
                    <td>{member.phone}</td>
                    <td>{member.email}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default Teams;

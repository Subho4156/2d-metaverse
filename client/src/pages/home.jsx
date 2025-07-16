import React, { useEffect, useState } from "react";
import { createSpace, getMySpaces } from "../api"; 
import './home.css'; // Importing CSS for styling
import useUser from '../hooks/useUser'; 
import { FiLogOut } from "react-icons/fi"; // Add this import
import { FaArrowRight } from "react-icons/fa";
import SpaceCard from "../components/SpaceCard";
import LoadingScreen from "../components/LoadingScreen";
import CreateSpace from "../components/CreateSpace"; 
import JoinSpace from "../components/JoinSpace"; // New component import
import { useNavigate } from 'react-router-dom';

const App = () => {
    const [loadingPage, setLoadingPage] = useState(true);
    const [selectedSpace, setSelectedSpace] = useState(null);
    const { user, loading } = useUser();
    const [showConfirm, setShowConfirm] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [showJoinModal, setShowJoinModal] = useState(false); // New state for join modal
    const [name, setName] = useState('');
    const [desc, setDesc] = useState('');
    const [spaces, setSpaces] = useState([]);


useEffect(() => {
  const url = new URL(window.location.href);
  const refresh = url.searchParams.get("refresh");

  if (refresh === "true") {
    // 👇 Remove the param and reload again to clean up the URL
    window.location.replace("/home");
  }
}, []);


      const handleCreate = async ({selectedMap}) => {
        if (!name.trim()) return;
        try {
          const res = await createSpace({ name, description: desc, mapKey: selectedMap});
          setSpaces((prev) => [...prev, res.data.space]);
          setShowModal(false);
          setName("");
          setDesc("");
        } catch (err) {
          console.error(
            "Failed to create space:",
            err.response?.data || err.message
          );
        }
      };

    const handleLogout = () => {
      localStorage.removeItem("token");
      window.location.href = "/";
    };

    const handleOpenSpace = (space) => {
      setSelectedSpace(space);
      setShowModal(true);
    };

  const navigate = useNavigate();

  const handleEnterSpace = (space) => {
    navigate(`/space/${space._id}`);
  };

  const handleJoinSpace = (spaceId) => {
    navigate(`/space/${spaceId}`);
  };

     useEffect(() => {
    const fetchSpaces = async () => {
      try {
        const res = await getMySpaces();
        setSpaces(res.data.spaces);
      } catch (err) {
        console.error("Error fetching spaces:", err);
      } finally {
        setTimeout(() => {
          setLoadingPage(false);
        }, 1500); // Optional delay for smoother transition
      }
    };
    fetchSpaces();
  }, []);

      if (loadingPage) return <LoadingScreen />;

  return (
    <>
      {/* Outer container for the entire page */}
      <div
        className="homepage-container"
        style={{
          width: "125vw", // 100 / 0.8
          height: "125vh",
          overflow: "hidden",
          transform: "scale(0.8)", 
          transformOrigin: "top left",
        }}
      >
        <header className="header">
          <div className="header-brand">
            <svg
              className="header-logo-icon"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 100-2 1 1 0 000 2zm7-1a1 1 0 11-2 0 1 1 0 012 0zm-.464 5.536a.5.5 0 00.707.707l3-3a.5.5 0 000-.707l-3-3a.5.5 0 00-.707.707L13.293 8.5H9.5a.5.5 0 000 1h3.793l-1.647 1.646a.5.5 0 000 .708z"
                clipRule="evenodd"
              />
            </svg>
            <h1 className="header-title">MetaVerse X</h1>
          </div>
          <div className="header-user-info">
            <button
              onClick={() => setShowJoinModal(true)} // Open join modal
              className="join-space-button-up"
              style={{ backgroundColor: "#6366f1" }}
            >
              <span
                style={{
                  marginRight: "6px",
                  fontWeight: "bold",
                  fontSize: "15px",
                }}
              >
                +
              </span>
              Join Space
            </button>
            <button
              onClick={() => {
                setSelectedSpace(null); // reset to indicate we're creating a new space
                setShowModal(true);
              }}
              className="create-space-button-up"
            >
              <span
                style={{
                  marginRight: "6px",
                  fontWeight: "bold",
                  fontSize: "15px",
                }}
              >
                +
              </span>
              New Space
            </button>
            <div className="header-avatar">
              {user?.username?.charAt(0).toUpperCase() ?? "?"}
            </div>
            <span className="header-greeting">
              {" "}
              {loading ? "Loading..." : user?.username ?? "Guest"}
            </span>
            <button
              onClick={() => setShowConfirm(true)}
              className="logout-icon-btn"
              title="Logout"
            >
              <FiLogOut size={18} />
            </button>
          </div>
        </header>

        {/* Logout Confirmation Modal */}
        {showConfirm && (
          <div className="logout-modal-overlay">
            <div className="logout-modal">
              <img src="icon3.gif" alt="Logout Icon" className="logout-icon" />
              <h3>
                Are you sure you want to{" "}
                <span style={{ color: "#ff5555" }}>Signout</span> ?
              </h3>
              <div className="logout-buttons">
                <button className="confirm-logout" onClick={handleLogout}>
                  Yes, Signout
                </button>
                <button
                  className="cancel-logout"
                  onClick={() => setShowConfirm(false)}
                >
                  No
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Create Space Modal */}
        {showModal && (
          <CreateSpace
            mode={selectedSpace ? "view" : "create"}
            space={selectedSpace}
            name={name}
            setName={setName}
            desc={desc}
            setDesc={setDesc}
            handleCreate={handleCreate}
            setShowModal={setShowModal}
            onEnterSpace={handleEnterSpace}
          />
        )}

        {/* Join Space Modal */}
        {showJoinModal && (
          <JoinSpace
            setShowJoinModal={setShowJoinModal}
            onJoinSpace={handleJoinSpace}
          />
        )}

        <main
          className={
            spaces.length ? "main-content-spaces" : "main-content-default"
          }
        >
          {spaces.length > 0 ? (
            <>
              <div className="space-grid">
                {spaces.map((space) => (
                  <SpaceCard
                    key={space._id}
                    space={space}
                    onClick={() => handleOpenSpace(space)}
                  />
                ))}
              </div>
            </>
          ) : (
            <>
              <h2 className="main-welcome-title">
                Welcome to Your{" "}
                <span className="highlight-text">Digital Domains</span>
              </h2>
              <p className="main-subtitle">
                You haven't created any spaces yet. Start building your virtual
                worlds today!
              </p>
              <section className="create-space-card">
                <img
                  src="icon2.gif"
                  alt="Create Space Icon"
                  className="create-space-icon"
                />
                <p className="create-space-description">
                  Start building your next virtual world, meeting room, or
                  social hub.
                </p>
                <button
                  onClick={() => {
                    setSelectedSpace(null); // reset to indicate we're creating a new space
                    setShowModal(true);
                  }}
                  className="create-space-button"
                >
                  Create New Space
                </button>
              </section>
            </>
          )}
        </main>
      </div>
    </>
  );
};

export default App;
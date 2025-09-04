import axios from "axios";
import { useEffect, useState } from "react";
import { useUndo } from "../hooks/useUndo";

// Define the type for the summary data
type SummaryData = {
  totalProducts: number;
  totalStocks: number;
  totalReleases: number;
  shortExpiry: number;
  totalUsers: number;
};

const Dashboard = () => {
  const [summaryData, setSummaryData] = useState<SummaryData>({
    totalProducts: 0,
    totalStocks: 0,
    totalReleases: 0,
    shortExpiry: 0,
    totalUsers: 0,
  });
  const [error, setError] = useState<string | null>(null);
  // Use the custom undo hook
  const { message, undo, clearMessage } = useUndo<any>();

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await axios.get("http://localhost:5000/summary");
        setSummaryData(res.data);
      } catch (err) {
        setError("Failed to load dashboard data");
      }
    };
    fetchSummary();
  }, []); // The empty dependency array ensures this runs only once on mount

  if (error) {
    return <div>{error}</div>;
  }

  // Styles for the dashboard cards and container
  const cardStyle: React.CSSProperties = {
    backgroundColor: "#f0f4f8",
    borderRadius: "10px",
    padding: "20px",
    margin: "10px",
    textAlign: "center",
    flex: 1,
    minWidth: "150px",
    boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
  };

  const numberStyle: React.CSSProperties = {
    fontSize: "2rem",
    fontWeight: "bold",
    color: "#1a73e8",
    margin: "10px 0",
  };

  const containerStyle: React.CSSProperties = {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
    marginTop: "20px",
  };

  return (
    <div>
      <h2 style={{ textAlign: "center" }}>Dashboard Summary</h2>
      <div style={containerStyle}>
        {/* Render each summary card */}
        <div style={cardStyle}>
          <div>Total Products</div>
          <div style={numberStyle}>{summaryData.totalProducts}</div>
        </div>
        <div style={cardStyle}>
          <div>Total Stocks</div>
          <div style={numberStyle}>{summaryData.totalStocks}</div>
        </div>
        <div style={cardStyle}>
          <div>Total Releases</div>
          <div style={numberStyle}>{summaryData.totalReleases}</div>
        </div>
        <div style={cardStyle}>
          <div>Short Expiry</div>
          <div style={numberStyle}>{summaryData.shortExpiry}</div>
        </div>
        <div style={cardStyle}>
          <div>Total Users</div>
          <div style={numberStyle}>{summaryData.totalUsers}</div>
        </div>
      </div>

      {/* Undo Snackbar, visible only if 'message' has a value */}
      {message && (
        <div className="undo-message">
          {message}
          <button onClick={undo}>Undo</button>
          <button onClick={clearMessage}>X</button>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
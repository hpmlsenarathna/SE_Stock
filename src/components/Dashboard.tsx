import axios from "axios";
import { useEffect, useState } from "react";
import { Package, TrendingUp, CloudUpload, Clock } from "lucide-react";

type SummaryData = {
  totalProducts: number;
  totalStocks: number;
  totalReleases: number;
  shortExpiry: number;
};

type Stat = {
  title: string;
  value: number;
  icon: React.ElementType;
  change: string;
  trend: "up" | "down";
};

const Dashboard = () => {
  const [summaryData, setSummaryData] = useState<SummaryData>({
    totalProducts: 0,
    totalStocks: 0,
    totalReleases: 0,
    shortExpiry: 0,
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await axios.get("http://localhost:5000/summary");
        setSummaryData(res.data);
      } catch (err) {
        setError("⚠️ Failed to load dashboard data. Please check the server connection.");
      }
    };
    fetchSummary();
  }, []);

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-red-600 text-center text-lg p-6 bg-red-100 rounded-2xl shadow-lg border border-red-300">
          {error}
        </div>
      </div>
    );
  }

  const stats: Stat[] = [
    { title: "Total Products", value: summaryData.totalProducts, icon: Package, change: "+12%", trend: "up" },
    { title: "Total Stocks", value: summaryData.totalStocks, icon: TrendingUp, change: "+8%", trend: "up" },
    { title: "Total Releases", value: summaryData.totalReleases, icon: CloudUpload, change: "-3%", trend: "down" },
    { title: "Short Expiry", value: summaryData.shortExpiry, icon: Clock, change: "+2%", trend: "up" },
  ];

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <p>Welcome back 👋 Here’s your inventory overview.</p>
      </div>

      <div className="stats-grid">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="stat-card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div className="stat-title">{stat.title}</div>
                  <div className="stat-value">{stat.value}</div>
                </div>
                <div className={`stat-icon ${stat.trend}`}>
                  <Icon size={24} />
                </div>
              </div>
              <div className={`stat-change ${stat.trend}`}>
                {stat.change} <span>from last month</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Dashboard;

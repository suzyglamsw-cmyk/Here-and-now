import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth, API } from "@/App";
import { toast } from "sonner";
import axios from "axios";
import Layout from "../components/Layout";
import { MessageCircle, MapPin, Loader2, Users, Sparkles } from "lucide-react";

const Connections = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConnections();
  }, []);

  const fetchConnections = async () => {
    try {
      const response = await axios.get(`${API}/connections`);
      setConnections(response.data);
    } catch (error) {
      toast.error("Failed to load connections");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-6 pb-32" data-testid="connections-page">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Your Connections</h1>
          <p className="text-slate-400">People you've matched with</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          </div>
        ) : connections.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-4">
              <Users className="w-10 h-10 text-slate-600" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">No connections yet</h2>
            <p className="text-slate-400 mb-6">
              Check in to a venue and start glancing at people to make connections!
            </p>
            <Button
              data-testid="find-venues-btn"
              onClick={() => navigate("/venues")}
              className="rounded-full bg-gradient-to-r from-indigo-500 to-pink-500 text-white font-semibold hover:opacity-90"
            >
              Find Venues
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {connections.map((connection) => (
              <div
                key={connection.id}
                data-testid={`connection-card-${connection.id}`}
                className="glass rounded-2xl p-4 flex items-center gap-4 hover:bg-white/5 transition-colors"
              >
                {/* Avatar */}
                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden">
                    <img
                      src={connection.avatar_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200"}
                      alt={connection.display_name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                    <Sparkles className="w-3 h-3 text-white" />
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-white truncate">{connection.display_name}</h3>
                  {connection.bio && (
                    <p className="text-slate-400 text-sm truncate">{connection.bio}</p>
                  )}
                  <div className="flex items-center gap-2 mt-1 text-slate-500 text-xs">
                    <MapPin className="w-3 h-3" />
                    <span>Met at {connection.venue_name}</span>
                    <span>•</span>
                    <span>{formatDate(connection.connected_at)}</span>
                  </div>
                </div>

                {/* Action */}
                <Button
                  data-testid={`chat-btn-${connection.user_id}`}
                  onClick={() => navigate(`/chat/${connection.user_id}`)}
                  className="rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Chat
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Connections;

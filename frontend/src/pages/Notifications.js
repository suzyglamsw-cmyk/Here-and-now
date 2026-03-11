import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth, API } from "@/App";
import { toast } from "sonner";
import axios from "axios";
import Layout from "../components/Layout";
import { Eye, Wine, Sparkles, Bell, Loader2, Check } from "lucide-react";

const Notifications = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(null);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await axios.get(`${API}/notifications`);
      setNotifications(response.data);
    } catch (error) {
      toast.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptDrink = async (tokenId) => {
    setAccepting(tokenId);
    try {
      await axios.post(`${API}/drink-token/${tokenId}/accept`);
      toast.success("Drink accepted! Cheers!");
      fetchNotifications();
    } catch (error) {
      toast.error("Failed to accept drink");
    } finally {
      setAccepting(null);
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "mutual_glance":
        return <Sparkles className="w-5 h-5 text-emerald-400" />;
      case "glance":
        return <Eye className="w-5 h-5 text-pink-400" />;
      case "drink_token":
        return <Wine className="w-5 h-5 text-amber-400" />;
      default:
        return <Bell className="w-5 h-5 text-slate-400" />;
    }
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto px-4 py-6 pb-32" data-testid="notifications-page">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Notifications</h1>
          <p className="text-slate-400">Recent activity</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-4">
              <Bell className="w-10 h-10 text-slate-600" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">No notifications yet</h2>
            <p className="text-slate-400">
              Check in to a venue to start receiving notifications
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification, index) => (
              <div
                key={index}
                data-testid={`notification-${index}`}
                className="glass rounded-2xl p-4 flex items-start gap-4"
              >
                {/* Icon */}
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center flex-shrink-0">
                  {getNotificationIcon(notification.type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  {notification.type === "mutual_glance" && (
                    <>
                      <p className="text-white font-medium">
                        You matched with {notification.user?.display_name}!
                      </p>
                      <p className="text-slate-400 text-sm mt-1">
                        You can now chat with them
                      </p>
                    </>
                  )}
                  {notification.type === "glance" && (
                    <p className="text-white">{notification.message}</p>
                  )}
                  {notification.type === "drink_token" && (
                    <>
                      <p className="text-white font-medium">
                        {notification.from_user?.display_name} sent you a{" "}
                        {notification.drink_type}!
                      </p>
                      <div className="mt-2">
                        <Button
                          data-testid={`accept-drink-${notification.token_id}`}
                          onClick={() => handleAcceptDrink(notification.token_id)}
                          disabled={accepting === notification.token_id}
                          size="sm"
                          className="rounded-full bg-amber-500 hover:bg-amber-600 text-white"
                        >
                          {accepting === notification.token_id ? (
                            <Loader2 className="w-4 h-4 animate-spin mr-1" />
                          ) : (
                            <Check className="w-4 h-4 mr-1" />
                          )}
                          Accept
                        </Button>
                      </div>
                    </>
                  )}
                  <p className="text-slate-500 text-xs mt-2">
                    {formatTime(notification.created_at)}
                  </p>
                </div>

                {/* Avatar for matches */}
                {(notification.type === "mutual_glance" || notification.type === "drink_token") &&
                  (notification.user?.avatar_url || notification.from_user?.avatar_url) && (
                    <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0">
                      <img
                        src={
                          notification.user?.avatar_url ||
                          notification.from_user?.avatar_url
                        }
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Notifications;

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth, API } from "@/App";
import { toast } from "sonner";
import axios from "axios";
import Layout from "../components/Layout";
import { Eye, MessageCircle, Loader2, ArrowLeft, Heart, Wine } from "lucide-react";

const UserProfile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [glancing, setGlancing] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, [userId]);

  const fetchProfile = async () => {
    try {
      const response = await axios.get(`${API}/users/${userId}/profile`);
      setProfile(response.data);
    } catch (error) {
      toast.error("Failed to load profile");
      navigate(-1);
    } finally {
      setLoading(false);
    }
  };

  const handleGlance = async () => {
    setGlancing(true);
    try {
      // We need a venue_id for glancing - use a generic one for now
      const response = await axios.post(`${API}/glance`, {
        to_user_id: userId,
        venue_id: "profile_view"
      });
      
      toast.success(response.data.is_mutual ? "It's a match!" : "Glance sent!");
      
      // Refresh profile to update glance status
      await fetchProfile();
    } catch (error) {
      if (error.response?.status === 429) {
        toast.error("No glances remaining today");
      } else {
        toast.error(error.response?.data?.detail || "Failed to send glance");
      }
    } finally {
      setGlancing(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        </div>
      </Layout>
    );
  }

  if (!profile) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-slate-400">Profile not found</p>
        </div>
      </Layout>
    );
  }

  const mainPhoto = profile.avatar_url || (profile.photos && profile.photos[0]) || null;

  return (
    <Layout>
      <div className="max-w-2xl mx-auto px-4 py-6 pb-32" data-testid="user-profile-page">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors"
          data-testid="back-btn"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>

        {/* Profile Card */}
        <div className="glass rounded-3xl overflow-hidden">
          {/* Main Photo */}
          {mainPhoto ? (
            <div className="aspect-square w-full max-h-96 overflow-hidden">
              <img
                src={mainPhoto}
                alt={profile.display_name}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="aspect-square w-full max-h-96 bg-slate-800 flex items-center justify-center">
              <span className="text-6xl text-slate-600">
                {profile.display_name?.charAt(0) || "?"}
              </span>
            </div>
          )}

          {/* Profile Info */}
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-white">
                  {profile.display_name}
                  {profile.age && <span className="text-slate-400 ml-2">{profile.age}</span>}
                </h1>
                {profile.bio && (
                  <p className="text-slate-400 mt-1">{profile.bio}</p>
                )}
              </div>
              
              {/* Glance Status Badge */}
              {profile.is_mutual && (
                <div className="flex items-center gap-1 bg-pink-500/20 text-pink-400 px-3 py-1 rounded-full text-sm">
                  <Heart className="w-4 h-4" />
                  Mutual
                </div>
              )}
              {profile.they_glanced_at_me && !profile.i_glanced_at_them && (
                <div className="flex items-center gap-1 bg-indigo-500/20 text-indigo-400 px-3 py-1 rounded-full text-sm">
                  <Eye className="w-4 h-4" />
                  Glanced at you
                </div>
              )}
            </div>

            {/* Interests */}
            {profile.interests && profile.interests.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {profile.interests.map((interest) => (
                  <span
                    key={interest}
                    className="bg-white/10 text-slate-300 px-3 py-1 rounded-full text-sm"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            )}

            {/* Additional Photos */}
            {profile.photos && profile.photos.filter((p, i) => i > 0 && p).length > 0 && (
              <div className="flex gap-2 mb-6">
                {profile.photos.slice(1).filter(p => p).map((photo, index) => (
                  <div key={index} className="w-20 h-20 rounded-xl overflow-hidden">
                    <img
                      src={photo}
                      alt={`Photo ${index + 2}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              {profile.can_glance_back ? (
                <Button
                  data-testid="glance-back-btn"
                  onClick={handleGlance}
                  disabled={glancing}
                  className="flex-1 rounded-xl bg-gradient-to-r from-pink-500 to-indigo-500 text-white font-semibold hover:opacity-90"
                >
                  {glancing ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Eye className="w-4 h-4 mr-2" />
                  )}
                  Glance Back
                </Button>
              ) : !profile.i_glanced_at_them ? (
                <Button
                  data-testid="glance-btn"
                  onClick={handleGlance}
                  disabled={glancing}
                  className="flex-1 rounded-xl bg-gradient-to-r from-indigo-500 to-pink-500 text-white font-semibold hover:opacity-90"
                >
                  {glancing ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Eye className="w-4 h-4 mr-2" />
                  )}
                  Glance
                </Button>
              ) : null}
              
              {profile.is_mutual && (
                <Button
                  data-testid="chat-btn"
                  onClick={() => navigate(`/chat/${userId}`)}
                  className="flex-1 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Chat
                </Button>
              )}
            </div>

            {profile.i_glanced_at_them && !profile.is_mutual && (
              <p className="text-center text-slate-500 text-sm mt-4">
                You've glanced at {profile.display_name}. Waiting for them to glance back...
              </p>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default UserProfile;

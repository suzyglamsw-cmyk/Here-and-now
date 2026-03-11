import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth, API } from "@/App";
import { toast } from "sonner";
import axios from "axios";
import Layout from "../components/Layout";
import { MapPin, Users, Search, LogOut, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";

const Venues = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(null);
  const [currentCheckin, setCurrentCheckin] = useState(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchVenues();
    fetchCurrentCheckin();
    seedVenues();
  }, []);

  const seedVenues = async () => {
    try {
      await axios.post(`${API}/seed`);
    } catch (error) {
      // Already seeded, ignore
    }
  };

  const fetchVenues = async () => {
    try {
      const response = await axios.get(`${API}/venues`);
      setVenues(response.data);
    } catch (error) {
      toast.error("Failed to load venues");
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentCheckin = async () => {
    try {
      const response = await axios.get(`${API}/checkin/current`);
      if (response.data.checked_in) {
        setCurrentCheckin(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch current checkin");
    }
  };

  const handleCheckIn = async (venueId) => {
    setCheckingIn(venueId);
    try {
      await axios.post(`${API}/checkin/${venueId}`);
      toast.success("Checked in!");
      navigate(`/venue/${venueId}`);
    } catch (error) {
      toast.error("Failed to check in");
    } finally {
      setCheckingIn(null);
    }
  };

  const handleCheckOut = async () => {
    try {
      await axios.post(`${API}/checkout`);
      setCurrentCheckin(null);
      toast.success("Checked out");
      fetchVenues();
    } catch (error) {
      toast.error("Failed to check out");
    }
  };

  const filteredVenues = venues.filter(
    (venue) =>
      venue.name.toLowerCase().includes(search.toLowerCase()) ||
      venue.type.toLowerCase().includes(search.toLowerCase())
  );

  const getVenueTypeColor = (type) => {
    switch (type) {
      case "bar":
        return "text-pink-400";
      case "cafe":
        return "text-amber-400";
      case "club":
        return "text-purple-400";
      case "restaurant":
        return "text-emerald-400";
      default:
        return "text-slate-400";
    }
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 py-6 pb-32" data-testid="venues-page">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Discover Venues</h1>
          <p className="text-slate-400">Find your vibe and see who's around</p>
        </div>

        {/* Current Check-in Banner */}
        {currentCheckin && (
          <div className="glass rounded-2xl p-4 mb-6 flex items-center justify-between" data-testid="current-checkin-banner">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-emerald-500 animate-live" />
              <div>
                <p className="text-white font-medium">
                  You're at {currentCheckin.venue?.name}
                </p>
                <p className="text-slate-400 text-sm">
                  {currentCheckin.venue?.checked_in_count || 0} people here
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                data-testid="view-whos-here-btn"
                onClick={() => navigate(`/venue/${currentCheckin.checkin.venue_id}`)}
                className="rounded-full bg-indigo-500 hover:bg-indigo-600 text-white"
              >
                Who's Here
              </Button>
              <Button
                data-testid="checkout-btn"
                onClick={handleCheckOut}
                variant="ghost"
                className="rounded-full text-slate-400 hover:text-white hover:bg-white/10"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
          <Input
            data-testid="venue-search"
            placeholder="Search venues..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-12 pl-12 bg-white/5 border-transparent focus:border-indigo-500 rounded-xl text-white placeholder:text-slate-500"
          />
        </div>

        {/* Venues Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVenues.map((venue) => (
              <div
                key={venue.id}
                data-testid={`venue-card-${venue.id}`}
                className="venue-card rounded-3xl bg-slate-900/50 border border-white/5 overflow-hidden group"
              >
                {/* Venue Image */}
                <div className="relative aspect-[16/10] overflow-hidden">
                  <img
                    src={venue.image_url || "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800"}
                    alt={venue.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent" />
                  
                  {/* Live Count */}
                  <div className="absolute top-4 right-4 flex items-center gap-2 glass rounded-full px-3 py-1.5">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-live" />
                    <span className="text-white text-sm font-medium">
                      {venue.checked_in_count}
                    </span>
                  </div>
                </div>

                {/* Venue Info */}
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-xl font-semibold text-white mb-1">{venue.name}</h3>
                      <span className={`text-sm font-medium capitalize ${getVenueTypeColor(venue.type)}`}>
                        {venue.type}
                      </span>
                    </div>
                  </div>

                  <p className="text-slate-400 text-sm mb-4 line-clamp-2">{venue.description}</p>

                  <div className="flex items-center gap-2 text-slate-500 text-sm mb-4">
                    <MapPin className="w-4 h-4" />
                    <span>{venue.address}</span>
                  </div>

                  <Button
                    data-testid={`checkin-btn-${venue.id}`}
                    onClick={() => handleCheckIn(venue.id)}
                    disabled={checkingIn === venue.id}
                    className="w-full h-11 rounded-xl bg-white text-slate-900 font-semibold hover:bg-slate-100 transition-all active:scale-[0.98]"
                  >
                    {checkingIn === venue.id ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Checking in...
                      </>
                    ) : currentCheckin?.checkin?.venue_id === venue.id ? (
                      "You're Here"
                    ) : (
                      "Check In"
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && filteredVenues.length === 0 && (
          <div className="text-center py-20">
            <p className="text-slate-400">No venues found</p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Venues;

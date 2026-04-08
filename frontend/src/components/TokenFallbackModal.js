import { useState } from "react";
import { Button } from "@/components/ui/button";
import { API } from "@/App";
import axios from "axios";
import { Coins, X, Crown, Snowflake, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";

/**
 * First-time token fallback confirmation modal
 * Shows when user first uses a token after daily allowance is exhausted
 */
export const TokenFallbackConfirmModal = ({ isOpen, onClose, onConfirm }) => {
  const [confirming, setConfirming] = useState(false);

  const handleConfirm = async () => {
    setConfirming(true);
    try {
      await axios.post(`${API}/tokens/confirm-fallback`);
      onConfirm();
      onClose();
    } catch (error) {
      console.error("Failed to confirm token fallback:", error);
      // Still close even if API fails - user saw the message
      onConfirm();
      onClose();
    } finally {
      setConfirming(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="glass rounded-3xl p-6 max-w-sm w-full relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto mb-4">
            <Coins className="w-8 h-8 text-amber-400" />
          </div>
          <h3 className="text-xl font-bold text-white mb-3">Heads up</h3>
          <p className="text-slate-400 text-sm leading-relaxed">
            We'll use your tokens when you run out. No surprises.
          </p>
        </div>

        <Button
          data-testid="token-fallback-confirm-btn"
          onClick={handleConfirm}
          disabled={confirming}
          className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-white font-semibold h-12"
        >
          {confirming ? "..." : "Got it"}
        </Button>
      </div>
    </div>
  );
};

/**
 * Out of glances modal - shown when user has 0 glances AND 0 tokens
 */
export const OutOfGlancesModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="glass rounded-3xl p-6 max-w-sm w-full relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-full bg-pink-500/20 flex items-center justify-center mx-auto mb-4">
            <Eye className="w-8 h-8 text-pink-400" />
          </div>
          <h3 className="text-xl font-bold text-white mb-3">No Glances Left</h3>
          <p className="text-slate-400 text-sm leading-relaxed">
            You're all out of glances for today. Come back after 5am, or go Premium if you fancy a bit more freedom.
          </p>
        </div>

        <div className="space-y-3">
          <Button
            data-testid="upgrade-premium-btn"
            onClick={() => {
              onClose();
              navigate("/premium");
            }}
            className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-pink-500 text-white font-semibold h-12"
          >
            <Crown className="w-4 h-4 mr-2" />
            Go Premium
            <span className="ml-2 text-xs opacity-80">15 glances/day</span>
          </Button>

          <Button
            data-testid="buy-tokens-btn"
            onClick={() => {
              onClose();
              navigate("/premium");
            }}
            variant="outline"
            className="w-full rounded-xl h-12"
          >
            <Coins className="w-4 h-4 mr-2" />
            Buy Tokens
          </Button>
        </div>
      </div>
    </div>
  );
};

/**
 * Out of icebreakers modal - shown when user has 0 icebreakers AND 0 tokens
 */
export const OutOfIcebreakersModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="glass rounded-3xl p-6 max-w-sm w-full relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-full bg-cyan-500/20 flex items-center justify-center mx-auto mb-4">
            <Snowflake className="w-8 h-8 text-cyan-400" />
          </div>
          <h3 className="text-xl font-bold text-white mb-3">No Icebreakers Left</h3>
          <p className="text-slate-400 text-sm leading-relaxed">
            That's your last icebreaker for today. Fresh ones land at 5am. Or go Premium and keep the chat rolling.
          </p>
        </div>

        <div className="space-y-3">
          <Button
            data-testid="upgrade-premium-btn"
            onClick={() => {
              onClose();
              navigate("/premium");
            }}
            className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-pink-500 text-white font-semibold h-12"
          >
            <Crown className="w-4 h-4 mr-2" />
            Go Premium
            <span className="ml-2 text-xs opacity-80">15 icebreakers/day</span>
          </Button>

          <Button
            data-testid="buy-tokens-btn"
            onClick={() => {
              onClose();
              navigate("/premium");
            }}
            variant="outline"
            className="w-full rounded-xl h-12"
          >
            <Coins className="w-4 h-4 mr-2" />
            Buy Tokens
          </Button>
        </div>
      </div>
    </div>
  );
};

/**
 * Paywall modal for upselling premium
 */
export const PaywallModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="glass rounded-3xl p-6 max-w-sm w-full relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto mb-4">
            <Crown className="w-8 h-8 text-amber-400" />
          </div>
          <h3 className="text-xl font-bold text-white mb-3">Fancy a bit more room?</h3>
          <p className="text-slate-400 text-sm leading-relaxed mb-4">
            Free users get 3 glances and 3 icebreakers a day.
          </p>
          <p className="text-slate-300 text-sm leading-relaxed mb-4">
            Premium gives you 15 and 15 — plenty to have a proper look round and say hello.
          </p>
          <p className="text-slate-500 text-xs leading-relaxed">
            No boosts, no daft gimmicks. Just more chances, more chats, more 'oh go on then'.
          </p>
        </div>

        <Button
          data-testid="upgrade-premium-btn"
          onClick={() => {
            onClose();
            navigate("/premium");
          }}
          className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-pink-500 text-white font-semibold h-12"
        >
          <Crown className="w-4 h-4 mr-2" />
          Go Premium
        </Button>
      </div>
    </div>
  );
};

export default {
  TokenFallbackConfirmModal,
  OutOfGlancesModal,
  OutOfIcebreakersModal,
  PaywallModal
};

/**
 * NotForNowSheet - Bottom sheet for hiding profiles
 * Long-press action that hides a profile for 90 days without blocking
 */

import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

export const NotForNowSheet = ({ 
  isOpen, 
  onClose, 
  onConfirm,
  userName 
}) => {
  if (!isOpen) return null;
  
  return (
    <div 
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-lg bg-slate-900 rounded-t-3xl p-6 pb-10 animate-in slide-in-from-bottom duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle bar */}
        <div className="w-12 h-1 bg-slate-700 rounded-full mx-auto mb-6" />
        
        <h2 className="text-xl font-bold text-white mb-2">Not for now</h2>
        <p className="text-slate-400 mb-6">
          This profile will be hidden from your feed. They won't be notified.
        </p>
        
        <div className="flex flex-col gap-3">
          <Button
            data-testid="confirm-not-for-now"
            onClick={onConfirm}
            className="w-full bg-slate-800 hover:bg-slate-700 text-white py-6"
          >
            Hide for 90 days
          </Button>
          
          <Button
            data-testid="cancel-not-for-now"
            variant="ghost"
            onClick={onClose}
            className="w-full text-slate-400 hover:text-white"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotForNowSheet;

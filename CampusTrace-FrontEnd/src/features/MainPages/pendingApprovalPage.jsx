import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../api/apiClient.js";
import { Clock, LogOut } from "lucide-react";

function PendingApprovalPage() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-[#1a1a1a] flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center bg-white dark:bg-[#2a2a2a] p-8 sm:p-10 rounded-xl shadow-xl border border-neutral-200 dark:border-[#3a3a3a]">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-500/10 mb-5 border-4 border-yellow-200 dark:border-yellow-500/20">
          <Clock
            className="h-8 w-8 text-yellow-600 dark:text-yellow-400"
            aria-hidden="true"
          />
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold text-neutral-800 dark:text-white mb-3">
          Account Pending Approval
        </h1>

        <p className="text-neutral-600 dark:text-neutral-400 text-sm sm:text-base leading-relaxed">
          Your email has been confirmed! Your account now needs approval from a
          university administrator before you can log in.
        </p>
        <p className="text-neutral-600 dark:text-neutral-400 text-sm sm:text-base leading-relaxed mt-3">
          You will receive an email notification once your account is approved.
        </p>

        <button
          onClick={handleLogout}
          className="mt-8 inline-flex items-center justify-center w-full sm:w-auto px-6 py-3 bg-neutral-600 dark:bg-neutral-700 text-white font-semibold text-sm rounded-lg hover:bg-neutral-700 dark:hover:bg-neutral-600 focus:outline-none focus:ring-2 focus:ring-neutral-500 focus:ring-offset-2 dark:focus:ring-offset-neutral-900 transition-colors duration-200"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </button>
      </div>
    </div>
  );
}

export default PendingApprovalPage;

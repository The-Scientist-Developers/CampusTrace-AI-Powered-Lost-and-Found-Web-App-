import React, { useState, useEffect, useCallback } from "react";
import { supabase, getAccessToken, API_BASE_URL } from "../../../api/apiClient";
import { toast } from "sonner";
import {
  Database,
  Download,
  Loader2,
  RefreshCw,
  AlertTriangle,
  Calendar,
  HardDrive,
} from "lucide-react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

const BackupPageSkeleton = () => (
  <div className="space-y-6">
    <div>
      <Skeleton width={200} height={32} />
      <Skeleton width={400} height={20} className="mt-2" />
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Skeleton height={200} />
      <Skeleton height={200} />
    </div>
    <Skeleton height={400} />
  </div>
);

const formatBytes = (bytes) => {
  if (!bytes || bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
};

const formatDate = (dateString) => {
  if (!dateString) return "Unknown";
  try {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (error) {
    return "Invalid date";
  }
};

const AdminBackupPage = ({ user }) => {
  const [backups, setBackups] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isDownloading, setIsDownloading] = useState(null);

  const fetchBackups = useCallback(async () => {
    try {
      setLoadingList(true);
      const token = await getAccessToken();

      const response = await fetch(`${API_BASE_URL}/api/backup/list`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch backups");
      }

      const data = await response.json();
      setBackups(data.backups || []);
    } catch (error) {
      console.error("Error fetching backups:", error);
      toast.error("Failed to fetch backups");
      setBackups([]);
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    fetchBackups();
  }, [fetchBackups]);

  const handleCreateBackup = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to create a new backup? This will generate a JSON file with all your university's data."
    );

    if (!confirmed) return;

    try {
      setIsBackingUp(true);
      toast.info("Creating backup...", { duration: 2000 });

      const token = await getAccessToken();

      const response = await fetch(`${API_BASE_URL}/api/backup/create`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to create backup");
      }

      const data = await response.json();
      toast.success("Backup created successfully!");

      // Refresh the backup list
      await fetchBackups();
    } catch (error) {
      console.error("Error creating backup:", error);
      toast.error(error.message || "Failed to create backup");
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleDownloadBackup = async (fileName) => {
    try {
      setIsDownloading(fileName);
      toast.info("Downloading backup...", { duration: 2000 });

      const token = await getAccessToken();

      const response = await fetch(
        `${API_BASE_URL}/api/backup/download/${encodeURIComponent(fileName)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to download backup");
      }

      // Create a blob from the response
      const blob = await response.blob();

      // Create a temporary URL for the blob
      const url = window.URL.createObjectURL(blob);

      // Create a temporary anchor element and trigger download
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();

      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("Backup downloaded successfully!");
    } catch (error) {
      console.error("Error downloading backup:", error);
      toast.error("Failed to download backup");
    } finally {
      setIsDownloading(null);
    }
  };

  if (loadingList && backups.length === 0) {
    return (
      <div className="p-6">
        <BackupPageSkeleton />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white flex items-center gap-3">
          <Database className="w-8 h-8 text-indigo-500" />
          Backup & Restore
        </h1>
        <p className="text-neutral-600 dark:text-neutral-400 mt-2">
          Manage data backups for your university
        </p>
      </div>

      {/* Warning Card */}
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-amber-900 dark:text-amber-100 mb-1">
              Important Information
            </h3>
            <p className="text-sm text-amber-800 dark:text-amber-200">
              This page allows you to <strong>download backups</strong> of your
              university's data. Restoring data from a backup is a manual
              process that must be performed by the system developer. If you
              need to restore data, please download the backup file and contact
              technical support.
            </p>
          </div>
        </div>
      </div>

      {/* Action Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Create Backup Card */}
        <div className="bg-white dark:bg-[#2a2a2a] border border-neutral-200 dark:border-[#3a3a3a] rounded-lg p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
              <Database className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
                Create New Backup
              </h2>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                Generate a complete data backup
              </p>
            </div>
          </div>

          <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
            This will create a comprehensive JSON backup file containing all
            data associated with your university, including profiles, items,
            claims, conversations, and settings.
          </p>

          <button
            onClick={handleCreateBackup}
            disabled={isBackingUp}
            className="w-full px-4 py-2.5 bg-indigo-500 hover:bg-indigo-600 disabled:bg-neutral-300 dark:disabled:bg-neutral-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            {isBackingUp ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating Backup...
              </>
            ) : (
              <>
                <Database className="w-4 h-4" />
                Create Backup
              </>
            )}
          </button>
        </div>

        {/* Info Card */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-3">
            What gets backed up?
          </h2>
          <ul className="space-y-2 text-sm text-neutral-700 dark:text-neutral-300">
            <li className="flex items-start gap-2">
              <span className="text-indigo-500 mt-0.5">•</span>
              <span>User profiles and authentication data</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-indigo-500 mt-0.5">•</span>
              <span>Lost and found items</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-indigo-500 mt-0.5">•</span>
              <span>Claims and verifications</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-indigo-500 mt-0.5">•</span>
              <span>Conversations and messages</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-indigo-500 mt-0.5">•</span>
              <span>Notifications and settings</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-indigo-500 mt-0.5">•</span>
              <span>Allowed domains and site configuration</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Existing Backups Card */}
      <div className="bg-white dark:bg-[#2a2a2a] border border-neutral-200 dark:border-[#3a3a3a] rounded-lg shadow-sm">
        <div className="p-6 border-b border-neutral-200 dark:border-[#3a3a3a]">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">
              Existing Backups
            </h2>
            <button
              onClick={fetchBackups}
              disabled={loadingList}
              className="px-3 py-2 text-sm bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-lg transition-colors flex items-center gap-2"
            >
              <RefreshCw
                className={`w-4 h-4 ${loadingList ? "animate-spin" : ""}`}
              />
              Refresh
            </button>
          </div>
        </div>

        <div className="p-6">
          {loadingList ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} height={80} />
              ))}
            </div>
          ) : backups.length === 0 ? (
            <div className="text-center py-12">
              <Database className="w-16 h-16 text-neutral-300 dark:text-neutral-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-neutral-900 dark:text-white mb-2">
                No backups yet
              </h3>
              <p className="text-neutral-600 dark:text-neutral-400 mb-6">
                Create your first backup to get started
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {backups.map((backup) => (
                <div
                  key={backup.name}
                  className="border border-neutral-200 dark:border-[#3a3a3a] rounded-lg p-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-neutral-900 dark:text-white mb-2 truncate">
                        {backup.name}
                      </h3>
                      <div className="flex flex-wrap gap-4 text-sm text-neutral-600 dark:text-neutral-400">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(backup.created_at)}</span>
                        </div>
                        {backup.metadata?.size && (
                          <div className="flex items-center gap-1.5">
                            <HardDrive className="w-4 h-4" />
                            <span>{formatBytes(backup.metadata.size)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDownloadBackup(backup.name)}
                      disabled={isDownloading === backup.name}
                      className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 disabled:bg-neutral-300 dark:disabled:bg-neutral-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2 justify-center whitespace-nowrap"
                    >
                      {isDownloading === backup.name ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Downloading...
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4" />
                          Download
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminBackupPage;

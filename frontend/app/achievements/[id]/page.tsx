'use client';

import { useState, useEffect, use } from 'react';
import api from '../../../lib/api';
import Link from 'next/link';

export default function AchievementDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [achievement, setAchievement] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);

  useEffect(() => {
    fetchAchievement();
  }, [id]);

  const fetchAchievement = async () => {
    try {
      setLoading(true);
      const response = await api.get(
        `/achievements/${id}`
      );
      setAchievement(response.data.data);
    } catch (err) {
      setError('Error fetching achievement details');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    try {
      setApproving(true);
      await api.put(
        `/achievements/${id}/approve`
      );
      fetchAchievement();
    } catch (err) {
      setError('Error approving achievement');
    } finally {
      setApproving(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      setError('Please provide a rejection reason');
      return;
    }

    try {
      setRejecting(true);
      await api.put(
        `/achievements/${id}/reject`,
        { rejectionReason }
      );
      fetchAchievement();
      setShowRejectForm(false);
      setRejectionReason('');
    } catch (err) {
      setError('Error rejecting achievement');
    } finally {
      setRejecting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4 flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  if (!achievement) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4 flex items-center justify-center">
        <p className="text-gray-600">Achievement not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Achievement Details</h1>
          <Link href="/achievements" className="text-blue-600 hover:text-blue-700">
            ← Back
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {/* Status Badge */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{achievement.achievementTitle}</h2>
              <p className="text-gray-600 mt-1">
                By {achievement.studentName} ({achievement.usn})
              </p>
            </div>
            <span
              className={`px-4 py-2 rounded-full text-sm font-semibold ${
                achievement.status === 'approved'
                  ? 'bg-green-100 text-green-800'
                  : achievement.status === 'pending'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-red-100 text-red-800'
              }`}
            >
              {achievement.status.charAt(0).toUpperCase() + achievement.status.slice(1)}
            </span>
          </div>

          <hr className="my-6" />

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <p className="text-sm text-gray-600">Category</p>
              <p className="text-lg font-semibold text-gray-900">{achievement.category}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Department</p>
              <p className="text-lg font-semibold text-gray-900">{achievement.department}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Achievement Date</p>
              <p className="text-lg font-semibold text-gray-900">
                {new Date(achievement.achievementDate).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Created At</p>
              <p className="text-lg font-semibold text-gray-900">
                {new Date(achievement.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          <hr className="my-6" />

          {/* Description */}
          <div className="mb-6">
            <p className="text-sm text-gray-600 mb-2">Description</p>
            <p className="text-gray-900 leading-relaxed">{achievement.description}</p>
          </div>

          {/* Certificate Link */}
          {achievement.certificateLink && (
            <div className="mb-6">
              <p className="text-sm text-gray-600 mb-2">Certificate</p>
              <a
                href={achievement.certificateLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-700 underline"
              >
                View Certificate
              </a>
            </div>
          )}

          {/* Rejection Reason */}
          {achievement.status === 'rejected' && achievement.rejectionReason && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">Rejection Reason</p>
              <p className="text-red-700">{achievement.rejectionReason}</p>
            </div>
          )}

          <hr className="my-6" />

          {/* Action Buttons */}
          <div className="flex gap-4 flex-wrap">
            <Link
              href={`/achievements/${achievement._id}/edit`}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition"
            >
              Edit
            </Link>

            {achievement.status === 'pending' && (
              <>
                <button
                  onClick={handleApprove}
                  disabled={approving}
                  className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition disabled:opacity-50"
                >
                  {approving ? 'Approving...' : 'Approve'}
                </button>
                <button
                  onClick={() => setShowRejectForm(!showRejectForm)}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition"
                >
                  Reject
                </button>
              </>
            )}
          </div>

          {/* Rejection Form */}
          {showRejectForm && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rejection Reason *
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500"
              />
              <div className="flex gap-2 mt-3">
                <button
                  onClick={handleReject}
                  disabled={rejecting || !rejectionReason.trim()}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition disabled:opacity-50"
                >
                  {rejecting ? 'Rejecting...' : 'Confirm Rejection'}
                </button>
                <button
                  onClick={() => {
                    setShowRejectForm(false);
                    setRejectionReason('');
                  }}
                  className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

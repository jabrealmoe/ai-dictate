import React, { useState } from 'react';
import { invoke } from '@forge/bridge';
import { AlertCircle, CheckCircle2, Loader2, X, Plus } from 'lucide-react';

const IssueReview = ({ suggestions, onCancel, onIssueCreated, context }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleCreate = async (suggestion) => {
    setLoading(true);
    setError(null);
    try {
      // Determine project key from context or if it was returned in suggestion
      // Prioritize context as it's safer for Forge apps running in Jira
      const projectKey = context?.extension?.project?.key || context?.extension?.issue?.key?.split('-')[0];

      if (!projectKey) {
          throw new Error("Could not determine Project Key from context.");
      }

      const payload = {
          summary: suggestion.summary,
          description: suggestion.description,
          issueType: suggestion.issue_type,
          priority: suggestion.priority,
          projectKey: projectKey
      };

      const result = await invoke('createJiraIssue', payload);
      onIssueCreated(result);
    } catch (err) {
      console.error("Failed to create issue:", err);
      setError(err.message || "Failed to create issue.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-4 bg-white rounded-lg shadow-sm border border-slate-200">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-slate-800">Review AI Suggestion</h3>
        <button onClick={onCancel} className="text-slate-400 hover:text-slate-600">
          <X className="w-5 h-5" />
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm flex items-center">
            <AlertCircle className="w-4 h-4 mr-2"/>
            {error}
        </div>
      )}

      <div className="space-y-4">
        {suggestions.map((suggestion, index) => (
          <div key={index} className="p-4 bg-slate-50 rounded-md border border-slate-100 space-y-2">
            <div>
               <label className="text-xs font-medium text-slate-500 uppercase">Summary</label>
               <p className="font-medium text-slate-800">{suggestion.summary}</p>
            </div>
            
            {suggestion.description && (
                <div>
                    <label className="text-xs font-medium text-slate-500 uppercase">Description</label>
                    <p className="text-sm text-slate-600 whitespace-pre-wrap">{suggestion.description}</p>
                </div>
            )}

            <div className="flex gap-4">
                <div>
                   <label className="text-xs font-medium text-slate-500 uppercase">Type</label>
                   <p className="text-sm text-slate-700">{suggestion.issue_type || 'Task'}</p>
                </div>
                {suggestion.priority && (
                    <div>
                       <label className="text-xs font-medium text-slate-500 uppercase">Priority</label>
                       <p className="text-sm text-slate-700">{suggestion.priority}</p>
                    </div>
                )}
            </div>

            <button
                onClick={() => handleCreate(suggestion)}
                disabled={loading}
                className="w-full mt-4 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium text-sm flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {loading ? (
                    <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin"/> Creating...
                    </>
                ) : (
                    <>
                        <Plus className="w-4 h-4 mr-2"/> Create Issue
                    </>
                )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default IssueReview;

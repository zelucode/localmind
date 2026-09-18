import React, { useState, useEffect } from 'react';
import { X, Sparkles, Send, Bot, AlertCircle, RefreshCw } from 'lucide-react';

interface AIAdvisorModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPrompt?: string;
}

export const AIAdvisorModal: React.FC<AIAdvisorModalProps> = ({
  isOpen,
  onClose,
  initialPrompt = '',
}) => {
  const [prompt, setPrompt] = useState(initialPrompt);
  const [response, setResponse] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialPrompt) {
      setPrompt(initialPrompt);
    }
  }, [initialPrompt]);

  if (!isOpen) return null;

  const handleAsk = async (queryToAsk?: string) => {
    const activeQuery = queryToAsk || prompt;
    if (!activeQuery.trim()) return;

    setIsLoading(true);
    setError(null);
    setResponse(null);

    try {
      const res = await fetch('/api/ai/advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: activeQuery.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.fallbackAdvice) {
          setResponse(data.fallbackAdvice);
        } else {
          setError(data.error || 'Failed to generate guidance.');
        }
      } else {
        setResponse(data.advice);
      }
    } catch {
      setError('Network error contacting advisor.');
    } finally {
      setIsLoading(false);
    }
  };

  const sampleQuestions = [
    'How do I edit and refactor local code files for free without paid subscriptions?',
    'Which free AI has the best up-to-date web search with verified sources?',
    'How do I configure OmniRoute with free Google Gemini and Groq API keys?',
    'What tools can I use to build full-stack web applications with free credits?',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        id="modal-ai-advisor"
        className="border rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden transition-colors"
        style={{
          backgroundColor: 'var(--theme-card)',
          borderColor: 'var(--theme-border)',
          color: 'var(--theme-text)',
        }}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--theme-border)' }}>
          <div className="flex items-center gap-2.5">
            <div
              className="p-2 rounded-lg border"
              style={{
                backgroundColor: 'var(--theme-raised)',
                borderColor: 'var(--theme-border)',
                color: 'var(--theme-primary)',
              }}
            >
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold" style={{ color: 'var(--theme-text)' }}>
                AI Nexus Free Tier Advisor
              </h2>
              <p className="text-xs" style={{ color: 'var(--theme-text-secondary)' }}>
                Ask how to solve any task using 100% free AI tools, local agents, or OmniRoute.
              </p>
            </div>
          </div>
          <button
            id="btn-close-advisor"
            onClick={onClose}
            className="p-1.5 rounded-lg transition-colors cursor-pointer opacity-70 hover:opacity-100"
            style={{ color: 'var(--theme-text)' }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-4">
          {/* Quick Prompts */}
          <div>
            <span className="text-xs font-medium mb-2 block" style={{ color: 'var(--theme-text-muted)' }}>
              Suggested Questions:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {sampleQuestions.map((q) => (
                <button
                  key={q}
                  onClick={() => {
                    setPrompt(q);
                    handleAsk(q);
                  }}
                  className="text-left text-xs p-2.5 rounded-lg border transition-colors cursor-pointer hover:opacity-85"
                  style={{
                    backgroundColor: 'var(--theme-raised)',
                    borderColor: 'var(--theme-border)',
                    color: 'var(--theme-text-secondary)',
                  }}
                >
                  "{q}"
                </button>
              ))}
            </div>
          </div>

          {/* User Input Form */}
          <div className="relative">
            <textarea
              id="input-advisor-prompt"
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe what you want to build or do, and get recommendations for free tools and local agents..."
              className="w-full p-3 rounded-xl text-xs focus:outline-none resize-none"
              style={{
                backgroundColor: 'var(--theme-raised)',
                borderColor: 'var(--theme-border)',
                borderWidth: '1px',
                borderStyle: 'solid',
                color: 'var(--theme-text)',
              }}
            />
            <button
              id="btn-submit-advisor"
              onClick={() => handleAsk()}
              disabled={isLoading || !prompt.trim()}
              className="absolute bottom-3 right-3 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1.5 active:scale-95"
              style={{
                backgroundColor: 'var(--theme-primary)',
                color: 'var(--theme-primary-foreground, #000000)',
              }}
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Thinking...
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" /> Consult Advisor
                </>
              )}
            </button>
          </div>

          {/* Error display */}
          {error && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Response Display */}
          {response && (
            <div
              className="p-4 rounded-xl border text-xs leading-relaxed space-y-2 animate-in fade-in"
              style={{
                backgroundColor: 'var(--theme-raised)',
                borderColor: 'var(--theme-border)',
                color: 'var(--theme-text)',
              }}
            >
              <div className="flex items-center gap-1.5 font-semibold" style={{ color: 'var(--theme-primary)' }}>
                <Bot className="w-4 h-4" />
                <span>Advisor Recommendation:</span>
              </div>
              <div className="whitespace-pre-wrap font-sans opacity-95">
                {response}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

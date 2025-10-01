import React, { useState } from 'react';
import { ExternalLink, ArrowRight, Mail, Phone, Calendar, FileText, CheckCircle, XCircle } from 'lucide-react';
import { ItemParser, ParsedItem, ItemAction } from '@/lib/item-parser';

const ActionIcon = ({ type }: { type: ItemAction['type'] }) => {
  const iconClass = "w-5 h-5";
  switch (type) {
    case 'link': return <ExternalLink className={iconClass} />;
    case 'list-nav': return <ArrowRight className={iconClass} />;
    case 'email': return <Mail className={iconClass} />;
    case 'phone': return <Phone className={iconClass} />;
    case 'calendar': return <Calendar className={iconClass} />;
    case 'text': return <FileText className={iconClass} />;
  }
};

// Main Component
export default function ParserTester() {
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<ParsedItem[]>([]);
  const parser = new ItemParser();

  const examples = [
    '☕ [Book a Coffee](https://cal.com/meet)',
    '→ Grocery Shopping List',
    'john.doe@example.com',
    '@jane@company.com?subject=Meeting Request',
    'tel:+1-555-123-4567',
    'call:555-0123',
    'cal:team-standup',
    'https://github.com/user/repo',
    '🎵 Play a focus playlist',
    'javascript:alert(1)',
    'https://google.com@evil.com'
  ];

  const handleTest = () => {
    if (!input.trim()) return;
    const parsed = parser.parse(input);
    setHistory([parsed, ...history]);
    setInput('');
  };

  const handleExample = (example: string) => {
    setInput(example);
    const parsed = parser.parse(example);
    setHistory([parsed, ...history]);
  };

  const clearHistory = () => setHistory([]);

  const currentParsed = input.trim() ? parser.parse(input) : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Interactive Parser Tester
          </h1>
          <p className="text-slate-400">Test the modular item parser with various input patterns</p>
        </div>

        {/* Input Section */}
        <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-lg p-6 space-y-4">
          <div className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleTest()}
              placeholder="Enter text to parse..."
              className="flex-1 bg-slate-900/50 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleTest}
              className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Test
            </button>
          </div>

          {/* Live Preview */}
          {currentParsed && (
            <div className="bg-slate-900/50 border border-slate-600 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <span>Live Preview:</span>
                {currentParsed.action.type !== 'text' ? (
                  <CheckCircle className="w-4 h-4 text-green-400" />
                ) : (
                  <XCircle className="w-4 h-4 text-yellow-400" />
                )}
              </div>
              <div className="flex items-center gap-3 p-3 bg-slate-800 rounded border border-slate-700">
                <ActionIcon type={currentParsed.action.type} />
                <div className="flex-1">
                  <div className="font-medium">
                    {currentParsed.emoji && <span className="mr-2">{currentParsed.emoji}</span>}
                    <span className={currentParsed.action.type === 'link' ? 'text-blue-400 underline' : ''}>
                      {currentParsed.action.type === 'link' && currentParsed.action.display}
                      {currentParsed.action.type === 'list-nav' && `→ ${currentParsed.action.display}`}
                      {currentParsed.action.type === 'email' && currentParsed.action.display}
                      {currentParsed.action.type === 'phone' && currentParsed.action.display}
                      {currentParsed.action.type === 'calendar' && currentParsed.action.display}
                      {currentParsed.action.type === 'text' && currentParsed.action.content}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    Type: <span className="text-purple-400 font-mono">{currentParsed.action.type}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Examples */}
        <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-lg p-6 space-y-4">
          <h2 className="text-xl font-semibold">Quick Examples</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {examples.map((example, idx) => (
              <button
                key={idx}
                onClick={() => handleExample(example)}
                className="text-left bg-slate-900/50 hover:bg-slate-900 border border-slate-700 hover:border-slate-600 rounded-lg px-4 py-2 text-sm transition-colors"
              >
                <code className="text-blue-300">{example}</code>
              </button>
            ))}
          </div>
        </div>

        {/* Test History */}
        <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-lg p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Test History ({history.length})</h2>
            {history.length > 0 && (
              <button
                onClick={clearHistory}
                className="text-sm text-slate-400 hover:text-white transition-colors"
              >
                Clear All
              </button>
            )}
          </div>
          
          {history.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              No tests yet. Try entering some text above or click an example.
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {history.map((parsed, idx) => (
                <div key={idx} className="bg-slate-900/50 border border-slate-700 rounded-lg p-4 space-y-2">
                  <div className="flex items-start gap-3">
                    <ActionIcon type={parsed.action.type} />
                    <div className="flex-1 min-w-0">
                      <div className="font-mono text-sm text-slate-400 mb-2 break-all">
                        Input: "{parsed.original}"
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-slate-500">Type:</span>{' '}
                          <span className="text-purple-400 font-mono">{parsed.action.type}</span>
                        </div>
                        {parsed.emoji && (
                          <div>
                            <span className="text-slate-500">Emoji:</span>{' '}
                            <span>{parsed.emoji}</span>
                          </div>
                        )}
                        {parsed.action.type === 'link' && (
                          <>
                            <div className="col-span-2">
                              <span className="text-slate-500">URL:</span>{' '}
                              <span className="text-blue-400 break-all">{parsed.action.url}</span>
                            </div>
                            <div className="col-span-2">
                              <span className="text-slate-500">Display:</span>{' '}
                              <span className="text-green-400">{parsed.action.display}</span>
                            </div>
                          </>
                        )}
                        {parsed.action.type === 'list-nav' && (
                          <div className="col-span-2">
                            <span className="text-slate-500">List Name:</span>{' '}
                            <span className="text-green-400">{parsed.action.listName}</span>
                          </div>
                        )}
                        {parsed.action.type === 'email' && (
                          <>
                            <div className="col-span-2">
                              <span className="text-slate-500">Address:</span>{' '}
                              <span className="text-green-400">{parsed.action.address}</span>
                            </div>
                            {parsed.action.subject && (
                              <div className="col-span-2">
                                <span className="text-slate-500">Subject:</span>{' '}
                                <span className="text-green-400">{parsed.action.subject}</span>
                              </div>
                            )}
                          </>
                        )}
                        {parsed.action.type === 'phone' && (
                          <div className="col-span-2">
                            <span className="text-slate-500">Number:</span>{' '}
                            <span className="text-green-400">{parsed.action.number}</span>
                          </div>
                        )}
                        {parsed.action.type === 'calendar' && (
                          <div className="col-span-2">
                            <span className="text-slate-500">Action:</span>{' '}
                            <span className="text-green-400">{parsed.action.action}</span>
                          </div>
                        )}
                        {parsed.action.type === 'text' && (
                          <div className="col-span-2">
                            <span className="text-slate-500">Content:</span>{' '}
                            <span className="text-yellow-400">{parsed.action.content}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Documentation */}
        <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-lg p-6 space-y-4">
          <h2 className="text-xl font-semibold">Supported Patterns</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <div className="font-medium text-blue-400">Links</div>
              <code className="block bg-slate-900 p-2 rounded text-xs">[Display](url)</code>
              <code className="block bg-slate-900 p-2 rounded text-xs">https://example.com</code>
            </div>
            <div className="space-y-2">
              <div className="font-medium text-purple-400">List Navigation</div>
              <code className="block bg-slate-900 p-2 rounded text-xs">→ List Name</code>
              <code className="block bg-slate-900 p-2 rounded text-xs">-&gt; List Name</code>
            </div>
            <div className="space-y-2">
              <div className="font-medium text-green-400">Email</div>
              <code className="block bg-slate-900 p-2 rounded text-xs">user@example.com</code>
              <code className="block bg-slate-900 p-2 rounded text-xs">@user@example.com?subject=Hi</code>
            </div>
            <div className="space-y-2">
              <div className="font-medium text-yellow-400">Phone</div>
              <code className="block bg-slate-900 p-2 rounded text-xs">tel:+1-555-0123</code>
              <code className="block bg-slate-900 p-2 rounded text-xs">555-0123</code>
            </div>
            <div className="space-y-2">
              <div className="font-medium text-pink-400">Calendar</div>
              <code className="block bg-slate-900 p-2 rounded text-xs">cal:meeting-name</code>
              <code className="block bg-slate-900 p-2 rounded text-xs">calendar:standup</code>
            </div>
            <div className="space-y-2">
              <div className="font-medium text-orange-400">Security</div>
              <div className="text-slate-400 text-xs">
                ✓ Only http/https allowed<br/>
                ✓ Blocks phishing URLs<br/>
                ✓ Validates email format
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
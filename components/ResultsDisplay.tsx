
import React, { useState } from 'react';
import { ApiResponse, Source } from '../types';
import { ChevronDownIcon } from './icons';

interface ResultsDisplayProps {
  response: ApiResponse;
  onFollowUp: (question: string) => void;
}

const ConfidenceBadge: React.FC<{ confidence: ApiResponse['confidence'] }> = ({ confidence }) => {
    const confidenceStyles = {
        high: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
        medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
        low: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    };
    return (
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${confidenceStyles[confidence]}`}>
            {confidence.charAt(0).toUpperCase() + confidence.slice(1)} Confidence
        </span>
    );
};

const SourceItem: React.FC<{ source: Source }> = ({ source }) => {
    return (
        <div className="p-3 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-700 dark:text-gray-300 italic">"{source.quote}"</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-right">
                - {source.file} ({source.location})
            </p>
        </div>
    );
};

const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ response, onFollowUp }) => {
    const [isExplanationVisible, setIsExplanationVisible] = useState(false);
    const [areSourcesVisible, setAreSourcesVisible] = useState(false);

    return (
        <div className="w-full bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 animate-fade-in">
            <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Answer</h2>
                <ConfidenceBadge confidence={response.confidence} />
            </div>
            
            <p className="text-gray-700 dark:text-gray-300 mb-4">{response.answer}</p>

            {response.explanation && (
                <button
                    onClick={() => setIsExplanationVisible(!isExplanationVisible)}
                    className="text-sm font-medium text-primary hover:underline mb-4"
                >
                    {isExplanationVisible ? 'Hide' : 'Read more'} explanation
                </button>
            )}

            {isExplanationVisible && (
                <div className="prose prose-sm dark:prose-invert max-w-none mb-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-md">
                    <p>{response.explanation}</p>
                </div>
            )}
            
            {response.sources.length > 0 && (
                 <div>
                    <button
                        onClick={() => setAreSourcesVisible(!areSourcesVisible)}
                        className="flex items-center justify-between w-full text-left font-semibold text-gray-800 dark:text-gray-200 py-2 border-b-2 border-gray-200 dark:border-gray-700"
                    >
                        <span>Sources</span>
                        <ChevronDownIcon className={`w-5 h-5 transition-transform ${areSourcesVisible ? 'rotate-180' : ''}`} />
                    </button>
                    {areSourcesVisible && (
                        <div className="mt-2 bg-gray-50 dark:bg-gray-900/50 rounded-md overflow-hidden">
                           {response.sources.map((source, index) => (
                                <SourceItem key={index} source={source} />
                           ))}
                        </div>
                    )}
                 </div>
            )}

            {response.follow_up_questions.length > 0 && (
                <div className="mt-6">
                    <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">Suggested follow-up questions:</h3>
                    <div className="flex flex-wrap gap-2">
                        {response.follow_up_questions.map((q, i) => (
                            <button
                                key={i}
                                onClick={() => onFollowUp(q)}
                                className="px-3 py-1.5 text-sm bg-primary-100 dark:bg-primary-900/50 text-primary-800 dark:text-primary-200 rounded-full hover:bg-primary-200 dark:hover:bg-primary-800/80 transition-colors"
                            >
                                {q}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ResultsDisplay;

// frontend/src/pages/AdminPage.tsx  
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '../components/ui/alert';

interface TranscriptionConfig {
    openai_api_url: string;
    openai_api_key: string;
    model_name: string;
    max_concurrent_jobs: number;
}

interface RefinementConfig {
    openai_api_url: string;
    openai_api_key: string;
    model_name: string;
    fast_model_name: string;
    system_prompt: string;
}

export const AdminPage = () => {
    const [transcriptionConfig, setTranscriptionConfig] = useState<TranscriptionConfig>({
        openai_api_url: '',
        openai_api_key: '',
        model_name: '',
        max_concurrent_jobs: 0
    });

    const [refinementConfig, setRefinementConfig] = useState<RefinementConfig>({
        openai_api_url: '',
        openai_api_key: '',
        model_name: '',
        fast_model_name: '',
        system_prompt: ''
    });

    const [saveStatus, setSaveStatus] = useState<{
        type: 'success' | 'error' | null;
        message: string;
    }>({ type: null, message: '' });

    useEffect(() => {
        // Fetch configurations on component mount
        const fetchConfigs = async () => {
            try {
                const [transcriptionRes, refinementRes] = await Promise.all([
                    fetch('/api/config/transcription'),
                    fetch('/api/config/refinement')
                ]);

                if (transcriptionRes.ok && refinementRes.ok) {
                    const transcription = await transcriptionRes.json();
                    const refinement = await refinementRes.json();
                    setTranscriptionConfig(transcription);
                    setRefinementConfig(refinement);
                }
            } catch (error) {
                setSaveStatus({
                    type: 'error',
                    message: 'Failed to load configurations'
                });
            }
        };

        fetchConfigs();
    }, []);

    const handleSave = async (type: 'transcription' | 'refinement') => {
        const config = type === 'transcription' ? transcriptionConfig : refinementConfig;
        try {
            const response = await fetch(`/api/config/${type}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(config),
            });

            if (response.ok) {
                setSaveStatus({
                    type: 'success',
                    message: `${type.charAt(0).toUpperCase() + type.slice(1)} configuration saved successfully`
                });
            } else {
                throw new Error('Failed to save configuration');
            }
        } catch (error) {
            setSaveStatus({
                type: 'error',
                message: `Failed to save ${type} configuration`
            });
        }
    };

    return (
        <div className="p-6 space-y-6">
            <h1 className="text-2xl font-bold mb-6">Admin Settings</h1>

            {saveStatus.type && (
                <Alert variant={saveStatus.type === 'success' ? 'default' : 'destructive'}>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{saveStatus.message}</AlertDescription>
                </Alert>
            )}

            {/* Transcription Configuration */}
            <Card>
                <CardHeader>
                    <CardTitle>Transcription Model Configuration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            OpenAI API URL
                        </label>
                        <input
                            type="text"
                            value={transcriptionConfig.openai_api_url}
                            onChange={(e) => setTranscriptionConfig({
                                ...transcriptionConfig,
                                openai_api_url: e.target.value
                            })}
                            className="w-full p-2 border rounded-lg"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            OpenAI API Key
                        </label>
                        <input
                            type="password"
                            value={transcriptionConfig.openai_api_key}
                            onChange={(e) => setTranscriptionConfig({
                                ...transcriptionConfig,
                                openai_api_key: e.target.value
                            })}
                            className="w-full p-2 border rounded-lg"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Model Name
                        </label>
                        <input
                            type="text"
                            value={transcriptionConfig.model_name}
                            onChange={(e) => setTranscriptionConfig({
                                ...transcriptionConfig,
                                model_name: e.target.value
                            })}
                            className="w-full p-2 border rounded-lg"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Max Concurrent Jobs
                        </label>
                        <input
                            type="number"
                            value={transcriptionConfig.max_concurrent_jobs}
                            onChange={(e) => setTranscriptionConfig({
                                ...transcriptionConfig,
                                max_concurrent_jobs: parseInt(e.target.value)
                            })}
                            className="w-full p-2 border rounded-lg"
                        />
                    </div>

                    <button
                        onClick={() => handleSave('transcription')}
                        className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600"
                    >
                        Save Transcription Settings
                    </button>
                </CardContent>
            </Card>

            {/* Refinement Configuration */}
            <Card>
                <CardHeader>
                    <CardTitle>Refinement Model Configuration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            OpenAI API URL
                        </label>
                        <input
                            type="text"
                            value={refinementConfig.openai_api_url}
                            onChange={(e) => setRefinementConfig({
                                ...refinementConfig,
                                openai_api_url: e.target.value
                            })}
                            className="w-full p-2 border rounded-lg"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            OpenAI API Key
                        </label>
                        <input
                            type="password"
                            value={refinementConfig.openai_api_key}
                            onChange={(e) => setRefinementConfig({
                                ...refinementConfig,
                                openai_api_key: e.target.value
                            })}
                            className="w-full p-2 border rounded-lg"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Model Name
                        </label>
                        <input
                            type="text"
                            value={refinementConfig.model_name}
                            onChange={(e) => setRefinementConfig({
                                ...refinementConfig,
                                model_name: e.target.value
                            })}
                            className="w-full p-2 border rounded-lg"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Fast Model Name
                        </label>
                        <input
                            type="text"
                            value={refinementConfig.fast_model_name}
                            onChange={(e) => setRefinementConfig({
                                ...refinementConfig,
                                fast_model_name: e.target.value
                            })}
                            className="w-full p-2 border rounded-lg"
                        />
                    </div>
{/* 
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            System Prompt
                        </label>
                        <textarea
                            value={refinementConfig.system_prompt}
                            onChange={(e) => setRefinementConfig({
                                ...refinementConfig,
                                system_prompt: e.target.value
                            })}
                            rows={4}
                            className="w-full p-2 border rounded-lg"
                        />
                    </div> */}

                    <button
                        onClick={() => handleSave('refinement')}
                        className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600"
                    >
                        Save Refinement Settings
                    </button>
                </CardContent>
            </Card>
        </div>
    );
};
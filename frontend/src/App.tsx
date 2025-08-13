import React, { useState, useRef } from 'react';
// Firebase imports removed
// import { initializeApp, FirebaseApp } from 'firebase/app';
// import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged, Auth } from 'firebase/auth';
// import { getFirestore, Firestore } = from 'firebase/firestore';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

// Define the shape of the backend response
interface BackendResponse {
    complexityMessage: string;
    simplifiedText: string; // This will be HTML content
    audioUrl: string | null;
    error?: string;
}

const App: React.FC = () => {
    const [inputText, setInputText] = useState<string>('');
    const [simplifiedText, setSimplifiedText] = useState<string>('');
    const [textComplexity, setTextComplexity] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');
    // Firebase related states removed
    // const [firebaseDb, setFirebaseDb] = useState<Firestore | null>(null);
    // const [firebaseAuth, setFirebaseAuth] = useState<Auth | null>(null);
    // const [userId, setUserId] = useState<string | null>(null);
    // const [isAuthReady, setIsAuthReady] = useState<boolean>(false);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const audioRef = useRef<HTMLAudioElement>(null);

    // --- State for Comprehensive Dyslexia-Friendly Formatting ---
    const [selectedFont, setSelectedFont] = useState<string>('Inter');
    const [fontSize, setFontSize] = useState<number>(16);
    const [lineHeight, setLineHeight] = useState<number>(1.5);
    const [letterSpacing, setLetterSpacing] = useState<number>(0);
    const [backgroundColor, setBackgroundColor] = useState<string>('#F3F4F6');
    const [textColor, setTextColor] = useState<string>('#1F2937');

    // Backend URL where your Flask/FastAPI application will run
    // Can be configured via Vite's environment variable `VITE_BACKEND_URL`
    const BACKEND_URL: string = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

    // Firebase initialization useEffect removed

    const handleSimplify = async (): Promise<void> => {
        setError('');
        setSimplifiedText('');
        setTextComplexity('');
        setAudioUrl(null);
        if (!inputText.trim()) {
            setError("Please enter some text to process.");
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch(`${BACKEND_URL}/process_text`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ text: inputText })
            });

            if (!response.ok) {
                const errorData: { error?: string } = await response.json();
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }

            const result: BackendResponse = await response.json();

            setTextComplexity(result.complexityMessage);
            setSimplifiedText(result.simplifiedText);
            setAudioUrl(result.audioUrl);

        } catch (err: unknown) {
            console.error("Error during text processing:", err);
            const message = err instanceof Error ? err.message : String(err);
            setError(`An error occurred: ${message}. Please ensure your backend server is running and accessible.`);
        } finally {
            setIsLoading(false);
        }
    };

    const playAudio = (): void => {
        if (audioRef.current && audioUrl) {
            audioRef.current.play().catch((e: DOMException) => console.error("Error playing audio:", e.message));
        }
    };

    // Removed the isAuthReady loading screen, as Firebase is no longer used for initial auth check.
    // The app will now render immediately.

    // Quill Modules Configuration (defines the toolbar and allowed formats)
    const modules = {
        toolbar: [
            [{ 'font': ['Inter', 'OpenDyslexic', 'Arial', 'Verdana', 'Calibri', 'Comic Sans MS', 'serif', 'sans-serif'] }],
            [{ 'size': ['small', false, 'large', 'huge'] }],
            ['bold', 'underline'],
            [{ 'color': [] }, { 'background': [] }],
            [{ 'align': [] }],
            ['clean']
        ],
    };

    // Quill Formats Configuration (formats Quill should recognize and allow)
    const formats = [
        'font', 'size', 'bold', 'underline', 'color', 'background', 'align'
    ];

    // Dynamic styles for the Quill editor container itself
    const quillContainerStyle: React.CSSProperties = {
        border: '1px solid #E5E7EB',
        borderRadius: '0.5rem',
        overflow: 'hidden',
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 font-sans bg-gray-100">
            {/* Load OpenDyslexic font from Google Fonts */}
            <link href="https://fonts.googleapis.com/css2?family=OpenDyslexic&display=swap" rel="stylesheet" />
            {/* Add other fonts if you want them specifically loaded for Quill to use */}
            <link href="https://fonts.googleapis.com/css2?family=Arial&family=Verdana&family=Calibri&family=Comic+Sans+MS&display=swap" rel="stylesheet" />


            {/* User ID Display removed as Firebase is no longer used */}

            <div className="w-full max-w-4xl bg-white rounded-xl shadow-2xl p-6 sm:p-8 lg:p-10 transform transition-all duration-300 hover:shadow-3xl">
                <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-800 mb-6 text-center">
                    Dyslexia-Friendly Text Tool
                </h1>
                <p className="text-gray-600 mb-8 text-center text-sm sm:text-base">
                    Enter text to analyze, simplify, and format for easier reading, including text-to-speech. Use the editor for direct formatting!
                </p>

                <div className="mb-6">
                    <label htmlFor="inputText" className="block text-gray-700 text-sm font-bold mb-2">
                        Enter Text:
                    </label>
                    <textarea
                        id="inputText"
                        className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 ease-in-out text-gray-800 resize-y min-h-[150px] shadow-sm"
                        placeholder="Paste your text here..."
                        value={inputText}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInputText(e.target.value)}
                        rows={8}
                    ></textarea>
                </div>

                <button
                    onClick={handleSimplify}
                    className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold py-3 px-6 rounded-lg hover:from-blue-600 hover:to-indigo-700 transition duration-300 ease-in-out transform hover:scale-105 shadow-md flex items-center justify-center text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <>
                            <svg className="animate-spin h-5 w-5 mr-3 text-white" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Processing...
                        </>
                    ) : (
                        'Process Text (Analyze, Simplify, Speak)'
                    )}
                </button>

                {error && (
                    <div className="mt-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm shadow-sm" role="alert">
                        {error}
                    </div>
                )}

                {/* --- Formatting Options (Global) --- */}
                <div className="mt-8 p-6 bg-gray-50 rounded-lg shadow-inner">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Global Reading Preferences</h2>
                    <p className="text-gray-600 text-sm mb-4">These settings will apply to the entire simplified text editor below.</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {/* Font Selection (for Quill's root style) */}
                        <div>
                            <label htmlFor="font-select" className="block text-gray-700 text-sm font-bold mb-2">Base Font:</label>
                            <select
                                id="font-select"
                                className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                value={selectedFont}
                                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedFont(e.target.value)}
                            >
                                <option value="Inter">Default (Inter)</option>
                                <option value="OpenDyslexic">OpenDyslexic</option>
                                <option value="Arial">Arial</option>
                                <option value="Verdana">Verdana</option>
                                <option value="Calibri">Calibri</option>
                                <option value="Comic Sans MS">Comic Sans MS</option>
                            </select>
                        </div>

                        {/* Font Size */}
                        <div>
                            <label htmlFor="font-size-slider" className="block text-gray-700 text-sm font-bold mb-2">Base Font Size: {fontSize}px</label>
                            <input
                                type="range"
                                id="font-size-slider"
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                min="12"
                                max="24"
                                step="1"
                                value={fontSize}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFontSize(parseInt(e.target.value))}
                            />
                        </div>

                        {/* Line Height */}
                        <div>
                            <label htmlFor="line-height-slider" className="block text-gray-700 text-sm font-bold mb-2">Line Spacing: {lineHeight.toFixed(1)}x</label>
                            <input
                                type="range"
                                id="line-height-slider"
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                min="1.0"
                                max="2.0"
                                step="0.1"
                                value={lineHeight}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLineHeight(parseFloat(e.target.value))}
                            />
                        </div>

                        {/* Letter Spacing */}
                        <div>
                            <label htmlFor="letter-spacing-slider" className="block text-gray-700 text-sm font-bold mb-2">Letter Spacing: {letterSpacing.toFixed(1)}px</label>
                            <input
                                type="range"
                                id="letter-spacing-slider"
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                min="0"
                                max="2"
                                step="0.1"
                                value={letterSpacing}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLetterSpacing(parseFloat(e.target.value))}
                            />
                        </div>

                        {/* Background Color */}
                        <div>
                            <label htmlFor="bg-color-select" className="block text-gray-700 text-sm font-bold mb-2">Background Color:</label>
                            <select
                                id="bg-color-select"
                                className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                value={backgroundColor}
                                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setBackgroundColor(e.target.value)}
                            >
                                <option value="#F3F4F6">Light Gray (Default)</option>
                                <option value="#FFFFFF">White</option>
                                <option value="#FFFBEB">Light Yellow</option>
                                <option value="#E0F2F7">Light Blue</option>
                                <option value="#FEF2F2">Light Pink</option>
                                <option value="#1F2937">Dark Gray (Inverse)</option>
                                <option value="#000000">Black (Inverse)</option>
                            </select>
                        </div>

                        {/* Text Color */}
                        <div>
                            <label htmlFor="text-color-select" className="block text-gray-700 text-sm font-bold mb-2">Text Color:</label>
                            <select
                                id="text-color-select"
                                className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                value={textColor}
                                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setTextColor(e.target.value)}
                            >
                                <option value="#1F2937">Dark Gray (Default)</option>
                                <option value="#000000">Black</option>
                                <option value="#0B5394">Dark Blue</option>
                                <option value="#FFFFFF">White (Inverse)</option>
                            </select>
                        </div>
                    </div>
                </div>

                {textComplexity && (
                    <div className="mt-6 p-4 bg-blue-50 border border-blue-200 text-blue-800 rounded-lg shadow-sm">
                        <h2 className="text-xl font-semibold mb-2">Complexity Analysis:</h2>
                        <p className="text-gray-700">{textComplexity}</p>
                    </div>
                )}

                {/* Simplified Text Editor */}
                {simplifiedText && (
                    <div className="mt-6 rounded-lg shadow-sm" style={quillContainerStyle}>
                        <h2 className="text-xl font-semibold mb-2 p-4 pb-0" style={{ color: textColor }}>Simplified Text (Editable):</h2>
                        <ReactQuill
                            theme="snow"
                            value={simplifiedText}
                            onChange={setSimplifiedText}
                            modules={modules}
                            formats={formats}
                            ref={(el: ReactQuill | null) => { // Corrected type for ref
                                if (el && el.editor) {
                                    const editor = el.editor;
                                    const quillElement = editor.container.querySelector('.ql-editor') as HTMLElement | null;
                                    if (quillElement) {
                                        quillElement.style.fontSize = `${fontSize}px`;
                                        quillElement.style.lineHeight = String(lineHeight);
                                        quillElement.style.letterSpacing = `${letterSpacing}px`;
                                        quillElement.style.backgroundColor = backgroundColor;
                                        quillElement.style.color = textColor;
                                    }
                                }
                            }}
                        />
                        {/* These checkboxes are now just visual indicators since Quill's toolbar handles actual formatting */}
                        <div className="flex items-center p-4">
                            <input
                                type="checkbox"
                                id="global-bold-toggle"
                                className="form-checkbox h-5 w-5 text-blue-600 rounded"
                                checked={false}
                                readOnly
                            />
                            <label htmlFor="global-bold-toggle" className="ml-2 text-gray-700 text-sm font-bold">Bold Selected Text (Use Quill Toolbar)</label>
                        </div>
                        <div className="flex items-center p-4">
                            <input
                                type="checkbox"
                                id="global-underline-toggle"
                                className="form-checkbox h-5 w-5 text-purple-600 rounded"
                                checked={false}
                                readOnly
                            />
                            <label htmlFor="global-underline-toggle" className="ml-2 text-gray-700 text-sm font-bold">Underline Selected Text (Use Quill Toolbar)</label>
                        </div>

                        {audioUrl && (
                            <div className="mt-4 p-4 flex items-center justify-center">
                                <button
                                    onClick={playAudio}
                                    className="bg-purple-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-purple-700 transition duration-300 ease-in-out transform hover:scale-105 shadow-md flex items-center text-md"
                                >
                                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M9.383 3.064A1 1 0 0110 3.868v12.264a1 1 0 01-1.617.792L4.032 11.5a1 1 0 00-.547-.145L1 11.383V8.617l2.485-.091a1 1 0 00.547-.145l4.351-4.351a1 1 0 011.334.064zM16.5 10a.5.5 0 000-1c-2.3 0-4.148-.564-5.383-1.071a.5.5 0 00-.617.828C11.583 9.407 14.07 10 16.5 10zm-3-4a.5.5 0 000-1c-.818 0-1.6-.201-2.28-.396a.5.5 0 00-.593.811C10.15 5.59 11.05 6 13.5 6z" clipRule="evenodd"></path></svg>
                                    Play Audio
                                </button>
                                <audio
                                    ref={audioRef}
                                    src={audioUrl}
                                    className="hidden"
                                    onEnded={() => console.log("Audio finished.")}
                                    onError={(e) => console.error("Audio error:", e.currentTarget.error)}
                                ></audio>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default App;

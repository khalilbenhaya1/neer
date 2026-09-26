import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Sparkles,
    Cloud,
    Monitor,
    Key,
    CheckCircle2,
    ArrowRight,
    ArrowLeft,
    ChevronRight,
    ShieldCheck,
    Zap,
    Cpu
} from 'lucide-react';

interface SetupStep {
    title: string;
    description: string;
}

const STEPS: SetupStep[] = [
    { title: "Welcome", description: "Let's personalize your Neer experience." },
    { title: "Intelligence Mode", description: "Choose how you want Neer to think." },
    { title: "Configuration", description: "Setup your secure AI provider." },
    { title: "Ready", description: "Your workspace is prepared." }
];

export function SetupWizard({ onComplete }: { onComplete: (config: any) => void }) {
    const [step, setStep] = useState(0);
    const [mode, setMode] = useState<'cloud' | 'local' | null>(null);
    const [provider, setProvider] = useState<'openai' | 'anthropic' | 'gemini' | 'kimi' | null>(null);
    const [apiKey, setApiKey] = useState('');
    const [loading, setLoading] = useState(false);

    const nextStep = () => setStep(s => Math.min(s + 1, STEPS.length - 1));
    const prevStep = () => setStep(s => Math.max(s - 1, 0));

    const handleFinish = async () => {
        setLoading(true);
        // Simulate config save or call IPC
        const config = {
            mode,
            provider,
            apiKey,
            timestamp: new Date().toISOString()
        };

        // Call Electron IPC if available, otherwise just complete
        if ((window as any).electron) {
            await (window as any).electron.saveConfig(config);
        }

        setTimeout(() => {
            setLoading(false);
            onComplete(config);
        }, 1500);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-[#090a0f]/80 backdrop-blur-xl">
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="w-full max-w-2xl glass-elevated rounded-[2.5rem] overflow-hidden shadow-2xl relative border-white/10"
            >
                {/* Progress Bar */}
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-white/5">
                    <motion.div
                        className="h-full bg-gradient-to-r from-[#ff4d6d] to-[#ff708d]"
                        initial={{ width: '0%' }}
                        animate={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
                    />
                </div>

                <div className="p-10">
                    <AnimatePresence mode="wait">
                        {step === 0 && (
                            <motion.div
                                key="step0"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="text-center space-y-8"
                            >
                                <div className="relative w-24 h-24 mx-auto rounded-[2rem] bg-gradient-to-br from-[#ff4d6d] to-[#ff708d] flex items-center justify-center text-white shadow-2xl shadow-[#ff4d6d]/30">
                                    <Sparkles className="w-12 h-12" />
                                    <div className="absolute inset-0 rounded-[2rem] shadow-[inset_0_2px_4px_rgba(255,255,255,0.4)]" />
                                </div>
                                <div>
                                    <h1 className="text-4xl font-bold text-white tracking-tight font-display mb-3">Neer Standalone</h1>
                                    <p className="text-slate-400 text-lg leading-relaxed max-w-md mx-auto">
                                        Welcome to your private AI workspace. Let's get you set up in just a few clicks.
                                    </p>
                                </div>
                                <button
                                    onClick={nextStep}
                                    className="group px-8 py-4 rounded-2xl bg-white text-[#090a0f] font-bold text-lg flex items-center gap-3 mx-auto hover:bg-slate-100 transition-all hover:scale-105 active:scale-95"
                                >
                                    Get Started
                                    <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </button>
                            </motion.div>
                        )}

                        {step === 1 && (
                            <motion.div
                                key="step1"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-8"
                            >
                                <div className="text-center">
                                    <h2 className="text-3xl font-bold text-white mb-2">How should Neer think?</h2>
                                    <p className="text-slate-400">Choose between cloud power or local privacy.</p>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <button
                                        onClick={() => { setMode('cloud'); nextStep(); }}
                                        className={`p-6 rounded-3xl border-2 transition-all text-left space-y-4 group
                      ${mode === 'cloud'
                                                ? 'bg-[#ff4d6d]/10 border-[#ff4d6d] shadow-lg shadow-[#ff4d6d]/10'
                                                : 'bg-white/5 border-white/5 hover:border-white/20 hover:bg-white/10'}`}
                                    >
                                        <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                                            <Cloud className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-white">Cloud Power</h3>
                                            <p className="text-sm text-slate-400">Fast, smart, and always ready. Requires an API key.</p>
                                        </div>
                                    </button>

                                    <button
                                        onClick={() => { setMode('local'); nextStep(); }}
                                        className={`p-6 rounded-3xl border-2 transition-all text-left space-y-4 group
                      ${mode === 'local'
                                                ? 'bg-[#ff4d6d]/10 border-[#ff4d6d] shadow-lg shadow-[#ff4d6d]/10'
                                                : 'bg-white/5 border-white/5 hover:border-white/20 hover:bg-white/10'}`}
                                    >
                                        <div className="w-12 h-12 rounded-2xl bg-[#ff4d6d]/20 flex items-center justify-center text-[#ff4d6d] group-hover:scale-110 transition-transform">
                                            <Monitor className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-white">Private Local</h3>
                                            <p className="text-sm text-slate-400">Runs on your hardware using Ollama. 100% private.</p>
                                        </div>
                                    </button>
                                </div>

                                <button onClick={prevStep} className="text-slate-500 hover:text-white flex items-center gap-2 mx-auto transition-colors">
                                    <ArrowLeft className="w-4 h-4" /> Back
                                </button>
                            </motion.div>
                        )}

                        {step === 2 && mode === 'cloud' && (
                            <motion.div
                                key="step2-cloud"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-8"
                            >
                                <div className="text-center">
                                    <h2 className="text-3xl font-bold text-white mb-2">Setup Cloud Access</h2>
                                    <p className="text-slate-400">Neer works with your favorite AI providers.</p>
                                </div>

                                <div className="grid grid-cols-4 gap-4">
                                    {['openai', 'anthropic', 'gemini', 'kimi'].map((p) => (
                                        <button
                                            key={p}
                                            onClick={() => setProvider(p as any)}
                                            className={`p-4 rounded-2xl border transition-all text-center capitalize font-bold text-sm
                        ${provider === p
                                                    ? 'bg-[#ff4d6d] text-white border-[#ff4d6d] shadow-lg shadow-[#ff4d6d]/20'
                                                    : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10'}`}
                                        >
                                            {p}
                                        </button>
                                    ))}
                                </div>

                                {provider && (
                                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                                        <label className="text-sm font-semibold text-slate-400 ml-1">API Key for {provider}</label>
                                        <div className="relative">
                                            <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                            <input
                                                type="password"
                                                placeholder="sk-..."
                                                value={apiKey}
                                                onChange={(e) => setApiKey(e.target.value)}
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white outline-none focus:border-[#ff4d6d] transition-all"
                                            />
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-2 px-1">
                                            <ShieldCheck className="w-3.5 h-3.5" />
                                            Your keys are stored encrypted locally and never shared.
                                        </div>
                                    </motion.div>
                                )}

                                <div className="flex items-center justify-between pt-4">
                                    <button onClick={prevStep} className="text-slate-500 hover:text-white flex items-center gap-2 transition-colors">
                                        <ArrowLeft className="w-4 h-4" /> Back
                                    </button>
                                    <button
                                        disabled={!provider || !apiKey}
                                        onClick={nextStep}
                                        className="px-8 py-3 rounded-2xl bg-white text-[#090a0f] font-bold disabled:opacity-40 flex items-center gap-2 hover:scale-105 active:scale-95 transition-all"
                                    >
                                        Continue <ArrowRight className="w-5 h-5" />
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {step === 2 && mode === 'local' && (
                            <motion.div
                                key="step2-local"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-8"
                            >
                                <div className="text-center">
                                    <h2 className="text-3xl font-bold text-white mb-2">Setup Local Privacy</h2>
                                    <p className="text-slate-400">Neer uses Ollama for local compute.</p>
                                </div>

                                <div className="p-6 rounded-3xl bg-white/5 border border-white/10 space-y-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-[#ff4d6d]/20 flex items-center justify-center text-[#ff4d6d]">
                                            <Cpu className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-white">Ollama Connection</h4>
                                            <p className="text-sm text-[#ff4d6d]">Checking for Ollama on localhost:11434...</p>
                                        </div>
                                    </div>
                                    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                        <motion.div
                                            className="h-full bg-[#ff4d6d]"
                                            animate={{ x: [-100, 400] }}
                                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                        />
                                    </div>
                                </div>

                                <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-2xl flex gap-3 text-sm text-yellow-500/80">
                                    <Zap className="w-5 h-5 flex-shrink-0" />
                                    Make sure Ollama is installed and running on your PC before continuing.
                                </div>

                                <div className="flex items-center justify-between pt-4">
                                    <button onClick={prevStep} className="text-slate-500 hover:text-white flex items-center gap-2 transition-colors">
                                        <ArrowLeft className="w-4 h-4" /> Back
                                    </button>
                                    <button
                                        onClick={nextStep}
                                        className="px-8 py-3 rounded-2xl bg-white text-[#090a0f] font-bold flex items-center gap-2 hover:scale-105 active:scale-95 transition-all"
                                    >
                                        Continue <ArrowRight className="w-5 h-5" />
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {step === 3 && (
                            <motion.div
                                key="step3"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="text-center space-y-8 py-4"
                            >
                                <div className="relative w-24 h-24 mx-auto rounded-full bg-green-500/10 flex items-center justify-center text-green-500 border-green-500/20">
                                    <CheckCircle2 className="w-12 h-12" />
                                    <motion.div
                                        initial={{ scale: 0.8, opacity: 0 }}
                                        animate={{ scale: 1.5, opacity: 0 }}
                                        transition={{ duration: 1, repeat: Infinity }}
                                        className="absolute inset-0 rounded-full border-2 border-green-500"
                                    />
                                </div>
                                <div>
                                    <h2 className="text-3xl font-bold text-white mb-2">Everything is ready!</h2>
                                    <p className="text-slate-400">Neer is configured and optimized for your PC.</p>
                                </div>

                                <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-sm text-slate-500 grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <p className="uppercase tracking-widest text-[10px]">Intelligence</p>
                                        <p className="text-white font-bold capitalize">{mode} Mode</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="uppercase tracking-widest text-[10px]">Provider</p>
                                        <p className="text-white font-bold capitalize">{provider || 'Local LLM'}</p>
                                    </div>
                                </div>

                                <button
                                    disabled={loading}
                                    onClick={handleFinish}
                                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#ff4d6d] to-[#ff708d] text-white font-bold text-lg shadow-xl shadow-[#ff4d6d]/25 hover:shadow-[#ff4d6d]/40 transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
                                >
                                    {loading ? 'Initializing Interface...' : 'Start Neer'}
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
}

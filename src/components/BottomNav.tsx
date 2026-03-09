import { useEffect, useRef, useState } from "react";
import { Home, Loader2, Mic, Newspaper, ScanLine, TrendingUp, User } from "lucide-react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { useAuth } from "@/hooks/useAuth";
import {
  getPreferredAudioRecordingMimeType,
  getVoiceRecordingValidationError,
} from "@/lib/audioRecording";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/hooks/useLanguage";
import {
  VOICE_COMMAND_CROPS_UPDATED_EVENT,
  executeVoiceCommand,
  getAssemblyAiApiKey,
  parseVoiceCommand,
  transcribeAudioWithAssemblyAI,
} from "@/lib/voiceCommands";

const navItems = [
  { to: "/", icon: Home, label: { en: "Home", hi: "होम", as: "হোম" } },
  { to: "/news", icon: Newspaper, label: { en: "News", hi: "समाचार", as: "বাতৰি" } },
  { to: "/scan", icon: ScanLine, label: { en: "Scan", hi: "स्कैन", as: "স্কেন" }, isCenter: true },
  { to: "/market", icon: TrendingUp, label: { en: "Market", hi: "मंडी", as: "বজাৰ" } },
  { to: "/profile", icon: User, label: { en: "Profile", hi: "प्रोफ़ाइल", as: "প্ৰ'ফাইল" } },
];

const HOLD_DURATION_MS = 450;
const MAX_VOICE_RECORDING_MS = 7000;

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { language } = useLanguage();
  const [voiceState, setVoiceState] = useState<"idle" | "starting" | "listening" | "processing">("idle");
  const holdTimerRef = useRef<number | null>(null);
  const autoStopRef = useRef<number | null>(null);
  const longPressTriggeredRef = useRef(false);
  const stopRequestedRef = useRef(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const recordingMimeTypeRef = useRef("audio/webm");
  const recordingStartedAtRef = useRef<number | null>(null);

  const clearHoldTimer = () => {
    if (holdTimerRef.current !== null) {
      window.clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
  };

  const clearAutoStop = () => {
    if (autoStopRef.current !== null) {
      window.clearTimeout(autoStopRef.current);
      autoStopRef.current = null;
    }
  };

  const cleanupStream = () => {
    mediaRecorderRef.current = null;
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
  };

  const resetVoiceFlow = () => {
    clearHoldTimer();
    clearAutoStop();
    longPressTriggeredRef.current = false;
    stopRequestedRef.current = false;
    audioChunksRef.current = [];
    recordingMimeTypeRef.current = "audio/webm";
    recordingStartedAtRef.current = null;
    cleanupStream();
    setVoiceState("idle");
  };

  const stopVoiceCapture = () => {
    clearAutoStop();
    stopRequestedRef.current = true;

    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      setVoiceState("processing");
      try {
        recorder.requestData();
      } catch {
        // Ignore requestData failures and continue stopping the recorder.
      }
      recorder.stop();
      return;
    }

    if (voiceState !== "idle") {
      setVoiceState("processing");
    }
  };

  const runVoiceCommandFromAudio = async (audioBlob: Blob, transcriptDescription: string, onComplete: () => void) => {
    try {
      const transcript = await transcribeAudioWithAssemblyAI(audioBlob);
      if (!transcript) {
        throw new Error("I couldn't hear a command. Please try again.");
      }

      if (!user?.uid) {
        throw new Error("Please log in again to use voice commands.");
      }

      const command = parseVoiceCommand(transcript);
      if (!command) {
        throw new Error(`I heard “${transcript}”, but couldn't match a supported command.`);
      }

      const result = await executeVoiceCommand(command, {
        userId: user.uid,
        navigate,
        onCropsChanged: () => window.dispatchEvent(new Event(VOICE_COMMAND_CROPS_UPDATED_EVENT)),
      });

      toast.success(result.message, { description: `${transcriptDescription}: ${transcript}` });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Voice command failed.");
    } finally {
      onComplete();
    }
  };

  const startVoiceCapture = async () => {
    if (!user?.uid) {
      toast.error("Please log in again to use voice commands.");
      resetVoiceFlow();
      return;
    }

    if (!getAssemblyAiApiKey()) {
      toast.error("AssemblyAI voice commands are not configured.");
      resetVoiceFlow();
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      toast.error("This browser does not support microphone recording.");
      resetVoiceFlow();
      return;
    }

    setVoiceState("starting");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      audioChunksRef.current = [];

      const preferredMimeType = getPreferredAudioRecordingMimeType(MediaRecorder);
      const recorder = preferredMimeType
        ? new MediaRecorder(stream, { mimeType: preferredMimeType, audioBitsPerSecond: 128000 })
        : new MediaRecorder(stream);

      mediaRecorderRef.current = recorder;
      recordingMimeTypeRef.current = preferredMimeType || recorder.mimeType || "audio/webm";
      recordingStartedAtRef.current = Date.now();

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          if (event.data.type) {
            recordingMimeTypeRef.current = event.data.type;
          }
          audioChunksRef.current.push(event.data);
        }
      };
      recorder.onerror = () => {
        toast.error("Voice recording failed.");
        resetVoiceFlow();
      };
      recorder.onstop = async () => {
        const durationMs = recordingStartedAtRef.current
          ? Date.now() - recordingStartedAtRef.current
          : 0;
        const mimeType = recordingMimeTypeRef.current || recorder.mimeType || "audio/webm";
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        cleanupStream();

        try {
          const validationError = getVoiceRecordingValidationError(durationMs, audioBlob.size);
          if (validationError) {
            throw new Error(validationError);
          }
        } catch (error) {
          toast.error(error instanceof Error ? error.message : "Voice command failed.");
          resetVoiceFlow();
          return;
        }

        await runVoiceCommandFromAudio(audioBlob, "Heard", () => {
          resetVoiceFlow();
        });
      };

      recorder.start(250);
      setVoiceState("listening");
      toast("Listening…", {
        description: "Keep holding and speak. Release to run the command.",
      });

      autoStopRef.current = window.setTimeout(() => {
        stopVoiceCapture();
      }, MAX_VOICE_RECORDING_MS);

      if (stopRequestedRef.current) {
        stopVoiceCapture();
      }
    } catch (error) {
      console.error("Voice command setup failed:", error);
      toast.error("Microphone access was denied.");
      resetVoiceFlow();
    }
  };

  useEffect(() => () => {
    resetVoiceFlow();
  }, []);

  const handleCenterPointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (voiceState !== "idle") {
      return;
    }

    stopRequestedRef.current = false;
    event.currentTarget.setPointerCapture(event.pointerId);
    clearHoldTimer();
    holdTimerRef.current = window.setTimeout(() => {
      longPressTriggeredRef.current = true;
      void startVoiceCapture();
    }, HOLD_DURATION_MS);
  };

  const handleCenterPointerEnd = (event: React.PointerEvent<HTMLButtonElement>) => {
    try {
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
    } catch {
      // ignore pointer capture release failures
    }

    clearHoldTimer();
    if (!longPressTriggeredRef.current) {
      navigate("/scan");
      return;
    }

    stopVoiceCapture();
  };

  const renderCenterIcon = () => {
    if (voiceState === "listening") {
      return <Mic className="w-6 h-6" />;
    }

    if (voiceState === "starting" || voiceState === "processing") {
      return <Loader2 className="w-6 h-6 animate-spin" />;
    }

    return <ScanLine className="w-6 h-6" />;
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border safe-bottom">
      <div className="flex items-end justify-around px-2 pt-1 pb-2 max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to;
          const Icon = item.icon;

          if (item.isCenter) {
            return (
              <button
                key={item.to}
                type="button"
                className="flex flex-col items-center -mt-5"
                onPointerDown={handleCenterPointerDown}
                onPointerUp={handleCenterPointerEnd}
                onPointerCancel={handleCenterPointerEnd}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    navigate("/scan");
                  }
                }}
                title="Tap to open Scan. Long-press and hold for voice commands."
              >
                <div
                  className={cn(
                    "w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all",
                    voiceState === "listening"
                      ? "bg-red-500 text-white scale-110"
                      : isActive
                      ? "bg-primary text-primary-foreground scale-110"
                      : "bg-primary/90 text-primary-foreground"
                  )}
                >
                  {renderCenterIcon()}
                </div>
                <span className={cn("text-[10px] mt-1 font-medium text-foreground", language !== "en" && "font-hindi")}>
                  {item.label[language]}
                </span>
              </button>
            );
          }

          return (
            <NavLink
              key={item.to}
              to={item.to}
              className="flex flex-col items-center pt-2 min-w-[56px]"
            >
              <Icon
                className={cn(
                  "w-5 h-5 transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              />
              <span
                className={cn(
                  "text-[10px] mt-1 font-medium transition-colors",
                  language !== "en" && "font-hindi",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                {item.label[language]}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;

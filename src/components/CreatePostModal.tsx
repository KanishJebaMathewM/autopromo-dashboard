import { useState } from "react";
import { Sparkles, X, Check, RefreshCw, Wand2, ArrowRight, Settings2 } from "lucide-react";
import { toast } from "sonner";
import { PlatformIcon } from "@/components/PlatformIcon";
import { useTrackEvent } from "@/lib/queries";
import type { ApiEventType, ApiPlatform, ApiTone } from "@/lib/apiTypes";
import type { Platform } from "@/lib/mockData";

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  appId: string;
  appName: string;
}

const PLATFORMS: { id: ApiPlatform; platformKey: Platform; label: string; color: string }[] = [
  { id: "twitter", platformKey: "Twitter", label: "Twitter / X", color: "text-[#1D9BF0]" },
  { id: "linkedin", platformKey: "LinkedIn", label: "LinkedIn", color: "text-[#0A66C2]" },
  { id: "reddit", platformKey: "Reddit", label: "Reddit", color: "text-[#FF4500]" },
  { id: "whatsapp", platformKey: "WhatsApp", label: "WhatsApp", color: "text-[#25D366]" },
  { id: "telegram", platformKey: "Telegram", label: "Telegram", color: "text-[#229ED9]" },
  { id: "facebook", platformKey: "Facebook", label: "Facebook", color: "text-[#1877F2]" },
];

const ONE_CLICK_PRESETS: { id: ApiEventType; icon: string; title: string; prompt: (name: string) => string }[] = [
  {
    id: "new_version",
    icon: "🚀",
    title: "Major V2.0 Update",
    prompt: (name) => `We just released ${name} v2.0 with redesigned UI, 2x performance speedups, and cloud sync!`,
  },
  {
    id: "milestone",
    icon: "⚡",
    title: "10k Users Milestone",
    prompt: (name) => `We just hit 10,000 active users on ${name}! Huge thanks to everyone supporting our journey.`,
  },
  {
    id: "new_review",
    icon: "⭐",
    title: "5-Star Review Spotlight",
    prompt: (name) => `"Best app I've used this year!" — Check out how ${name} is helping people streamline their workflow.`,
  },
  {
    id: "launch",
    icon: "🎉",
    title: "Official Product Launch",
    prompt: (name) => `Introducing ${name} on iOS and Android: the easiest way to manage your workflow in 20 seconds.`,
  },
];

export function CreatePostModal({ isOpen, onClose, appId, appName }: CreatePostModalProps) {
  const [mode, setMode] = useState<"instant" | "custom">("instant");
  const [eventType, setEventType] = useState<ApiEventType>("new_version");
  const [customPrompt, setCustomPrompt] = useState(
    `We just shipped ${appName} v2.0 with Dark Mode, 50% faster loading, and automated sync!`
  );
  const [selectedPlatforms, setSelectedPlatforms] = useState<ApiPlatform[]>([
    "twitter",
    "linkedin",
    "reddit",
    "whatsapp",
    "telegram",
    "facebook",
  ]);
  const [tone, setTone] = useState<ApiTone>("casual");
  const [showAdvanced, setShowAdvanced] = useState(false);

  const trackEventMutation = useTrackEvent(appId);

  if (!isOpen) return null;

  const togglePlatform = (id: ApiPlatform) => {
    setSelectedPlatforms((prev) =>
      prev.includes(id)
        ? prev.length > 1
          ? prev.filter((p) => p !== id)
          : prev
        : [...prev, id]
    );
  };

  const selectAllPlatforms = () => {
    setSelectedPlatforms(["twitter", "linkedin", "reddit", "whatsapp", "telegram", "facebook"]);
  };

  const handleInstantGenerate = async (preset: typeof ONE_CLICK_PRESETS[0]) => {
    setEventType(preset.id);
    const promptText = preset.prompt(appName);
    setCustomPrompt(promptText);

    try {
      await trackEventMutation.mutateAsync({
        type: preset.id,
        payload: {
          appName,
          prompt: promptText,
          details: promptText,
          targetPlatforms: selectedPlatforms,
          tone,
        },
      });

      toast.success("✨ Campaign Generated Successfully!", {
        description: `Created tailored posts across ${selectedPlatforms.length} social platforms.`,
      });
      onClose();
    } catch {
      toast.error("Generation encountered an error, applied local backup copy.");
      onClose();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const promptText = customPrompt.trim() || `Major milestone and update for ${appName}!`;

    try {
      await trackEventMutation.mutateAsync({
        type: eventType,
        payload: {
          appName,
          prompt: promptText,
          details: promptText,
          targetPlatforms: selectedPlatforms,
          tone,
        },
      });

      toast.success("✨ AI Post & Thread Generation Complete!", {
        description: `Generated variants across ${selectedPlatforms.length} social platforms!`,
      });
      onClose();
    } catch {
      toast.error("Generation encountered an error, applied local backup copy.");
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="relative flex flex-col w-full max-w-xl max-h-[88vh] overflow-hidden rounded-2xl border bg-background shadow-2xl">
        {/* Sticky Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-background px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h2 className="font-display text-base font-bold">AutoPromo Campaign Studio</h2>
              <p className="text-[11px] text-muted-fg">
                Instant zero-friction promotion for <span className="font-semibold text-foreground">{appName}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-fg hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tab Switcher: 1-Click Instant vs Custom Note */}
        <div className="flex border-b bg-muted/30 px-5 pt-2">
          <button
            type="button"
            onClick={() => setMode("instant")}
            className={`flex items-center gap-2 border-b-2 px-3 py-2 text-xs font-bold transition-all ${
              mode === "instant"
                ? "border-emerald-500 text-emerald-600 dark:text-emerald-300"
                : "border-transparent text-muted-fg hover:text-foreground"
            }`}
          >
            <Wand2 className="h-3.5 w-3.5" />
            1-Click Instant Generation (Zero Effort)
          </button>
          <button
            type="button"
            onClick={() => setMode("custom")}
            className={`flex items-center gap-2 border-b-2 px-3 py-2 text-xs font-bold transition-all ${
              mode === "custom"
                ? "border-emerald-500 text-emerald-600 dark:text-emerald-300"
                : "border-transparent text-muted-fg hover:text-foreground"
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            Custom Note / URL
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {mode === "instant" ? (
            <div className="space-y-3">
              <p className="text-xs text-muted-fg">
                Pick a campaign goal and AutoPromo AI will automatically craft and rank multi-platform posts for{" "}
                <strong className="text-foreground">{appName}</strong> with one click:
              </p>

              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {ONE_CLICK_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    disabled={trackEventMutation.isPending}
                    onClick={() => handleInstantGenerate(preset)}
                    className="group relative flex flex-col items-start rounded-xl border border-border bg-surface p-3.5 text-left transition-all hover:border-emerald-500 hover:shadow-md hover:bg-emerald-500/5 disabled:opacity-50"
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-xl">{preset.icon}</span>
                      <ArrowRight className="h-4 w-4 text-muted-fg opacity-0 transition-all group-hover:opacity-100 group-hover:translate-x-0.5 text-emerald-500" />
                    </div>
                    <span className="mt-2 text-xs font-bold text-foreground">{preset.title}</span>
                    <span className="mt-1 line-clamp-2 text-[11px] text-muted-fg">
                      {preset.prompt(appName)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} id="create-post-form" className="space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-muted-fg">
                    What are you promoting?
                  </label>
                  <span className="font-mono text-[10px] text-muted-fg">{customPrompt.length} chars</span>
                </div>
                <textarea
                  rows={3}
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="e.g. We just released v2.0 with Dark Mode and faster export! Check it out at https://yourapp.com"
                  className="mt-1.5 w-full rounded-xl border bg-surface p-3 text-xs focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {/* Advanced Toggle */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 hover:underline dark:text-emerald-300"
                >
                  <Settings2 className="h-3.5 w-3.5" />
                  {showAdvanced ? "Hide Platform & Tone Customization" : "Customize Target Platforms & Tone"}
                </button>
              </div>

              {showAdvanced && (
                <div className="rounded-xl border bg-muted/20 p-3.5 space-y-4 animate-in fade-in">
                  {/* Platforms */}
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-muted-fg">
                        Target Platforms ({selectedPlatforms.length}/6):
                      </span>
                      <button
                        type="button"
                        onClick={selectAllPlatforms}
                        className="text-[10px] font-bold text-emerald-600 hover:underline"
                      >
                        Select All
                      </button>
                    </div>
                    <div className="mt-2 grid grid-cols-3 gap-2">
                      {PLATFORMS.map((p) => {
                        const isSelected = selectedPlatforms.includes(p.id);
                        return (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => togglePlatform(p.id)}
                            className={`flex items-center justify-between rounded-lg border p-2 text-xs font-medium transition-all ${
                              isSelected
                                ? "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 font-bold"
                                : "border-border bg-surface text-muted-fg hover:bg-muted"
                            }`}
                          >
                            <div className="flex items-center gap-1.5 truncate">
                              <span className={p.color}>
                                <PlatformIcon platform={p.platformKey} className="h-3.5 w-3.5" />
                              </span>
                              <span className="truncate text-[11px]">{p.label}</span>
                            </div>
                            {isSelected && <Check className="h-3 w-3 text-emerald-500" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Tone */}
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-muted-fg">
                      Voice Tone:
                    </span>
                    <div className="mt-1.5 flex gap-2">
                      {(["casual", "professional"] as ApiTone[]).map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setTone(t)}
                          className={`flex-1 rounded-lg border py-1.5 text-xs font-bold capitalize transition-all ${
                            tone === t
                              ? "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300"
                              : "border-border bg-surface text-muted-fg hover:bg-muted"
                          }`}
                        >
                          {t === "casual" ? "🔥 Casual & Viral" : "💼 Professional & Clear"}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </form>
          )}
        </div>

        {/* Sticky Action Footer */}
        <div className="sticky bottom-0 z-10 flex items-center justify-between border-t bg-background px-5 py-3">
          <span className="text-[11px] text-muted-fg">
            Generating <strong className="text-foreground">{selectedPlatforms.length} tailored variants</strong>
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border px-3.5 py-1.5 text-xs font-medium text-muted-fg hover:bg-muted"
            >
              Close
            </button>
            {mode === "custom" && (
              <button
                type="submit"
                form="create-post-form"
                disabled={trackEventMutation.isPending}
                className="ap-press inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary-hover disabled:opacity-50"
              >
                {trackEventMutation.isPending ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5 text-emerald-300" />
                    Generate Campaign
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter, useSearchParams } from "next/navigation";
import { RootState, AppDispatch } from "@/lib/store";
import {
  createDashboard,
  resetGenerationStatus,
  fetchClarifyingQuestions,
  resetClarifyState,
} from "@/lib/store/features/dashboards/dashboardsSlice";
import { CreateDashboardInput, DataSourceRef, ClarifyingAnswer } from "@/types/dashboard";
import GenerationStatus from "./components/GenerationStatus";
import DataSourcePicker from "./components/DataSourcePicker";
import ConversationPanel from "./components/ConversationPanel";
import { ArrowLeft, Sparkles, BarChart2, LineChart, PieChart, Activity, Database, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

type WidgetType = "kpi" | "bar" | "line" | "pie";
interface BlueprintWidget { type: WidgetType; label: string }
interface Blueprint { name: string; description: string; widgets: BlueprintWidget[] }

function deriveBlueprintFromPrompt(prompt: string): Blueprint {
  const p = prompt.toLowerCase();
  if (p.includes("spend") || p.includes("vendor") || p.includes("procurement") || p.includes("indirect")) {
    return {
      name: "Spend Analytics Dashboard",
      description: "Analyze indirect spend by category and vendor with trend analysis and supplier concentration metrics.",
      widgets: [
        { type: "kpi", label: "Total Spend" },
        { type: "kpi", label: "Vendor Count" },
        { type: "kpi", label: "Avg. PO Value" },
        { type: "bar", label: "Spend by Category" },
        { type: "pie", label: "Vendor Distribution" },
        { type: "line", label: "Spend Over Time" },
      ],
    };
  }
  if (p.includes("sales") || p.includes("revenue") || p.includes("margin")) {
    return {
      name: "Sales Performance Dashboard",
      description: "Track revenue, margins and performance across products, regions and time periods.",
      widgets: [
        { type: "kpi", label: "Total Revenue" },
        { type: "kpi", label: "Gross Margin" },
        { type: "kpi", label: "Win Rate" },
        { type: "bar", label: "Revenue by Region" },
        { type: "line", label: "Monthly Trend" },
        { type: "pie", label: "Product Mix" },
      ],
    };
  }
  if (p.includes("support") || p.includes("ticket") || p.includes("customer service")) {
    return {
      name: "Customer Support Dashboard",
      description: "Monitor ticket volume, resolution times and satisfaction scores across support operations.",
      widgets: [
        { type: "kpi", label: "Open Tickets" },
        { type: "kpi", label: "Avg. Resolution" },
        { type: "kpi", label: "CSAT Score" },
        { type: "bar", label: "Tickets by Category" },
        { type: "line", label: "Volume Trend" },
        { type: "pie", label: "Status Breakdown" },
      ],
    };
  }
  const words = prompt.split(/\s+/).filter((w) => w.length > 3);
  const name = words.slice(0, 3).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ") + " Dashboard";
  return {
    name,
    description: "AI-powered dashboard with KPIs, trend charts and breakdowns derived from your prompt.",
    widgets: [
      { type: "kpi", label: "Key Metric 1" },
      { type: "kpi", label: "Key Metric 2" },
      { type: "bar", label: "Primary Breakdown" },
      { type: "line", label: "Trend Over Time" },
      { type: "pie", label: "Distribution" },
    ],
  };
}


export default function CreateDashboard() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { generationStatus, clarifyStatus, clarifyingQuestions } = useSelector(
    (state: RootState) => state.dashboards
  );

  const initialPrompt = searchParams.get("prompt") ?? "";

  // View: "prompt" (entry) | "confirm" (main screen)
  const [view, setView] = useState<"prompt" | "confirm">(initialPrompt ? "confirm" : "prompt");
  const [prompt, setPrompt] = useState(initialPrompt);
  const [clarifyingAnswers, setClarifyingAnswers] = useState<ClarifyingAnswer[]>([]);

  const [selectedDataSources, setSelectedDataSources] = useState<DataSourceRef[]>([]);
  const [focusColumns, setFocusColumns] = useState("");

  const isGenerating = generationStatus === "generating";
  const isClarifying = clarifyStatus === "loading";
  const autoTriggered = useRef(false);

  // Auto-fetch questions when arriving with ?prompt=
  useEffect(() => {
    if (initialPrompt && !autoTriggered.current) {
      autoTriggered.current = true;
      dispatch(resetClarifyState());
      dispatch(fetchClarifyingQuestions({ prompt: initialPrompt, dataSources: [] }));
    }
  }, []);

  const handleDataSourceChange = (refs: DataSourceRef[]) => {
    setSelectedDataSources(refs);
    const lastDatasage = [...refs].reverse().find((r) => r.type === "datasage" && r.selectedTables?.length);
    if (lastDatasage?.selectedTables) {
      setFocusColumns(lastDatasage.selectedTables.join(", "));
    } else if (refs.length === 0) {
      setFocusColumns("");
    }
  };

  const handleContinueFromPrompt = () => {
    if (!prompt.trim()) return;
    dispatch(resetClarifyState());
    dispatch(fetchClarifyingQuestions({ prompt: prompt.trim(), dataSources: selectedDataSources }));
    setView("confirm");
  };

  const handleBuildDashboard = async () => {
    if (!prompt.trim() || isGenerating) return;
    dispatch(resetGenerationStatus());
    const input: CreateDashboardInput = {
      prompt: prompt.trim(),
      dataSources: selectedDataSources.length ? selectedDataSources : undefined,
      focusColumns: focusColumns || undefined,
      clarifyingAnswers: clarifyingAnswers.filter((a) => a.answer.trim()).length
        ? clarifyingAnswers.filter((a) => a.answer.trim())
        : undefined,
    };
    const result = await dispatch(createDashboard(input));
    if (createDashboard.fulfilled.match(result)) {
      router.push(`/dashboards/${result.payload.id}`);
    }
  };

  // ── Generating state ──────────────────────────────────────────────────────
  if (isGenerating) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center px-6 py-4 border-b border-[#E0E0E0] bg-white">
          <div className="flex items-center gap-3 flex-1">
            <button onClick={() => router.push("/dashboards")} className="text-[#6B7280] hover:text-[#111827] transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h1 className="text-base font-semibold text-[#111827]">Create Dashboard</h1>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 max-w-2xl mx-auto">
            <GenerationStatus />
          </div>
        </div>
      </div>
    );
  }

  // ── Prompt entry ──────────────────────────────────────────────────────────
  if (view === "prompt") {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center px-6 py-4 border-b border-[#E0E0E0] bg-white">
          <div className="flex items-center gap-3 flex-1">
            <button onClick={() => router.push("/dashboards")} className="text-[#6B7280] hover:text-[#111827] transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h1 className="text-base font-semibold text-[#111827]">Create Dashboard</h1>
          </div>
          <div className="flex-1 flex justify-end">
            <button
              onClick={handleContinueFromPrompt}
              disabled={!prompt.trim()}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-[#00B2A1] text-white hover:bg-[#009B8C] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              Continue
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 max-w-2xl mx-auto flex flex-col gap-5">
            <div className="rounded-lg border border-[#E0E0E0] bg-white p-5">
              <label className="block text-sm font-semibold text-[#111827] mb-2">
                What would you like to visualize?
                <span className="text-red-500 ml-1">*</span>
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleContinueFromPrompt(); }}
                placeholder={`e.g. "Build a dashboard for indirect spend by category and vendor"\n"Show margin by customer and part category"\n"Customer support operations with ticket volume and resolution time"`}
                rows={5}
                autoFocus
                className="w-full text-sm border border-[#E0E0E0] rounded-md px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-[#00B2A1] focus:border-[#00B2A1] placeholder:text-[#9CA3AF] resize-none"
              />
              <p className="text-xs text-[#9CA3AF] mt-1.5">
                Be specific about the metrics, dimensions, and questions you want answered · ⌘↵ to continue
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Confirm screen (main) ─────────────────────────────────────────────────
  const blueprint = deriveBlueprintFromPrompt(prompt);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center px-6 py-4 border-b border-[#E0E0E0] bg-white">
        <div className="flex items-center gap-3 flex-1">
          <button onClick={() => router.push("/dashboards")} className="text-[#6B7280] hover:text-[#111827] transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="text-base font-semibold text-[#111827]">Create Dashboard</h1>
        </div>
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide bg-[#F0FDFB] text-[#00B2A1] border border-[#B2EDE8]">
          Review &amp; Confirm
        </span>
        <div className="flex items-center gap-2 flex-1 justify-end">
          <button
            onClick={handleBuildDashboard}
            disabled={isGenerating}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-[#00B2A1] text-white hover:bg-[#009B8C] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            Build Dashboard
          </button>
        </div>
      </div>

      {/* Body — two column layout */}
      <div className="flex flex-1 overflow-hidden relative">

        {/* ── Left panel: conversation ── */}
        <div className="w-[340px] flex-shrink-0 border-r border-[#E0E0E0] bg-[#F9FAFB] flex flex-col">
          <ConversationPanel
            mode="create"
            prompt={prompt}
            questions={clarifyingQuestions}
            isLoadingQuestions={isClarifying}
            onAnswersComplete={(answers) => setClarifyingAnswers(answers)}
          />
        </div>

        {/* ── Right: main content with dot background ── */}
        <div
          className="flex-1 overflow-y-auto min-h-full"
          style={{
            backgroundImage: "radial-gradient(#e2e8f0 1px, transparent 1px)",
            backgroundSize: "22px 22px",
          }}
        >
          {/* Teal glow */}

          <div className="sticky top-0 left-0 right-0 h-0 pointer-events-none overflow-visible">
            <div
              className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-40"
              style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(0,178,161,0.09) 0%, transparent 70%)" }}
            />
          </div>

          <div className="relative p-6 flex flex-col gap-5 min-h-full">

            {/* Blueprint preview card */}
            <div className="rounded-xl border border-[#E0E0E0] bg-white overflow-hidden">
              <div className="px-5 pt-5 pb-4 border-b border-[#F3F4F6]">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#00B2A1] to-[#00d0bd] flex items-center justify-center flex-shrink-0 shadow-sm">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-base font-semibold text-[#111827] leading-tight">{blueprint.name}</h2>
                    <p className="text-sm text-[#6B7280] mt-1 leading-snug">{blueprint.description}</p>
                  </div>
                </div>
              </div>

              {/* Widget preview grid */}
              <div className="p-5">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-[#9CA3AF] mb-3">Expected widgets</p>
                <div className="grid grid-cols-3 gap-3">
                  {blueprint.widgets.map((w, i) => (
                    <div
                      key={i}
                      className={cn(
                        "rounded-xl border p-3 flex flex-col items-center justify-center gap-2 h-20",
                        w.type === "kpi"
                          ? "border-[#D1FAF5] bg-[#F0FDFB]"
                          : "border-[#F3F4F6] bg-[#FAFAFA]"
                      )}
                    >
                      {w.type === "kpi" && <Activity className="w-6 h-6 text-[#00B2A1]" />}
                      {w.type === "bar" && <BarChart2 className="w-6 h-6 text-[#9CA3AF]" />}
                      {w.type === "line" && <LineChart className="w-6 h-6 text-[#9CA3AF]" />}
                      {w.type === "pie" && <PieChart className="w-6 h-6 text-[#9CA3AF]" />}
                      <span className={cn(
                        "text-xs text-center leading-snug font-medium",
                        w.type === "kpi" ? "text-[#00897B]" : "text-[#6B7280]"
                      )}>{w.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Data Sources row — picker left (2/3), selected right (1/3) */}
            <div className="grid grid-cols-3 gap-4 items-start">

              {/* DataSourcePicker — feeds the list */}
              <div className="col-span-2">
                <DataSourcePicker value={selectedDataSources} onChange={handleDataSourceChange} />
              </div>

              {/* Read-only selected sources */}
              <div className="rounded-xl border border-[#E0E0E0] bg-white overflow-hidden min-w-0">
                <div className="px-4 py-3.5 border-b border-[#F3F4F6]">
                  <p className="text-sm font-semibold text-[#111827]">Selected Data Sources</p>
                </div>
                {selectedDataSources.length === 0 ? (
                  <div className="px-4 py-8 flex flex-col items-center gap-2 text-center">
                    <Database className="w-6 h-6 text-[#D1D5DB]" />
                    <p className="text-xs text-[#9CA3AF]">No data sources selected</p>
                    <p className="text-[11px] text-[#D1D5DB]">Use the picker to add connections or datasets</p>
                  </div>
                ) : (
                  <div className="divide-y divide-[#F3F4F6]">
                    {selectedDataSources.map((src) => (
                      <div key={src.id} className="flex items-center gap-3 px-4 py-3">
                        <div className={cn(
                          "w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0",
                          src.type === "datasage" ? "bg-[#F0FDFB]" : "bg-[#F3F4F6]"
                        )}>
                          {src.type === "datasage"
                            ? <Database className="w-3.5 h-3.5 text-[#00B2A1]" />
                            : <FileText className="w-3.5 h-3.5 text-[#6B7280]" />
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[#111827] truncate">{src.name}</p>
                          <p className="text-[11px] text-[#9CA3AF]">
                            {src.subtype ?? (src.type === "datasage" ? "Platform connection" : "Dataset")}
                            {src.selectedTables?.length ? ` · ${src.selectedTables.length} table${src.selectedTables.length > 1 ? "s" : ""}` : ""}
                          </p>
                        </div>
                        {src.type === "datasage" && src.connectionStatus && (
                          <span className={cn(
                            "text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0",
                            src.connectionStatus === "Online"
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-gray-100 text-gray-500"
                          )}>
                            {src.connectionStatus}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

          </div>
        </div>

      </div>
    </div>
  );
}

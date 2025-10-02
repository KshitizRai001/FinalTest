import { useMemo, useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  CheckCircle2,
  AlertTriangle,
  PlayCircle,
  Clock4,
  Layers,
  BadgePercent,
  Gauge,
  Sparkles,
  Map,
  Brush,
  ShieldCheck,
  Workflow,
  ListTree,
  RefreshCw,
  Calendar,
  Loader2,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import type { ScheduleGenerationResponse, InductionRanking, Constraint, AuditEvent } from "@shared/api";

type Train = {
  id: string;
  fcRS: boolean; // Rolling-Stock FC
  fcSIG: boolean; // Signalling FC
  fcTEL: boolean; // Telecom FC
  openJobs: number; // Maximo job-cards open
  brandingShortfall: number; // hours below target
  mileageKm: number; // last-7d total km
  cleaningDue: boolean; // deep clean due tonight
  stablingPenalty: number; // 0-100 (higher is worse)
};

const INITIAL: Train[] = [
  {
    id: "KM-001",
    fcRS: true,
    fcSIG: true,
    fcTEL: true,
    openJobs: 0,
    brandingShortfall: 8,
    mileageKm: 940,
    cleaningDue: false,
    stablingPenalty: 10,
  },
  {
    id: "KM-002",
    fcRS: true,
    fcSIG: true,
    fcTEL: false,
    openJobs: 0,
    brandingShortfall: 2,
    mileageKm: 1010,
    cleaningDue: false,
    stablingPenalty: 15,
  },
  {
    id: "KM-003",
    fcRS: true,
    fcSIG: true,
    fcTEL: true,
    openJobs: 1,
    brandingShortfall: 5,
    mileageKm: 880,
    cleaningDue: true,
    stablingPenalty: 5,
  },
  {
    id: "KM-004",
    fcRS: true,
    fcSIG: false,
    fcTEL: true,
    openJobs: 0,
    brandingShortfall: 0,
    mileageKm: 970,
    cleaningDue: false,
    stablingPenalty: 25,
  },
  {
    id: "KM-005",
    fcRS: true,
    fcSIG: true,
    fcTEL: true,
    openJobs: 2,
    brandingShortfall: 10,
    mileageKm: 760,
    cleaningDue: true,
    stablingPenalty: 0,
  },
  {
    id: "KM-006",
    fcRS: true,
    fcSIG: true,
    fcTEL: true,
    openJobs: 0,
    brandingShortfall: 4,
    mileageKm: 1020,
    cleaningDue: false,
    stablingPenalty: 12,
  },
  {
    id: "KM-007",
    fcRS: true,
    fcSIG: true,
    fcTEL: true,
    openJobs: 0,
    brandingShortfall: 0,
    mileageKm: 900,
    cleaningDue: false,
    stablingPenalty: 6,
  },
  {
    id: "KM-008",
    fcRS: false,
    fcSIG: true,
    fcTEL: true,
    openJobs: 0,
    brandingShortfall: 7,
    mileageKm: 920,
    cleaningDue: false,
    stablingPenalty: 18,
  },
  {
    id: "KM-009",
    fcRS: true,
    fcSIG: true,
    fcTEL: true,
    openJobs: 3,
    brandingShortfall: 12,
    mileageKm: 830,
    cleaningDue: true,
    stablingPenalty: 30,
  },
  {
    id: "KM-010",
    fcRS: true,
    fcSIG: true,
    fcTEL: true,
    openJobs: 0,
    brandingShortfall: 1,
    mileageKm: 990,
    cleaningDue: false,
    stablingPenalty: 8,
  },
  {
    id: "KM-011",
    fcRS: true,
    fcSIG: true,
    fcTEL: false,
    openJobs: 1,
    brandingShortfall: 9,
    mileageKm: 870,
    cleaningDue: false,
    stablingPenalty: 12,
  },
  {
    id: "KM-012",
    fcRS: true,
    fcSIG: true,
    fcTEL: true,
    openJobs: 0,
    brandingShortfall: 0,
    mileageKm: 950,
    cleaningDue: false,
    stablingPenalty: 4,
  },
];

const targetMileage = 950; // target 7-day mileage for balancing

function clamp(n: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, n));
}

function scoreReadiness(t: Train) {
  const fc = (Number(t.fcRS) + Number(t.fcSIG) + Number(t.fcTEL)) / 3; // 0..1
  const jobPenalty = Math.min(t.openJobs * 0.2, 0.8); // each open job -20%, cap 80%
  return clamp(Math.round((fc - jobPenalty) * 100));
}

function scoreBranding(t: Train) {
  // Less shortfall is better. Assume targets of 10h; 0 => 100, 10+ => 0
  const s = clamp(
    Math.round((1 - Math.min(t.brandingShortfall, 10) / 10) * 100),
  );
  return s;
}

function scoreMileage(t: Train) {
  const dev = Math.abs(t.mileageKm - targetMileage);
  // 0 dev =>100, 250+ dev => 0
  const s = clamp(Math.round((1 - Math.min(dev, 250) / 250) * 100));
  return s;
}

function scoreCleaning(t: Train) {
  return t.cleaningDue ? 65 : 100; // if due, discourage but not block
}

function scoreStabling(t: Train) {
  return clamp(100 - t.stablingPenalty);
}

function explain(t: Train) {
  const reasons: string[] = [];
  if (!t.fcRS) reasons.push("Rolling-Stock FC missing");
  if (!t.fcSIG) reasons.push("Signalling FC missing");
  if (!t.fcTEL) reasons.push("Telecom FC missing");
  if (t.openJobs > 0) reasons.push(`${t.openJobs} open job-card(s)`);
  if (t.brandingShortfall > 0)
    reasons.push(`${t.brandingShortfall}h branding shortfall`);
  const dev = Math.abs(t.mileageKm - targetMileage);
  if (dev > 100) reasons.push(`Mileage deviation ${dev} km`);
  if (t.cleaningDue) reasons.push("Deep-clean due tonight");
  if (t.stablingPenalty > 20) reasons.push("Unfavourable stabling position");
  return reasons.length ? reasons : ["No issues detected"];
}

function getTrainConflicts(train: InductionRanking): string[] {
  // Define constraint weights (higher weight = higher priority issue)
  const constraintWeights = {
    'Service Readiness': 10000,
    'Predictive Health': 5000,
    'Cleaning': 500,
    'Stabling': 300,
    'Branding': 20,
    'Mileage': 1
  };
  
  const conflicts: Array<{issue: string, weight: number}> = [];
  
  // Service Readiness issues (highest priority)
  if (train.Status.includes('HELD FOR MAINTENANCE')) {
    conflicts.push({issue: 'Open maintenance job card', weight: constraintWeights['Service Readiness']});
  }
  if (train.Status.includes('Cert Expired')) {
    conflicts.push({issue: 'Expired fitness certificate', weight: constraintWeights['Service Readiness']});
  }
  
  // Predictive Health issues
  if (train.Status.includes('High Failure Risk')) {
    conflicts.push({
      issue: `High failure risk (${(train["Health Score"] * 100).toFixed(1)}%)`, 
      weight: constraintWeights['Predictive Health']
    });
  }
  
  // Cleaning issues
  if (train.Status.includes('CLEANING')) {
    conflicts.push({issue: 'Deep cleaning scheduled', weight: constraintWeights['Cleaning']});
  }
  
  // Mileage balancing issues
  if (train.Status.includes('Mileage Balancing')) {
    conflicts.push({
      issue: `Mileage balancing required (${train["Final Mileage"].toLocaleString()} km)`, 
      weight: constraintWeights['Mileage']
    });
  }
  
  // Stabling issues
  if (train.Status.includes('Stabling')) {
    conflicts.push({issue: 'Suboptimal stabling position', weight: constraintWeights['Stabling']});
  }
  
  // Branding issues
  if (train.Status.includes('Branding')) {
    conflicts.push({issue: 'Branding contract requirements', weight: constraintWeights['Branding']});
  }
  
  // Sort by weight (highest priority first) and return just the issue strings
  const sortedConflicts = conflicts.sort((a, b) => b.weight - a.weight).map(c => c.issue);
  
  return sortedConflicts.length ? sortedConflicts : ["No issues detected"];
}

export default function Index() {
  const [weights, setWeights] = useState({
    readiness: 40,
    branding: 15,
    mileage: 15,
    cleaning: 15,
    stabling: 15,
  });
  const [selected, setSelected] = useState<string | null>(null);
  const [scheduleData, setScheduleData] = useState<ScheduleGenerationResponse | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [planningDate, setPlanningDate] = useState(new Date().toISOString().split('T')[0]);
  const explainabilityRef = useRef<HTMLDivElement>(null);
  const inductionListRef = useRef<HTMLDivElement>(null);

  // Generate schedule using the advanced model
  const generateSchedule = async () => {
    try {
      setIsGenerating(true);
      setGenerationProgress(0);
      
      // Simulate progress updates
      const progressInterval = setInterval(() => {

      setGenerationProgress(prev => {
        if (prev >= 90) return prev;
        return prev + Math.random() * 15;
      });
      }, 1000);

      // Use Netlify Function endpoint
      const response = await fetch('https://kmrlbackend-production.up.railway.app/api/schedule/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planning_date: planningDate,
        }),
      });

      clearInterval(progressInterval);
      setGenerationProgress(100);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ScheduleGenerationResponse = await response.json();
      setScheduleData(data);
      
      // Scroll to induction list after generation
      setTimeout(() => {
        inductionListRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }, 500);
      
      toast.success(`Schedule generated successfully for ${planningDate}`);
    } catch (error) {
      console.error('Schedule generation failed:', error);
      toast.error('Failed to generate schedule. Using demo data.');
    } finally {
      setIsGenerating(false);
      setGenerationProgress(0);
    }
  };

  // Load today's schedule on component mount
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setPlanningDate(today);
    
    // Try to load existing schedule for today
  fetch(`https://kmrlbackend-production.up.railway.app/api/schedule/${today}`)
      .then(response => {
        if (response.ok) {
          return response.json();
        }
        throw new Error('No existing schedule found');
      })
      .then(data => {
        setScheduleData(data);
      })
      .catch(() => {
        // No existing schedule, that's fine - user can generate one
        console.log('No existing schedule found for today');
      });
  }, []);

  // Use real schedule data if available, otherwise fall back to mock data
  const trains = scheduleData ? [] : INITIAL; // We'll use the real induction ranking instead
  const realInductionRanking = scheduleData?.solution?.induction_ranking || [];

  const scored = useMemo(() => {
    // If we have real schedule data, use it
    if (scheduleData && realInductionRanking.length > 0) {
      const processedTrains = realInductionRanking.map((train: InductionRanking) => {
        const conflicts = getTrainConflicts(train);
        const hardBlock = train.Status.includes('HELD') || train.Status.includes('BLOCKED');
        const composite = Math.round((1 - train["Health Score"]) * 100); // Invert health score for display
        
        // Determine priority order: IN SERVICE first, then STANDBY, then others
        let priority = 3; // Default priority
        if (train.Status.includes('IN SERVICE')) priority = 1;
        else if (train.Status.includes('STANDBY')) priority = 2;
        
        return {
          t: {
            id: train["Train ID"].replace('T', 'KMRL-'),
            // Mock the other properties for compatibility
            fcRS: !train.Status.includes('HELD'),
            fcSIG: !train.Status.includes('HELD'),
            fcTEL: !train.Status.includes('HELD'),
            openJobs: train.Status.includes('MAINTENANCE') ? 1 : 0,
            brandingShortfall: 0,
            mileageKm: train["Final Mileage"],
            cleaningDue: train.Status.includes('CLEANING'),
            stablingPenalty: 0,
          },
          s: {
            readiness: hardBlock ? 0 : 85,
            branding: 90,
            mileage: Math.max(0, 100 - Math.abs(train["Final Mileage"] - 80000) / 1000),
            cleaning: train.Status.includes('CLEANING') ? 65 : 100,
            stabling: 85,
          },
          composite,
          conflicts,
          hardBlock,
          status: train.Status,
          healthScore: train["Health Score"],
          priority,
        } as any; // Type assertion to handle the mixed interface
      });
      
      // Sort by priority first, then by composite score
      return processedTrains.sort((a, b) => {
        if (a.priority !== b.priority) return a.priority - b.priority;
        return b.composite - a.composite;
      });
    }

    // Fall back to mock data calculation
    const total = Object.values(weights).reduce((a, b) => a + b, 0) || 1;
    return trains
      .map((t) => {
        const s = {
          readiness: scoreReadiness(t),
          branding: scoreBranding(t),
          mileage: scoreMileage(t),
          cleaning: scoreCleaning(t),
          stabling: scoreStabling(t),
        };
        const composite = Math.round(
          (s.readiness * weights.readiness +
            s.branding * weights.branding +
            s.mileage * weights.mileage +
            s.cleaning * weights.cleaning +
            s.stabling * weights.stabling) /
            total,
        );
        const conflicts = explain(t).filter((r) => r !== "No issues detected");
        const hardBlock = !(t.fcRS && t.fcSIG && t.fcTEL) || t.openJobs > 0;
        return { t, s, composite, conflicts, hardBlock, status: 'MOCK', healthScore: 0.5, priority: 2 } as any;
      })
      .sort((a, b) => b.composite - a.composite);
  }, [trains, weights]);

  const selectedTrain = scored.find((x) => x.t.id === selected);

  const sliders = [
    { key: "readiness", label: "Service readiness" },
    { key: "branding", label: "Branding exposure" },
    { key: "mileage", label: "Mileage balancing" },
    { key: "cleaning", label: "Cleaning & detailing" },
    { key: "stabling", label: "Stabling geometry" },
  ] as const;

  const total = Object.values(weights).reduce((a, b) => a + b, 0);

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-mesh bg-grid" />
        <div className="container mx-auto py-12 md:py-16">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border bg-secondary px-3 py-1 text-xs text-secondary-foreground">
                <Sparkles className="h-3.5 w-3.5 text-primary" />{" "}
                Multi‑objective fleet induction
              </div>
              <h1 className="mt-4 text-4xl md:text-5xl font-extrabold tracking-tight">
                Algorithm‑driven decisions for Kochi Metro trainset induction
              </h1>
              <p className="mt-4 text-lg text-muted-foreground max-w-2xl">
                One place to validate clearances, honour constraints and SLAs,
                and publish a transparent ranked list — every night within the
                operating window.
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Button 
                  onClick={generateSchedule} 
                  disabled={isGenerating}
                  className="min-w-[180px]"
                >
                  {isGenerating ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>{Math.round(generationProgress)}% Generated</span>
                    </div>
                  ) : (
                    <>
                      <PlayCircle className="h-4 w-4" /> Generate Schedule
                    </>
                  )}
                </Button>
                <Button variant="outline" asChild>
                  <a href="/data">
                    <RefreshCw className="h-4 w-4" /> Connect data
                  </a>
                </Button>
                <div className="flex items-center gap-2 bg-muted/50 rounded-md px-3 py-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  <input
                    type="date"
                    value={planningDate}
                    min={new Date().toISOString().split('T')[0]}
                    max={new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                    onChange={(e) => setPlanningDate(e.target.value)}
                    className="bg-transparent border-0 text-sm font-medium focus:outline-none"
                  />
                </div>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Solver Status</CardDescription>
                  <CardTitle className="text-3xl">
                    {scheduleData?.solution?.solver_status || "READY"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  {scheduleData ? "Last optimization result" : "Awaiting schedule generation"}
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Trains Used</CardDescription>
                  <CardTitle className="text-3xl">
                    {scheduleData?.solution?.total_trains_used || "25"} / {realInductionRanking.length || "25"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  {scheduleData ? "Active fleet utilization" : "Fleet capacity"}
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Trips Serviced</CardDescription>
                  <CardTitle className="text-3xl">
                    {scheduleData?.solution?.trips_serviced || "254"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  {scheduleData?.solution?.trips_unserviced > 0 && (
                    <span className="text-orange-600">
                      {scheduleData.solution.trips_unserviced} unserviced
                    </span>
                  )}
                  {!scheduleData && "Daily service coverage"}
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Planning Date</CardDescription>
                  <CardTitle className="text-3xl">
                    {scheduleData?.planning_date ? new Date(scheduleData.planning_date).toLocaleDateString() : "Today"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  {scheduleData ? "Generated schedule" : "Current date"}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Inputs & Constraints */}
      <section className="container mx-auto py-10">
        <div className="grid lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Workflow className="h-5 w-5 text-primary" /> Heterogeneous
                inputs
              </CardTitle>
              <CardDescription>
                Near real‑time feeds unify siloed data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {[
                  {
                    label: "Fitness Certificates",
                    icon: ShieldCheck,
                    status: "Rolling‑Stock, S&T, Telecom",
                  },
                  {
                    label: "Job‑Cards",
                    icon: ListTree,
                    status: "IBM Maximo exports",
                  },
                  {
                    label: "Branding Priorities",
                    icon: BadgePercent,
                    status: "Advertiser SLAs",
                  },
                  {
                    label: "Mileage Tracking",
                    icon: Gauge,
                    status: "Bogie, brake, HVAC wear",
                  },
                  {
                    label: "Cleaning & Detailing",
                    icon: Brush,
                    status: "Bay + manpower scheduling",
                  },
                  {
                    label: "Stabling Geometry",
                    icon: Map,
                    status: "Minimise shunting operations",
                  },
                  {
                    label: "Health Monitoring",
                    icon: TrendingUp,
                    status: "IoT sensor analytics",
                  },
                  {
                    label: "Schedule Optimization",
                    icon: Clock4,
                    status: "GTFS route planning",
                  },
                  {
                    label: "Fleet Utilization",
                    icon: Layers,
                    status: "Resource allocation",
                  },
                ].map((x) => (
                  <div
                    key={x.label}
                    className="flex items-start gap-3 rounded-md border bg-muted/40 p-3"
                  >
                    <x.icon className="h-5 w-5 text-primary mt-0.5" />
                    <div className="text-sm">
                      <div className="font-medium">{x.label}</div>
                      <div className="text-muted-foreground">{x.status}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-primary" /> Objective weights
              </CardTitle>
              <CardDescription>Total must equal 100%</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {sliders.map((s) => (
                <div key={s.key} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span>{s.label}</span>
                    <span className="text-muted-foreground">
                      {weights[s.key]}%
                    </span>
                  </div>
                  <Slider
                    value={[weights[s.key]]}
                    max={100}
                    step={1}
                    onValueChange={(v) =>
                      setWeights((w) => ({ ...w, [s.key]: v[0] }))
                    }
                  />
                </div>
              ))}
              <div className="text-xs text-muted-foreground">
                Current total: {total}%
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Ranked induction list */}
      <section className="container mx-auto pb-16" ref={inductionListRef}>
        <div className="grid lg:grid-cols-3 gap-6 items-start">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary" /> Ranked
                induction list
              </CardTitle>
              <CardDescription>
                Explainable scores with conflict alerts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fleet</TableHead>
                      <TableHead>Composite</TableHead>
                      <TableHead>Readiness</TableHead>
                      <TableHead>Branding</TableHead>
                      <TableHead>Mileage (km)</TableHead>
                      <TableHead>Cleaning</TableHead>
                      <TableHead>Stabling</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {scored.map((r) => (
                      <TableRow
                        key={r.t.id}
                        className="cursor-pointer"
                        onClick={() => {
                          setSelected(r.t.id);
                          // Scroll to explainability box
                          setTimeout(() => {
                            explainabilityRef.current?.scrollIntoView({
                              behavior: 'smooth',
                              block: 'start'
                            });
                          }, 100);
                        }}
                      >
                        <TableCell className="font-medium">{r.t.id}</TableCell>
                        <TableCell>{r.composite}</TableCell>
                        <TableCell>{r.s.readiness}</TableCell>
                        <TableCell>{r.s.branding}</TableCell>
                        <TableCell>{(r.t.mileageKm / 1000).toFixed(3)}</TableCell>
                        <TableCell>{r.s.cleaning}</TableCell>
                        <TableCell>{r.s.stabling}</TableCell>
                        <TableCell>
                          {scheduleData ? (
                            <Badge 
                              variant={
                                r.status?.includes('IN SERVICE') ? "default" :
                                r.status?.includes('HELD') || r.status?.includes('BLOCKED') ? "destructive" :
                                r.status?.includes('STANDBY') ? "secondary" : "outline"
                              }
                            >
                              {r.status?.includes('IN SERVICE') ? 'In Service' :
                               r.status?.includes('HELD') ? 'Held' :
                               r.status?.includes('STANDBY') ? 'Standby' : 'Ready'}
                            </Badge>
                          ) : (
                            r.hardBlock ? (
                              <Badge variant="destructive">Blocked</Badge>
                            ) : r.conflicts.length ? (
                              <Badge variant="secondary">Check</Badge>
                            ) : (
                              <Badge className="bg-primary text-primary-foreground hover:bg-primary">
                                Ready
                              </Badge>
                            )
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card ref={explainabilityRef}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-primary" />{" "}
                  Explainability
                </CardTitle>
                <CardDescription>Selected rake rationale</CardDescription>
              </CardHeader>
              <CardContent>
                {selectedTrain ? (
                  <div className="space-y-2 text-sm">
                    <div className="font-medium">{selectedTrain.t.id}</div>
                    {scheduleData ? (
                      <>
                        <div className="text-xs text-muted-foreground mb-2">
                          Status: {selectedTrain.status}
                        </div>
                        <ul className="list-disc pl-5 text-muted-foreground space-y-1">
                          {selectedTrain.conflicts.map((r: string) => (
                            <li key={r}>{r}</li>
                          ))}
                        </ul>
                        <div className="mt-3 p-2 bg-muted rounded text-xs">
                          <div>Health Score: {(selectedTrain.healthScore * 100).toFixed(1)}%</div>
                          <div>Final Mileage: {selectedTrain.t.mileageKm.toLocaleString()} km</div>
                        </div>
                      </>
                    ) : (
                      <ul className="list-disc pl-5 text-muted-foreground space-y-1">
                        {explain(selectedTrain.t).map((r) => (
                          <li key={r}>{r}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">
                    Select a rake from the table to view reasoning.
                  </div>
                )}
              </CardContent>
            </Card>

            {scheduleData?.constraints_applied && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-primary" /> Constraints Applied
                  </CardTitle>
                  <CardDescription>6 constraint validation results</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {scheduleData.constraints_applied.map((constraint: Constraint) => (
                    <div key={constraint.name} className="flex items-center justify-between p-2 border rounded">
                      <div>
                        <div className="text-sm font-medium">{constraint.name}</div>
                        <div className="text-xs text-muted-foreground">{constraint.description}</div>
                      </div>
                      <Badge variant={constraint.status === "SATISFIED" ? "default" : constraint.status === "ACTIVE" ? "secondary" : "destructive"}>
                        {constraint.status}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-primary" /> Conflicts
                </CardTitle>
                <CardDescription>Items requiring attention</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {scored
                  .filter((x) => x.conflicts.length || x.hardBlock)
                  .slice(0, 5)
                  .map((x) => (
                    <Alert key={x.t.id}>
                      <AlertTitle className="text-sm font-medium">
                        {x.t.id}
                      </AlertTitle>
                      <AlertDescription className="text-xs text-muted-foreground">
                        {x.hardBlock ? "Blocked: " : "Warnings: "}
                        {scheduleData ? x.conflicts.join(", ") : explain(x.t).filter(r => r !== "No issues detected").join(", ") || "None"}
                      </AlertDescription>
                    </Alert>
                  ))}
                {scored.filter((x) => x.conflicts.length || x.hardBlock).length === 0 && (
                  <div className="text-sm text-muted-foreground text-center py-4">
                    No conflicts detected
                  </div>
                )}
              </CardContent>
            </Card>

            {scheduleData?.audit_trail ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ListTree className="h-5 w-5 text-primary" /> Audit Trail
                  </CardTitle>
                  <CardDescription>
                    Schedule generation events
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {scheduleData.audit_trail.map((event: AuditEvent, index: number) => (
                    <div key={index} className="flex items-start gap-2 p-2 border rounded">
                      <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                      <div>
                        <div className="font-medium text-xs">{event.event.replace(/_/g, ' ')}</div>
                        <div className="text-muted-foreground text-xs">{event.details}</div>
                        <div className="text-muted-foreground text-xs">
                          {new Date(event.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock4 className="h-5 w-5 text-primary" /> Nightly run
                  </CardTitle>
                  <CardDescription>
                    21:00 ingest → 22:00 optimise → 23:00 publish
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="rounded-md border p-3">
                    Ingest feeds and validate FCs
                  </div>
                  <div className="rounded-md border p-3">
                    Apply constraints and weights
                  </div>
                  <div className="rounded-md border p-3">
                    Rank rakes with explanations
                  </div>
                  <div className="rounded-md border p-3">
                    Notify conflicts for overrides
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

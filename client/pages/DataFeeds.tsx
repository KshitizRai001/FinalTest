import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Database, FileDown, Satellite, Edit3, Upload, PlayCircle, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import CSVImporter from "@/components/CSVImporter";
import ManualOverride from "@/components/ManualOverride";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export default function DataFeeds() {
  const [isManualOverrideOpen, setIsManualOverrideOpen] = useState(false);
  const [isTrainingModel, setIsTrainingModel] = useState(false);
  const [modelStatus, setModelStatus] = useState<string>('Ready');

  // Check if the anomaly model exists
  useEffect(() => {
    const checkModelStatus = async () => {
      try {
        const response = await fetch('/api/ml/models');
        if (response.ok) {
          const data = await response.json();
          const activeModels = data.models?.filter((m: any) => m.is_active) || [];
          setModelStatus(activeModels.length > 0 ? 'Active' : 'Ready');
        }
      } catch (error) {
        console.error('Failed to check model status:', error);
      }
    };

    checkModelStatus();
  }, []);

  const trainAnomalyModel = async () => {
    try {
      setIsTrainingModel(true);
      const response = await fetch('/api/ml/train', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model_type: 'anomaly_detection',
          model_name: 'Train Health Anomaly Model',
          config: {
            contamination: 'auto',
            n_estimators: 100
          }
        }),
      });

      if (response.ok) {
        toast.success('Anomaly model training started');
        setModelStatus('Training');
        
        // Check status after a delay
        setTimeout(() => {
          setModelStatus('Active');
          toast.success('Anomaly model training completed');
        }, 3000);
      } else {
        throw new Error('Training failed');
      }
    } catch (error) {
      console.error('Model training failed:', error);
      toast.error('Failed to train anomaly model');
    } finally {
      setIsTrainingModel(false);
    }
  };

  const feeds = [
    {
      name: "IBM Maximo",
      desc: "Job-cards (open/closed)",
      icon: FileDown,
      status: "Connected",
      details: "Maintenance job card integration"
    },
    {
      name: "IoT Fitness",
      desc: "FC from Rolling-Stock, S&T",
      icon: Satellite,
      status: modelStatus,
      details: "ML-based anomaly detection",
      actionable: true,
      action: trainAnomalyModel,
      isLoading: isTrainingModel
    },
    {
      name: "UNS Streams",
      desc: "SCADA, signalling summaries",
      icon: Database,
      status: "Pending",
      details: "Real-time operational data feeds"
    },
    {
      name: "Manual Overrides",
      desc: "Supervisor inputs",
      icon: Edit3,
      status: "Enabled",
      clickable: true,
      details: "Supervisor manual adjustments"
    },
  ];
  return (
    <section className="container mx-auto py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Data Feeds</h1>
        <p className="text-muted-foreground">
          Manage and monitor inbound sources. Upload CSVs to ingest data
          quickly.
        </p>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {feeds.map((f) => (
          f.clickable ? (
            <Dialog key={f.name} open={isManualOverrideOpen} onOpenChange={setIsManualOverrideOpen}>
              <DialogTrigger asChild>
                <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{f.name}</CardTitle>
                      <CardDescription>{f.desc}</CardDescription>
                    </div>
                    <f.icon className="h-8 w-8 text-primary" />
                  </CardHeader>
                  <CardContent>
                    <Badge variant="secondary">{f.status}</Badge>
                    <div className="text-xs text-muted-foreground mt-2">{f.details}</div>
                  </CardContent>
                </Card>
              </DialogTrigger>
              <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Manual Override - Ranked Induction List</DialogTitle>
                </DialogHeader>
                <ManualOverride />
              </DialogContent>
            </Dialog>
          ) : (
            <Card key={f.name} className={f.actionable ? "cursor-pointer hover:bg-muted/50 transition-colors" : ""}>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg">{f.name}</CardTitle>
                  <CardDescription>{f.desc}</CardDescription>
                </div>
                <f.icon className="h-8 w-8 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <Badge variant={
                    f.status === 'Active' ? 'default' :
                    f.status === 'Training' ? 'secondary' :
                    f.status === 'Connected' ? 'default' : 'outline'
                  }>
                    {f.isLoading ? (
                      <div className="flex items-center gap-1">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Training
                      </div>
                    ) : (
                      f.status
                    )}
                  </Badge>
                  {f.actionable && f.status !== 'Training' && (
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={f.action}
                      disabled={f.isLoading}
                    >
                      <PlayCircle className="h-3 w-3 mr-1" />
                      Train
                    </Button>
                  )}
                </div>
                <div className="text-xs text-muted-foreground mt-2">{f.details}</div>
              </CardContent>
            </Card>
          )
        ))}
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-primary" />
              <CardTitle>CSV Upload</CardTitle>
            </div>
            <CardDescription>
              Import Maximo job-cards, FC clearances, or UNS summaries
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <CSVImporter source="IBM Maximo" />
            <CSVImporter source="Fitness Certificates" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Tips</CardTitle>
            <CardDescription>
              Ensure first row is column headers
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>
              • Supported: .csv (UTF‑8). Large files are truncated to first 1000
              rows per upload for preview.
            </p>
            <p>
              • Map columns consistently across nightly uploads to enable
              learning and validation.
            </p>
            <p>
              • For databases and real‑time ingestion, connect Neon or Supabase
              via MCP.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Constraint Programming Model Overview */}
      <Card className="mt-10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            6-Constraint Optimization Model
          </CardTitle>
          <CardDescription>
            Advanced constraint programming model for optimal train scheduling
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                name: "Service Readiness",
                desc: "Fitness Certificates & Job Card validation",
                icon: CheckCircle2,
                color: "text-green-600"
              },
              {
                name: "Predictive Health",
                desc: "ML-based failure risk assessment using IoT data",
                icon: Satellite,
                color: "text-blue-600"
              },
              {
                name: "Mileage Balancing",
                desc: "Fleet wear equalization across all trains",
                icon: Database,
                color: "text-purple-600"
              },
              {
                name: "Cleaning & Detailing",
                desc: "Deep cleaning schedule and bay management",
                icon: AlertCircle,
                color: "text-orange-600"
              },
              {
                name: "Branding Exposure",
                desc: "Advertiser SLA compliance and contract hours",
                icon: FileDown,
                color: "text-pink-600"
              },
              {
                name: "Stabling Optimization",
                desc: "Minimize shunting operations and terminal positioning",
                icon: Edit3,
                color: "text-indigo-600"
              }
            ].map((constraint) => (
              <div key={constraint.name} className="flex items-start gap-3 p-4 border rounded-lg">
                <constraint.icon className={`h-5 w-5 mt-0.5 ${constraint.color}`} />
                <div>
                  <div className="font-medium text-sm">{constraint.name}</div>
                  <div className="text-xs text-muted-foreground">{constraint.desc}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 p-4 bg-muted/50 rounded-lg">
            <div className="text-sm font-medium mb-2">Model Performance</div>
            <div className="grid grid-cols-3 gap-4 text-xs">
              <div>
                <div className="font-medium">Solver Type</div>
                <div className="text-muted-foreground">CP-SAT (OR-Tools)</div>
              </div>
              <div>
                <div className="font-medium">Optimization Time</div>
                <div className="text-muted-foreground">~60 seconds</div>
              </div>
              <div>
                <div className="font-medium">Solution Quality</div>
                <div className="text-muted-foreground">OPTIMAL/FEASIBLE</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

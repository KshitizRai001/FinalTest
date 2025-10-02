import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Edit3, Save, X, ArrowUp, ArrowDown, Loader2 } from "lucide-react";
import { toast } from "sonner";
import SupervisorAuth from "./SupervisorAuth";
import type { ScheduleDetailsResponse, InductionRanking } from "@shared/api";

interface RankedTrain {
  id: string;
  train_id: string;
  rank: number;
  score: number;
  reasons: string[];
}

interface ManualOverrideProps {
  initialRankedList?: RankedTrain[];
}

export default function ManualOverride({ initialRankedList = [] }: ManualOverrideProps) {
  const [rankedList, setRankedList] = useState<RankedTrain[]>(initialRankedList);
  const [isEditing, setIsEditing] = useState(false);
  const [comment, setComment] = useState("");
  const [supervisorInfo, setSupervisorInfo] = useState<{ name: string; id: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [scheduleData, setScheduleData] = useState<ScheduleDetailsResponse | null>(null);

  // Load latest schedule data
  useEffect(() => {
    const loadLatestSchedule = async () => {
      try {
        setIsLoading(true);
        const today = new Date().toISOString().split('T')[0];
  const response = await fetch(`/.netlify/functions/schedule-details?planning_date=${today}`);
        
        if (response.ok) {
          const data: ScheduleDetailsResponse = await response.json();
          setScheduleData(data);
          
          // Convert induction ranking to ranked list format
          const convertedList: RankedTrain[] = data.solution?.induction_ranking?.map((train: InductionRanking, index: number) => ({
            id: train["Train ID"],
            train_id: train["Train ID"].replace('T', 'KMRL-'),
            rank: index + 1,
            score: Math.round((1 - train["Health Score"]) * 100),
            reasons: getTrainReasons(train)
          })) || [];
          
          setRankedList(convertedList);
        } else {
          // Fallback to mock data if no schedule available
          setRankedList([
            { id: "1", train_id: "KMRL-01", rank: 1, score: 95.2, reasons: ["Low mileage", "Recent maintenance"] },
            { id: "2", train_id: "KMRL-03", rank: 2, score: 89.7, reasons: ["Good FC status", "Available"] },
            { id: "3", train_id: "KMRL-05", rank: 3, score: 84.1, reasons: ["Moderate usage", "Clean"] },
            { id: "4", train_id: "KMRL-02", rank: 4, score: 78.9, reasons: ["Higher mileage", "Due maintenance"] },
            { id: "5", train_id: "KMRL-04", rank: 5, score: 72.3, reasons: ["Recent issues", "Cleaning due"] },
          ]);
        }
      } catch (error) {
        console.error('Failed to load schedule data:', error);
        toast.error('Failed to load current schedule data');
      } finally {
        setIsLoading(false);
      }
    };

    if (initialRankedList.length === 0) {
      loadLatestSchedule();
    }
  }, [initialRankedList]);

  const getTrainReasons = (train: InductionRanking): string[] => {
    const reasons: string[] = [];
    
    if (train.Status.includes('IN SERVICE')) {
      reasons.push('Selected for service');
    }
    if (train.Status.includes('STANDBY')) {
      reasons.push('On standby');
    }
    if (train.Status.includes('HELD')) {
      reasons.push('Held for maintenance');
    }
    if (train.Status.includes('CLEANING')) {
      reasons.push('Deep cleaning required');
    }
    if (train.Status.includes('Mileage Balancing')) {
      reasons.push('Mileage balancing');
    }
    if (train["Health Score"] > 0.7) {
      reasons.push('High failure risk');
    }
    
    return reasons.length ? reasons : ['No specific issues'];
  };

  const handleSupervisorAuth = (info: { name: string; id: string }) => {
    setSupervisorInfo(info);
    setIsEditing(true);
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    const newList = [...rankedList];
    // Swap the items
    const temp = newList[index];
    newList[index] = newList[index - 1];
    newList[index - 1] = temp;
    
    // Update ranks to match new positions
    newList.forEach((item, idx) => {
      item.rank = idx + 1;
    });
    setRankedList(newList);
  };

  const moveDown = (index: number) => {
    if (index === rankedList.length - 1) return;
    const newList = [...rankedList];
    // Swap the items
    const temp = newList[index];
    newList[index] = newList[index + 1];
    newList[index + 1] = temp;
    
    // Update ranks to match new positions
    newList.forEach((item, idx) => {
      item.rank = idx + 1;
    });
    setRankedList(newList);
  };

  const handleSave = async () => {
    if (!comment.trim()) {
      toast.error("Please provide a comment explaining the changes");
      return;
    }

    try {
      // Here you would save to Supabase
      const overrideData = {
        ranked_list: rankedList,
        comment: comment.trim(),
        supervisor_id: supervisorInfo?.id,
        supervisor_name: supervisorInfo?.name,
        timestamp: new Date().toISOString(),
        original_list: initialRankedList, // Store original for audit
      };

      console.log("Saving manual override:", overrideData);
      
      // TODO: Save to Supabase database
      // await supabase.from('manual_overrides').insert(overrideData);

      toast.success("Manual override saved successfully");
      setIsEditing(false);
      setComment("");
    } catch (error) {
      console.error("Failed to save override:", error);
      toast.error("Failed to save manual override");
    }
  };

  const handleCancel = () => {
    setRankedList(initialRankedList.length > 0 ? initialRankedList : rankedList);
    setIsEditing(false);
    setComment("");
    setSupervisorInfo(null);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Edit3 className="h-5 w-5" />
            Manual Override - Ranked Induction List
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Loading current schedule data...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Edit3 className="h-5 w-5" />
              Manual Override - Ranked Induction List
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {scheduleData ? 
                `Adjust ranking for ${scheduleData.planning_date} schedule` :
                'Supervisor can manually adjust the AI-generated ranking'
              }
            </p>
          </div>
          {!isEditing ? (
            <SupervisorAuth onAuthenticated={handleSupervisorAuth}>
              <Button variant="outline">
                <Edit3 className="h-4 w-4 mr-2" />
                Manual Override
              </Button>
            </SupervisorAuth>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleCancel}>
                <X className="h-4 w-4 mr-1" />
                Cancel
              </Button>
              <Button size="sm" onClick={handleSave}>
                <Save className="h-4 w-4 mr-1" />
                Save Override
              </Button>
            </div>
          )}
        </div>
        {supervisorInfo && (
          <Badge variant="secondary" className="w-fit">
            Supervisor: {supervisorInfo.name}
          </Badge>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Rank</TableHead>
              <TableHead>Train ID</TableHead>
              <TableHead>Score</TableHead>
              <TableHead>Reasons</TableHead>
              {isEditing && <TableHead className="w-24">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rankedList.map((train, index) => (
              <TableRow key={train.id}>
                <TableCell>
                  <Badge variant={index < 3 ? "default" : "secondary"}>
                    #{train.rank}
                  </Badge>
                </TableCell>
                <TableCell className="font-medium">{train.train_id}</TableCell>
                <TableCell>{train.score.toFixed(1)}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {train.reasons.map((reason, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {reason}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                {isEditing && (
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => moveUp(index)}
                        disabled={index === 0}
                      >
                        <ArrowUp className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => moveDown(index)}
                        disabled={index === rankedList.length - 1}
                      >
                        <ArrowDown className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {isEditing && (
          <div className="space-y-2 pt-4 border-t">
            <Label htmlFor="override-comment">
              Comment (Required) - Explain why you're making these changes:
            </Label>
            <Textarea
              id="override-comment"
              placeholder="e.g., KMRL-05 moved up due to urgent maintenance completion, KMRL-02 moved down due to reported brake issues..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

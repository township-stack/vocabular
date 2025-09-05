"use client";

import { useState, useTransition, useEffect } from "react";
import Link from "next/link";
import { BrainCircuit, Loader2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  planTodaysStudy,
  type PlanTodaysStudyOutput,
} from "@/ai/flows/plan-todays-study";
import { useToast } from "@/hooks/use-toast";

export default function StudyPlanner() {
  const [isPending, startTransition] = useTransition();
  const [plan, setPlan] = useState<PlanTodaysStudyOutput | null>(null);
  const { toast } = useToast();

  const handlePlanStudy = () => {
    startTransition(async () => {
      try {
        // Mocked result for UI development
        await new Promise(resolve => setTimeout(resolve, 1000));
        const result = {
          recommendedTargetCount: 25,
          reasoning: "Based on your recent progress and card distribution, 25 cards is an ideal target to maintain momentum without feeling overwhelmed."
        };
        setPlan(result);
      } catch (e) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to generate study plan. Please try again.",
        });
        console.error(e);
      }
    });
  };

  useEffect(() => {
    handlePlanStudy();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Card className="h-full flex flex-col bg-card border-2 border-primary/20 shadow-lg shadow-primary/5">
      <CardHeader>
        <div className="flex items-center gap-4">
          <div className="bg-primary/10 text-primary p-3 rounded-lg">
            <BrainCircuit className="h-6 w-6" />
          </div>
          <div>
            <CardTitle>AI-Powered Study Plan</CardTitle>
            <CardDescription>
              Your personalized study goal for today.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 flex-grow">
        {isPending && !plan ? (
           <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
           </div>
        ) : plan ? (
          <div>
            <p className="text-muted-foreground mb-4 text-sm">
              {plan.reasoning}
            </p>
            <p className="text-5xl font-bold text-foreground">
              {plan.recommendedTargetCount}{" "}
              <span className="text-xl font-medium text-muted-foreground">
                cards
              </span>
            </p>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground text-center">
              Could not generate a plan.
              <br />
              Click the button to try again.
            </p>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between items-center border-t pt-4 mt-4">
        <Button onClick={handlePlanStudy} variant="ghost" disabled={isPending}>
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Regenerating...
            </>
          ) : (
            "Regenerate Plan"
          )}
        </Button>
        {plan && (
          <Link href="/study" passHref>
            <Button>
              Start Studying
            </Button>
          </Link>
        )}
      </CardFooter>
    </Card>
  );
}

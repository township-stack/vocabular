import { Lightbulb, Calendar, BookOpen } from "lucide-react";
import StatCard from "@/components/dashboard/stat-card";
import StudyPlanner from "@/components/dashboard/study-planner";
import CategoryList from "@/components/dashboard/category-list";
import { MOCK_SRS_DATA } from "@/lib/mock-data";

export default function DashboardPage() {
  const dueCards = MOCK_SRS_DATA.filter(
    (card) => card.dueAt && card.dueAt <= new Date()
  ).length;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Welcome back!</h1>
        <p className="text-muted-foreground">
          Here's your progress. Keep up the great work!
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Cards to Review"
          value={dueCards.toString()}
          icon={<Calendar />}
          description="Due today"
        />
        <StatCard
          title="Daily Goal"
          value="0 / 30"
          icon={<BookOpen />}
          description="You're on your way!"
        />
        <StatCard
          title="Current Streak"
          value="5 days"
          icon={<Lightbulb />}
          description="Consistency is key"
        />
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <StudyPlanner />
        </div>
        <div>
          <CategoryList />
        </div>
      </div>
    </div>
  );
}

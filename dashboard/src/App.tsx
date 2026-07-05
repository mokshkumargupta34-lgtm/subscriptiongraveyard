import { Ghost, Shovel, Skull, CalendarClock } from "lucide-react";
import { Sidebar } from "@/components/ui/sidebar";
import { Topbar } from "@/components/ui/topbar";
import { StatCard } from "@/components/ui/stat-card";
import { WasteChart } from "@/components/ui/waste-chart";
import { PlotsTable } from "@/components/ui/plots-table";
import { RadarCard } from "@/components/ui/radar-card";
import { Renewals } from "@/components/ui/renewals";
import { ActivityFeed } from "@/components/ui/activity-feed";
import { Ghosts } from "@/components/ui/ghosts";

export default function App() {
  return (
    <div className="relative flex min-h-screen bg-night-0 bg-[radial-gradient(60%_40%_at_20%_0%,rgba(122,108,240,0.08),transparent),radial-gradient(50%_35%_at_85%_100%,rgba(74,61,143,0.1),transparent)]">
      <Ghosts />
      <Sidebar />

      <div className="relative min-w-0 flex-1">
        <Topbar />

        <main className="flex flex-col gap-6 p-6 lg:p-8">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              index={0}
              icon={Skull}
              label="LIFETIME DAMAGE"
              value={3532}
              prefix="$"
              trend="+$186 this month"
              trendTone="bad"
              spark={[310, 890, 1540, 2260, 2980, 3532]}
              glints
            />
            <StatCard index={1} icon={Ghost} label="ACTIVE SPIRITS" value={14} trend="4 never used" trendTone="bad" spark={[6, 8, 9, 11, 12, 14]} />
            <StatCard index={2} icon={Shovel} label="BURIED FOR GOOD" value={9} trend="+2 this week" spark={[1, 2, 4, 5, 7, 9]} />
            <StatCard index={3} icon={CalendarClock} label="NEXT RENEWAL" value={3} suffix=" days" trend="GymRat+ · $29.00" trendTone="bad" />
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <div className="xl:col-span-2">
              <WasteChart />
            </div>
            <RadarCard />
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <div className="min-w-0 xl:col-span-2">
              <PlotsTable />
            </div>
            <div className="flex flex-col gap-6">
              <Renewals />
              <ActivityFeed />
            </div>
          </div>

          <p className="pb-2 pt-4 text-center font-mono text-[9px] tracking-[0.3em] text-muted/60">
            SUBSCRIPTION GRAVEYARD · THE RECKONING, LIVE
          </p>
        </main>
      </div>
    </div>
  );
}

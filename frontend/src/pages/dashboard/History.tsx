import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { useState } from "react";
import { analysisService } from "@/services/analysisService";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RiskBadge } from "@/components/RiskBadge";
import { formatINR } from "@/utils/format";
import { Search, ArrowRight, Wheat } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export function History() {
  const { data, isLoading } = useQuery({ queryKey: ["history"], queryFn: () => analysisService.getHistory() });
  const [q, setQ] = useState("");
  const filtered = (data ?? []).filter(h => h.crop.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">History</h1>
          <p className="mt-1 text-sm text-muted-foreground">All your past analyses.</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search crop…" className="w-64 pl-9" value={q} onChange={e => setQ(e.target.value)} />
        </div>
      </div>

      <Card>
        {isLoading ? <div className="p-6 space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-10" />)}</div>
          : filtered.length === 0 ? (
            <div className="p-12 text-center">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-muted"><Wheat className="h-6 w-6 text-muted-foreground" /></div>
              <p className="mt-4 text-sm text-muted-foreground">No analyses yet.</p>
              <Button asChild className="mt-4 gradient-primary text-primary-foreground"><Link to="/dashboard/new-analysis">Run your first analysis</Link></Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Crop</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Risk</TableHead>
                  <TableHead>Recommendation</TableHead>
                  <TableHead className="text-right">Profit</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(h => (
                  <TableRow key={h.id}>
                    <TableCell className="font-medium">{h.crop} <span className="text-muted-foreground">· {h.quantity_kg} kg</span></TableCell>
                    <TableCell className="text-muted-foreground">{new Date(h.created_at).toLocaleDateString("en-IN")}</TableCell>
                    <TableCell><RiskBadge risk={h.spoilage.risk_level} /></TableCell>
                    <TableCell>{h.recommendation.action}</TableCell>
                    <TableCell className="text-right font-semibold text-primary">{formatINR(h.recommendation.expected_profit)}</TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="ghost" size="sm"><Link to={`/dashboard/result/${h.id}`}>View <ArrowRight className="ml-1 h-3 w-3" /></Link></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
      </Card>
    </div>
  );
}

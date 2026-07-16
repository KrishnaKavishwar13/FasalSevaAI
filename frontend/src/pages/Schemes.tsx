import { useQuery } from "@tanstack/react-query";
import { schemeService } from "@/services/schemeService";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, Landmark } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useState } from "react";

export function Schemes() {
  const { data, isLoading } = useQuery({ queryKey: ["schemes"], queryFn: () => schemeService.getSchemes() });

  const [landSize, setLandSize] = useState<string>("");
  const [classification, setClassification] = useState<string>("");

  const handleClassify = () => {
    if (landSize === "<1") setClassification("Marginal Farmer");
    else if (landSize === "1-2") setClassification("Small Farmer");
    else if (landSize === "2-4") setClassification("Semi-Medium Farmer");
    else if (landSize === "4-10") setClassification("Medium Farmer");
    else if (landSize === ">10") setClassification("Large Farmer");
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-10 sm:px-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Government schemes</h1>
        <p className="mt-1 text-sm text-muted-foreground">Subsidies, insurance and infrastructure programmes relevant to your crop.</p>
      </div>

      {!classification ? (
        <Card className="p-6 max-w-lg">
          <h2 className="text-xl font-semibold mb-4">Select your land size to see eligible schemes</h2>
          <div className="space-y-4">
            <div>
              <Label>Land Size (Hectares)</Label>
              <Select value={landSize} onValueChange={setLandSize}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select land size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="<1">Less than 1 ha</SelectItem>
                  <SelectItem value="1-2">1 to 2 ha</SelectItem>
                  <SelectItem value="2-4">2 to 4 ha</SelectItem>
                  <SelectItem value="4-10">4 to 10 ha</SelectItem>
                  <SelectItem value=">10">More than 10 ha</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleClassify} disabled={!landSize} className="w-full">
              Find Schemes
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between rounded-lg bg-primary/10 px-4 py-3">
            <div>
              <p className="text-sm text-muted-foreground">Based on your land size, you are classified as:</p>
              <p className="text-lg font-bold text-primary">{classification}</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setClassification("")}>Change</Button>
          </div>

      {isLoading ? <div className="grid gap-4 md:grid-cols-2">{[1,2,3,4].map(i => <Skeleton key={i} className="h-56" />)}</div> : (
        <div className="grid gap-4 md:grid-cols-2">
          {data?.map((s, i) => (
            <motion.div key={s.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className="h-full p-6">
                <div className="flex items-start justify-between gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary"><Landmark className="h-5 w-5" /></div>
                  <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">{s.category}</span>
                </div>
                <h3 className="mt-4 text-lg font-semibold">{s.name}</h3>
                {s.short_name && <p className="text-xs text-muted-foreground">{s.short_name}</p>}
                <p className="mt-2 text-sm text-muted-foreground">{s.description}</p>
                <div className="mt-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Eligibility</p>
                  <p className="mt-1 text-xs text-foreground/80">{s.eligibility}</p>
                </div>
                <div className="mt-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Key benefits</p>
                  <ul className="mt-1 space-y-1 text-xs text-foreground/80">
                    {s.benefits.map(b => <li key={b}>• {b}</li>)}
                  </ul>
                </div>
                <Button asChild variant="outline" size="sm" className="mt-5 w-full">
                  <a href={s.link} target="_blank" rel="noreferrer">Official link <ExternalLink className="ml-1 h-3.5 w-3.5" /></a>
                </Button>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
      )}
    </div>
  );
}

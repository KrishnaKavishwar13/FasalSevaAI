import { motion, useReducedMotion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { StatCounter } from "@/components/StatCounter";
import { ArrowRight, PlayCircle, Sparkles, Timer, LineChart, Warehouse, Cloud, Mic, Calculator, Landmark, Scan, Leaf } from "lucide-react";
import heroImg from "@/assets/hero-farmer.jpg";
import coldStorageImg from "@/assets/cold-storage.jpg";
import marketImg from "@/assets/market-produce.jpg";
import droneImg from "@/assets/drone-fields.jpg";

const FEATURES = [
  { icon: Scan,      title: "Crop Registration",     desc: "Quick entry of crop, quantity, harvest date, and location to start an analysis." },
  { icon: Timer,     title: "Shelf-Life Prediction", desc: "ML-driven remaining safe storage days with a Green/Yellow/Red risk level." },
  { icon: LineChart, title: "Market Intelligence",   desc: "Today's mandi price plus a 15-day forecast from a trained XGBoost model." },
  { icon: Warehouse, title: "Cold Storage Discovery",desc: "Map and list of nearby storage with real-time availability and pricing." },
  { icon: Sparkles,  title: "Decision Engine",       desc: "Compares sell-now vs. store vs. process and recommends the highest-profit path." },
  { icon: Calculator,title: "Profit Simulator",      desc: "Side-by-side profit comparison across all three options with clear cost breakdowns." },
  { icon: Cloud,     title: "Weather Intelligence",  desc: "Temperature, humidity and rain risk that could accelerate spoilage." },
  { icon: Mic,       title: "Voice Assistant",       desc: "Hindi voice interaction for farmers less comfortable typing." },
  { icon: Landmark,  title: "Government Schemes",    desc: "Relevant subsidy and insurance scheme awareness matched to your crop." },
];

const WORKFLOW = [
  { label: "Farmer Input",       icon: Scan },
  { label: "Weather",            icon: Cloud },
  { label: "ML Prediction",      icon: Timer },
  { label: "Market Intelligence",icon: LineChart },
  { label: "Decision Engine",    icon: Sparkles },
  { label: "Storage",            icon: Warehouse },
  { label: "Profit Simulation",  icon: Calculator },
  { label: "Recommendation",     icon: Leaf },
];

const FloatingLeaf = ({ delay, x, y, size, rotateStart, rotateEnd, duration }: { delay: number; x: number; y: number; size: number, rotateStart: number, rotateEnd: number, duration: number }) => (
  <motion.div
    initial={{ y: 0, x: 0, opacity: 0, rotate: rotateStart }}
    animate={{ 
      y: [0, -30, 0, 30, 0], 
      x: [0, 20, 0, -20, 0],
      opacity: [0.1, 0.4, 0.1],
      rotate: [rotateStart, rotateEnd, rotateStart]
    }}
    transition={{ duration, repeat: Infinity, delay, ease: "easeInOut" }}
    className="absolute text-primary pointer-events-none hidden md:block"
    style={{ left: `${x}%`, top: `${y}%` }}
  >
    <Leaf size={size} strokeWidth={1.5} />
  </motion.div>
);

export function Landing() {
  const reduce = useReducedMotion();
  const fade = reduce ? {} : { initial: { opacity: 0, y: 24 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, margin: "-80px" }, transition: { duration: 0.6, ease: "easeOut" as const } };

  return (
    <>
      {/* ---------- HERO ---------- */}
      <section className="relative overflow-hidden gradient-hero min-h-[90vh] flex items-center">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <FloatingLeaf delay={0} x={10} y={20} size={32} rotateStart={0} rotateEnd={45} duration={12} />
          <FloatingLeaf delay={2} x={85} y={15} size={48} rotateStart={-20} rotateEnd={20} duration={15} />
          <FloatingLeaf delay={4} x={15} y={75} size={24} rotateStart={45} rotateEnd={90} duration={10} />
          <FloatingLeaf delay={1} x={90} y={80} size={36} rotateStart={-45} rotateEnd={0} duration={14} />
          <FloatingLeaf delay={3} x={45} y={10} size={20} rotateStart={10} rotateEnd={60} duration={11} />
        </div>
        
        <div className="mx-auto grid max-w-7xl gap-10 px-4 pb-16 pt-14 sm:px-6 md:grid-cols-2 md:items-center md:pb-24 md:pt-20">
          <div className="relative z-10">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <Sparkles className="h-3.5 w-3.5" /> Post-Harvest Decision Intelligence
            </span>
            <motion.h1 {...fade} className="mt-5 text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl md:text-6xl">
              AI-powered decisions,<br /> <span className="text-gradient-primary">from harvest to sale.</span>
            </motion.h1>
            <motion.p {...fade} transition={{ ...fade.transition, delay: 0.1 }} className="mt-5 max-w-xl text-base text-muted-foreground sm:text-lg">
              Knowing today's price isn't enough. FasalSeva AI tells you whether to <b className="text-foreground">sell now</b>, <b className="text-foreground">wait</b>, or <b className="text-foreground">store</b> — based on how long your crop will last and where prices are heading.
            </motion.p>
            <motion.div {...fade} transition={{ ...fade.transition, delay: 0.2 }} className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="gradient-primary text-primary-foreground shadow-elegant">
                <Link to="/dashboard/new-analysis">Start Analysis <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
              <Button size="lg" variant="outline"><PlayCircle className="mr-2 h-4 w-4" /> Watch demo</Button>
            </motion.div>
            <div className="mt-10 grid max-w-lg grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                { v: 30, s: "%", label: "Post-harvest loss*" },
                { v: 13, s: "B", p: "₹", label: "Annual distress-sale loss*" },
                { v: 14, s: "+", label: "Supported crops" },
                { v: 0,  s: "AI", label: "Decision engine" },
              ].map((s, i) => (
                <div key={i} className="rounded-xl border border-border/60 bg-card p-4 shadow-card">
                  <div className="text-2xl font-bold tracking-tight">
                    {s.v === 0 ? s.s : <><StatCounter value={s.v} suffix={s.s} prefix={s.p} /></>}
                  </div>
                  <p className="mt-1 text-[11px] leading-tight text-muted-foreground">{s.label}</p>
                </div>
              ))}
            </div>
            <p className="mt-3 text-[10px] text-muted-foreground">*Industry-cited estimates for illustrative context, not proprietary claims.</p>
          </div>
          <motion.div {...fade} className="relative z-10">
            <div className="absolute -inset-6 rounded-[2rem] bg-primary/15 blur-3xl" />
            <motion.div 
              animate={{ y: [-10, 10, -10] }} 
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            >
              <img src={heroImg} alt="Indian farmer with tomato in a green field at golden hour" width={1600} height={1100}
                className="relative w-full rounded-3xl border border-border/60 object-cover shadow-elegant" />
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="absolute -bottom-6 -left-6 hidden rounded-2xl border border-border bg-card/95 p-4 shadow-card-hover backdrop-blur sm:block"
            >
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Recommendation</p>
              <p className="mt-1 text-lg font-semibold flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /> Store Tomato · 8 days</p>
              <p className="text-xs text-primary font-medium mt-1 bg-primary/10 inline-block px-2 py-0.5 rounded-full">Expected profit ↑ ₹5,140</p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ---------- ABOUT ---------- */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="grid gap-10 md:grid-cols-2 md:items-center">
          <motion.div {...fade}>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">The problem is a decision, not a data-point.</h2>
            <p className="mt-4 text-muted-foreground">
              Every year millions of Indian farmers under-sell because they lack three things at the same time: how long their crop will last, where prices will move next, and where to store it in the meantime. Individual tools exist. A single decision does not.
            </p>
            <p className="mt-3 text-muted-foreground">
              FasalSeva AI stitches spoilage prediction, mandi forecasting, storage discovery and government-scheme awareness into one recommendation — with the profit math already done for you.
            </p>
          </motion.div>
          <div className="grid grid-cols-2 gap-3">
            {[droneImg, marketImg, coldStorageImg, heroImg].map((src, i) => (
              <motion.img key={i} {...fade} transition={{ ...fade.transition, delay: i * 0.05 }}
                src={src} alt="" loading="lazy"
                className="h-40 w-full rounded-2xl object-cover shadow-card md:h-48" />
            ))}
          </div>
        </div>
      </section>

      {/* ---------- FEATURES ---------- */}
      <section id="features" className="border-y border-border/60 bg-muted/30 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <motion.div {...fade} className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-wider text-primary">What's inside</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Nine capabilities, one decision.</h2>
            <p className="mt-3 text-muted-foreground">Each one is engineered to slot into a single recommendation — not another dashboard for you to interpret.</p>
          </motion.div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f, i) => (
              <motion.div key={f.title} {...fade} transition={{ ...fade.transition, delay: i * 0.04 }}
                className="group rounded-2xl border border-border/60 bg-card p-6 transition-all hover:-translate-y-1 hover:shadow-card-hover">
                <span className="inline-grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <f.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 text-lg font-semibold">{f.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- WORKFLOW ---------- */}
      <section id="workflow" className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <motion.div {...fade} className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">Workflow</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">From input to recommendation in seconds.</h2>
        </motion.div>
        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {WORKFLOW.map((w, i) => (
            <motion.div key={w.label} {...fade} transition={{ ...fade.transition, delay: i * 0.05 }}
              className="relative rounded-2xl border border-border/60 bg-card p-5 shadow-card">
              <div className="flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-lg gradient-primary text-primary-foreground text-sm font-bold">{i + 1}</span>
                <w.icon className="h-4 w-4 text-primary" />
              </div>
              <p className="mt-3 text-sm font-semibold">{w.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ---------- CTA ---------- */}
      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
        <motion.div {...fade}
          className="relative overflow-hidden rounded-3xl border border-border/60 gradient-primary p-10 text-primary-foreground shadow-elegant sm:p-14">
          <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          <div className="relative flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div className="max-w-xl">
              <h3 className="text-3xl font-bold tracking-tight sm:text-4xl">Ready to stop guessing?</h3>
              <p className="mt-3 text-primary-foreground/80">Run your first analysis in under a minute — no signup required for the demo.</p>
            </div>
            <div className="flex gap-3">
              <Button asChild size="lg" variant="secondary" className="bg-white text-primary hover:bg-white/90">
                <Link to="/dashboard/new-analysis">Try demo</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white/40 bg-transparent text-primary-foreground hover:bg-white/10">
                <Link to="/signup">Create account</Link>
              </Button>
            </div>
          </div>
        </motion.div>
      </section>
    </>
  );
}

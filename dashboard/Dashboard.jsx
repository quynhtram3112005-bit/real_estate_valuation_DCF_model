import React, { useState, useMemo } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, ReferenceLine, Area, AreaChart
} from "recharts";

// ---------------------------------------------------------------------------
// DATA — extracted from the An Gia Nhà Bè DCF workbook (real, constant 2024 VND)
// ---------------------------------------------------------------------------
const YEARS = [2024,2025,2026,2027,2028,2029,2030,2031,2032,2033,2034,2035,2036,2037,2038,2039,2040,2041,2042,2043,2044,2045,2046,2047,2048,2049,2050,2051,2052,2053];

const EGI = [null,null,null,89096,113330,140152,169784,179971,188969,198418,208338,218755,229693,238881,248436,258374,268708,279457,287840,296476,305370,314531,323967,333686,343697,354008,364628,375567,375567,375567];
const NOI = [null,null,null,56144,75531,96988,135827,143976,151175,158734,166671,175004,183754,191105,198749,206699,214967,223565,230272,237181,244296,251625,259174,266949,274957,283206,291702,300453,300453,300453];

const FCF_PROJECT = [-157898,-211311,-119860,36398,45122,54778,57122,60789,57655,58060,60311,62696,65221,67274,69426,71682,74044,76519,78782,81114,83515,85989,88536,91161,93863,96647,99515,102468,98403,98403];
const FCF_EQUITY  = [-126318,-63393,0,19289,28014,37669,40014,12575,11152,13267,17229,21324,25561,29325,33188,37154,41227,76519,78782,81114,83515,85989,88536,91161,93863,96647,99515,102468,98403,98403];

const ADSCR_YEARS = [2027,2028,2029,2030,2031,2032,2033,2034,2035,2036,2037,2038,2039,2040];
const ADSCR = [2.13,2.64,3.20,3.34,1.26,1.24,1.30,1.40,1.52,1.64,1.77,1.92,2.08,2.26];

const COST_BREAKDOWN = [
  { name: "CBRE Management Fee", value: 87502, note: "50% of NOI" },
  { name: "Direct Leasing Service Costs", value: 32813, note: "15% of EGI" },
  { name: "Administrative Costs", value: 10938, note: "5% of EGI" },
  { name: "Maintenance & Common-Area Fees", value: 8750, note: "5% of NOI + fixed" },
  { name: "Land Lease Fee", value: 4000, note: "Fixed, 2024 real terms" },
];

const KPI = {
  npvTipv: 27.1, irrTipv: 10.6,
  npvEpv: 41.7, irrEpv: 13.8,
  wacc: 10.1, hurdle: 12.0,
  adscrAvg: 2.07, adscrMin: 1.24,
};

// ---------------------------------------------------------------------------
// PALETTE / TOKENS
// ---------------------------------------------------------------------------
const C = {
  bg: "#0B1220",
  panel: "#111B2D",
  panelAlt: "#0E1726",
  line: "#22324A",
  lineFaint: "#1A2840",
  ink: "#EAF0F7",
  inkDim: "#8B9BB4",
  inkFaint: "#5A6B85",
  gold: "#C9A24B",
  goldDim: "#8A7138",
  teal: "#5EEAD4",
  tealDim: "#1F6F63",
  coral: "#F08770",
  blue: "#7AA7E8",
};

const PIE_COLORS = [C.gold, C.teal, C.blue, C.coral, "#9C8AC9"];

const fontDisplay = "'Fraunces', Georgia, serif";
const fontMono = "'IBM Plex Mono', 'Courier New', monospace";
const fontSans = "'Inter', -apple-system, sans-serif";

// ---------------------------------------------------------------------------
// SMALL HELPERS
// ---------------------------------------------------------------------------
function fmtBn(v) {
  if (v === null || v === undefined) return "–";
  return (v / 1).toLocaleString("en-US", { maximumFractionDigits: 0 });
}
function fmtBnK(v) {
  if (v === null || v === undefined) return "–";
  return (v / 1000).toFixed(1);
}

function Eyebrow({ children }) {
  return (
    <div style={{
      fontFamily: fontMono, fontSize: 10.5, letterSpacing: "0.18em",
      color: C.inkFaint, textTransform: "uppercase", marginBottom: 6,
    }}>{children}</div>
  );
}

function PanelTitle({ index, title, subtitle }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 2 }}>
      <span style={{ fontFamily: fontMono, fontSize: 11, color: C.goldDim }}>{index}</span>
      <h3 style={{
        fontFamily: fontDisplay, fontWeight: 500, fontSize: 17, color: C.ink,
        margin: 0, letterSpacing: "0.01em",
      }}>{title}</h3>
      {subtitle && (
        <span style={{ fontFamily: fontMono, fontSize: 10.5, color: C.inkFaint, marginLeft: "auto" }}>
          {subtitle}
        </span>
      )}
    </div>
  );
}

function Panel({ children, style }) {
  return (
    <div style={{
      background: `linear-gradient(180deg, ${C.panel} 0%, ${C.panelAlt} 100%)`,
      border: `1px solid ${C.line}`,
      borderRadius: 4,
      padding: "22px 24px 18px",
      position: "relative",
      ...style,
    }}>
      <div style={{
        position: "absolute", top: 0, left: 0, width: 28, height: 1,
        background: C.gold, opacity: 0.6,
      }} />
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// KPI CARD
// ---------------------------------------------------------------------------
function KpiCard({ index, label, value, unit, deltaLabel, deltaGood, footnote }) {
  return (
    <div style={{
      background: C.panel,
      border: `1px solid ${C.line}`,
      borderTop: `2px solid ${C.gold}`,
      borderRadius: 3,
      padding: "18px 20px",
      minWidth: 0,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <Eyebrow>{label}</Eyebrow>
        <span style={{ fontFamily: fontMono, fontSize: 10, color: C.inkFaint }}>{index}</span>
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 2 }}>
        <span style={{
          fontFamily: fontDisplay, fontSize: 38, fontWeight: 600, color: C.ink,
          letterSpacing: "-0.01em", fontVariantNumeric: "tabular-nums", lineHeight: 1,
        }}>{value}</span>
        <span style={{ fontFamily: fontMono, fontSize: 13, color: C.inkDim }}>{unit}</span>
      </div>
      {deltaLabel && (
        <div style={{
          marginTop: 8, fontFamily: fontMono, fontSize: 11.5,
          color: deltaGood ? C.teal : C.coral, display: "flex", alignItems: "center", gap: 5,
        }}>
          <span style={{ fontSize: 13 }}>{deltaGood ? "▲" : "▼"}</span>
          {deltaLabel}
        </div>
      )}
      {footnote && (
        <div style={{ marginTop: 6, fontFamily: fontSans, fontSize: 11, color: C.inkFaint, lineHeight: 1.4 }}>
          {footnote}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// CUSTOM TOOLTIP
// ---------------------------------------------------------------------------
function ChartTooltip({ active, payload, label, unit = "bn VND" }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div style={{
      background: "#0A1018", border: `1px solid ${C.line}`, borderRadius: 3,
      padding: "10px 14px", fontFamily: fontMono, fontSize: 12, color: C.ink,
      boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
    }}>
      <div style={{ color: C.inkFaint, marginBottom: 6, fontSize: 11 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: 16, marginTop: 2 }}>
          <span style={{ color: p.color }}>{p.name}</span>
          <span style={{ fontWeight: 600 }}>
            {p.value === null || p.value === undefined ? "–" : `${p.value.toLocaleString("en-US", {maximumFractionDigits:0})} ${unit}`}
          </span>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// MAIN DASHBOARD
// ---------------------------------------------------------------------------
export default function Dashboard() {
  const [revRange, setRevRange] = useState("full");
  const [fcfRange, setFcfRange] = useState("full");

  const revData = useMemo(() => {
    const start = revRange === "ops" ? YEARS.indexOf(2027) : 0;
    return YEARS.slice(start).map((y, i) => ({
      year: y,
      EGI: EGI[start + i],
      NOI: NOI[start + i],
    }));
  }, [revRange]);

  const fcfData = useMemo(() => {
    const start = fcfRange === "ops" ? YEARS.indexOf(2027) : 0;
    return YEARS.slice(start).map((y, i) => ({
      year: y,
      "FCF — Project (TIPV)": FCF_PROJECT[start + i],
      "FCF — Equity (EPV)": FCF_EQUITY[start + i],
    }));
  }, [fcfRange]);

  const adscrData = ADSCR_YEARS.map((y, i) => ({ year: y, ADSCR: ADSCR[i] }));
  const totalCost = COST_BREAKDOWN.reduce((s, d) => s + d.value, 0);

  return (
    <div style={{
      minHeight: "100vh",
      background: `radial-gradient(ellipse 1200px 600px at 50% -10%, #16223A 0%, ${C.bg} 60%)`,
      color: C.ink,
      fontFamily: fontSans,
      padding: "0 0 60px",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400..700&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; }
        .toggle-btn {
          font-family: ${fontMono}; font-size: 10.5px; letter-spacing: 0.05em;
          background: transparent; border: 1px solid ${C.line}; color: ${C.inkDim};
          padding: 5px 10px; border-radius: 2px; cursor: pointer; transition: all 0.15s;
        }
        .toggle-btn:hover { border-color: ${C.gold}; color: ${C.ink}; }
        .toggle-btn.active { background: ${C.gold}; border-color: ${C.gold}; color: #0B1220; font-weight: 600; }
        .legend-dot { display:inline-block; width:8px; height:8px; border-radius:50%; margin-right:6px; }
        ::selection { background: ${C.gold}; color: #0B1220; }
      `}</style>

      {/* HEADER */}
      <div style={{
        borderBottom: `1px solid ${C.line}`,
        padding: "28px 48px 22px",
        display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 16,
      }}>
        <div>
          <Eyebrow>Investment Committee · Real-Terms DCF Model</Eyebrow>
          <h1 style={{
            fontFamily: fontDisplay, fontWeight: 600, fontSize: 30, margin: "2px 0 4px",
            color: C.ink, letterSpacing: "-0.01em",
          }}>
            An Gia — Nhà Bè Residential Leasing Project
          </h1>
          <div style={{ fontFamily: fontMono, fontSize: 12, color: C.inkDim }}>
            175-unit lease asset · 3.2 ha · 2024–2053 · constant 2024 VND
          </div>
        </div>
        <div style={{ textAlign: "right", fontFamily: fontMono, fontSize: 11, color: C.inkFaint, lineHeight: 1.6 }}>
          <div>VALUATION DASHBOARD</div>
          <div style={{ color: C.gold }}>● LIVE MODEL OUTPUT</div>
        </div>
      </div>

      <div style={{ maxWidth: 1320, margin: "0 auto", padding: "32px 48px 0" }}>

        {/* KPI ROW */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 28 }}>
          <KpiCard
            index="01" label="Project NPV (TIPV)"
            value={KPI.npvTipv.toFixed(1)} unit="bn VND"
            deltaLabel={`IRR ${KPI.irrTipv}% vs WACC`} deltaGood={true}
            footnote="Unlevered, discounted at year-specific real WACC"
          />
          <KpiCard
            index="02" label="Equity NPV (EPV)"
            value={KPI.npvEpv.toFixed(1)} unit="bn VND"
            deltaLabel={`IRR ${KPI.irrEpv}% vs 12.0% hurdle`} deltaGood={true}
            footnote="Levered free cash flow to An Gia shareholders"
          />
          <KpiCard
            index="03" label="Blended WACC"
            value={KPI.wacc.toFixed(1)} unit="%"
            deltaLabel={`${(KPI.hurdle - KPI.wacc).toFixed(1)} pp below cost of equity`} deltaGood={true}
            footnote="Real terms — debt-weighted average across loan life"
          />
          <KpiCard
            index="04" label="Avg. ADSCR"
            value={KPI.adscrAvg.toFixed(2)} unit="×"
            deltaLabel={`min ${KPI.adscrMin.toFixed(2)}× in 2032`} deltaGood={KPI.adscrMin > 1.2}
            footnote="2027–2040 debt repayment period"
          />
        </div>

        {/* CHART GRID ROW 1 */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>

          {/* REVENUE FORECAST */}
          <Panel>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <PanelTitle index="A" title="Revenue Forecast" subtitle="bn VND, real" />
              <div style={{ display: "flex", gap: 6 }}>
                <button className={`toggle-btn ${revRange === "full" ? "active" : ""}`} onClick={() => setRevRange("full")}>2024–53</button>
                <button className={`toggle-btn ${revRange === "ops" ? "active" : ""}`} onClick={() => setRevRange("ops")}>2027–53</button>
              </div>
            </div>
            <div style={{ fontFamily: fontSans, fontSize: 12, color: C.inkDim, marginBottom: 4 }}>
              Effective Gross Income vs. Net Operating Income
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={revData} margin={{ top: 10, right: 12, left: -6, bottom: 0 }}>
                <CartesianGrid stroke={C.lineFaint} vertical={false} />
                <XAxis dataKey="year" tick={{ fill: C.inkFaint, fontFamily: fontMono, fontSize: 10.5 }}
                  axisLine={{ stroke: C.line }} tickLine={false} interval={revRange === "full" ? 4 : 3} />
                <YAxis tick={{ fill: C.inkFaint, fontFamily: fontMono, fontSize: 10.5 }}
                  axisLine={false} tickLine={false} tickFormatter={(v) => `${Math.round(v/1000)}k`} width={42} />
                <Tooltip content={<ChartTooltip />} />
                <Line type="monotone" dataKey="EGI" name="EGI" stroke={C.gold} strokeWidth={2} dot={false} connectNulls />
                <Line type="monotone" dataKey="NOI" name="NOI" stroke={C.teal} strokeWidth={2} dot={false} connectNulls />
              </LineChart>
            </ResponsiveContainer>
            <div style={{ display: "flex", gap: 18, marginTop: 6, fontFamily: fontMono, fontSize: 11, color: C.inkDim }}>
              <span><span className="legend-dot" style={{ background: C.gold }} />EGI — Effective Gross Income</span>
              <span><span className="legend-dot" style={{ background: C.teal }} />NOI — Net Operating Income</span>
            </div>
          </Panel>

          {/* FREE CASH FLOW FORECAST */}
          <Panel>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <PanelTitle index="B" title="Free Cash Flow Forecast" subtitle="bn VND, real" />
              <div style={{ display: "flex", gap: 6 }}>
                <button className={`toggle-btn ${fcfRange === "full" ? "active" : ""}`} onClick={() => setFcfRange("full")}>2024–53</button>
                <button className={`toggle-btn ${fcfRange === "ops" ? "active" : ""}`} onClick={() => setFcfRange("ops")}>2027–53</button>
              </div>
            </div>
            <div style={{ fontFamily: fontSans, fontSize: 12, color: C.inkDim, marginBottom: 4 }}>
              Project (TIPV) vs. Equity (EPV) cash flow
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={fcfData} margin={{ top: 10, right: 12, left: -6, bottom: 0 }}>
                <CartesianGrid stroke={C.lineFaint} vertical={false} />
                <XAxis dataKey="year" tick={{ fill: C.inkFaint, fontFamily: fontMono, fontSize: 10.5 }}
                  axisLine={{ stroke: C.line }} tickLine={false} interval={fcfRange === "full" ? 4 : 3} />
                <YAxis tick={{ fill: C.inkFaint, fontFamily: fontMono, fontSize: 10.5 }}
                  axisLine={false} tickLine={false} tickFormatter={(v) => `${Math.round(v/1000)}k`} width={48} />
                <ReferenceLine y={0} stroke={C.inkFaint} strokeDasharray="3 3" />
                <Tooltip content={<ChartTooltip />} />
                <Line type="monotone" dataKey="FCF — Project (TIPV)" stroke={C.blue} strokeWidth={2} dot={false} connectNulls />
                <Line type="monotone" dataKey="FCF — Equity (EPV)" stroke={C.coral} strokeWidth={2} dot={false} connectNulls />
              </LineChart>
            </ResponsiveContainer>
            <div style={{ display: "flex", gap: 18, marginTop: 6, fontFamily: fontMono, fontSize: 11, color: C.inkDim }}>
              <span><span className="legend-dot" style={{ background: C.blue }} />FCF to Project (TIPV)</span>
              <span><span className="legend-dot" style={{ background: C.coral }} />FCF to Equity (EPV)</span>
            </div>
          </Panel>
        </div>

        {/* CHART GRID ROW 2 */}
        <div style={{ display: "grid", gridTemplateColumns: "0.9fr 1.4fr", gap: 16 }}>

          {/* COST BREAKDOWN PIE */}
          <Panel>
            <PanelTitle index="C" title="Cost Breakdown" subtitle="2035, stabilized year" />
            <div style={{ fontFamily: fontSans, fontSize: 12, color: C.inkDim, marginBottom: 4 }}>
              Total operating cost: {totalCost.toLocaleString("en-US")} bn VND/year
            </div>
            <ResponsiveContainer width="100%" height={230}>
              <PieChart>
                <Pie
                  data={COST_BREAKDOWN} dataKey="value" nameKey="name"
                  cx="50%" cy="50%" innerRadius={56} outerRadius={86}
                  paddingAngle={1.5} stroke={C.panel} strokeWidth={2}
                >
                  {COST_BREAKDOWN.map((entry, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={({ active, payload }) => {
                  if (!active || !payload || !payload.length) return null;
                  const d = payload[0].payload;
                  const pct = ((d.value / totalCost) * 100).toFixed(1);
                  return (
                    <div style={{
                      background: "#0A1018", border: `1px solid ${C.line}`, borderRadius: 3,
                      padding: "10px 14px", fontFamily: fontMono, fontSize: 12, color: C.ink,
                    }}>
                      <div style={{ marginBottom: 4 }}>{d.name}</div>
                      <div style={{ color: C.gold, fontWeight: 600 }}>{d.value.toLocaleString("en-US")} bn VND ({pct}%)</div>
                      <div style={{ color: C.inkFaint, fontSize: 10.5, marginTop: 2 }}>{d.note}</div>
                    </div>
                  );
                }} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: "flex", flexDirection: "column", gap: 5, marginTop: 4 }}>
              {COST_BREAKDOWN.map((d, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", fontFamily: fontMono, fontSize: 11, color: C.inkDim }}>
                  <span><span className="legend-dot" style={{ background: PIE_COLORS[i] }} />{d.name}</span>
                  <span style={{ color: C.ink }}>{((d.value/totalCost)*100).toFixed(0)}%</span>
                </div>
              ))}
            </div>
          </Panel>

          {/* ADSCR TREND */}
          <Panel>
            <PanelTitle index="D" title="Debt Service Coverage Trend" subtitle="ADSCR, 2027–2040" />
            <div style={{ fontFamily: fontSans, fontSize: 12, color: C.inkDim, marginBottom: 4 }}>
              Annual debt service coverage ratio vs. 1.2× lender minimum
            </div>
            <ResponsiveContainer width="100%" height={230}>
              <AreaChart data={adscrData} margin={{ top: 10, right: 12, left: -6, bottom: 0 }}>
                <defs>
                  <linearGradient id="adscrFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={C.teal} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={C.teal} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={C.lineFaint} vertical={false} />
                <XAxis dataKey="year" tick={{ fill: C.inkFaint, fontFamily: fontMono, fontSize: 10.5 }}
                  axisLine={{ stroke: C.line }} tickLine={false} />
                <YAxis domain={[0, 3.6]} tick={{ fill: C.inkFaint, fontFamily: fontMono, fontSize: 10.5 }}
                  axisLine={false} tickLine={false} tickFormatter={(v) => `${v}×`} width={36} />
                <ReferenceLine y={1.2} stroke={C.coral} strokeDasharray="4 4" label={{ value: "1.2× min", position: "insideTopRight", fill: C.coral, fontSize: 10.5, fontFamily: fontMono }} />
                <Tooltip content={(props) => <ChartTooltip {...props} unit="×" />} />
                <Area type="monotone" dataKey="ADSCR" name="ADSCR" stroke={C.teal} strokeWidth={2.5} fill="url(#adscrFill)" dot={{ r: 3, fill: C.teal, strokeWidth: 0 }} />
              </AreaChart>
            </ResponsiveContainer>
            <div style={{ marginTop: 6, fontFamily: fontSans, fontSize: 11.5, color: C.inkFaint, lineHeight: 1.5 }}>
              Coverage troughs at <span style={{ color: C.ink, fontFamily: fontMono }}>1.24×–1.30×</span> in 2031–33, immediately after the 4-year principal grace period ends, then recovers as rents grow and the loan amortizes.
            </div>
          </Panel>
        </div>

        {/* FOOTER */}
        <div style={{
          marginTop: 32, paddingTop: 16, borderTop: `1px solid ${C.line}`,
          display: "flex", justifyContent: "space-between", fontFamily: fontMono, fontSize: 10.5, color: C.inkFaint,
        }}>
          <span>Source: An Gia real-terms DCF workbook · constant 2024 VND</span>
          <span>Confidential — Investment Committee Review</span>
        </div>
      </div>
    </div>
  );
}

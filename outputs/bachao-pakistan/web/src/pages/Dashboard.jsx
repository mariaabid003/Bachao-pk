import { useEffect, useMemo, useState } from 'react';
import {
  getAiIncidentInsights, getAllHotspots, getAllSignals,
  getTrainingStatus, listIncidents, retrainModel,
} from '../utils/api';
import IncidentCard from '../components/IncidentCard';
import StatsBar     from '../components/StatsBar';

const fmtPct  = v => Number.isFinite(Number(v)) ? `${Math.round(Number(v) * 100)}%` : 'Pending';
const fmtNum  = v => Number.isFinite(Number(v)) ? Number(v).toLocaleString('en-PK') : '0';
const fmtMs   = v => { const ms = Number(v); if (!Number.isFinite(ms)||ms<=0) return 'Pending'; return ms>=1000?`${(ms/1000).toFixed(1)}s`:`${Math.round(ms)}ms`; };
const fmtTime = v => { if (!v) return 'Not trained yet'; try { return new Date(v).toLocaleString('en-PK',{dateStyle:'medium',timeStyle:'short'}); } catch { return v; } };

export default function Dashboard() {
  const [hotspots,     setHotspots]     = useState([]);
  const [signals,      setSignals]      = useState([]);
  const [incidents,    setIncidents]    = useState([]);
  const [aiInsights,   setAiInsights]   = useState(null);
  const [aiLoading,    setAiLoading]    = useState(true);
  const [training,     setTraining]     = useState(null);
  const [trainingBusy, setTrainingBusy] = useState(false);
  const [trainingError,setTrainingError]= useState('');
  const [progress,     setProgress]     = useState(0);

  useEffect(() => {
    getAllHotspots().then(r => setHotspots(r.data)).catch(console.warn);
    getAllSignals().then(r  => setSignals(r.data)).catch(console.warn);
    getTrainingStatus().then(r => setTraining(r.data)).catch(console.warn);
    listIncidents()
      .then(r => {
        const data = r.data; setIncidents(data);
        return getAllSignals().then(sr => getAiIncidentInsights({ incidents: data, signals: sr.data }));
      })
      .then(aiResp => setAiInsights(aiResp?.data?.insights || null))
      .catch(console.warn)
      .finally(() => setAiLoading(false));
  }, []);

  useEffect(() => {
    if (!trainingBusy) return;
    setProgress(12);
    const t = window.setInterval(() => setProgress(p => Math.min(p + 8, 88)), 420);
    return () => window.clearInterval(t);
  }, [trainingBusy]);

  const topSignal         = signals.filter(s => s.current_risk_level==='HIGH').sort((a,b) => b.current_risk_score-a.current_risk_score)[0];
  const featureImportances= useMemo(() => (training?.feature_importances || []).slice(0, 8), [training]);
  const profile           = training?.training_profile || {};
  const matrix            = training?.confusion_matrix?.matrix || [[0,0],[0,0]];
  const highRiskRate      = training?.n_samples ? Math.round((Number(training.n_high_risk||0)/Number(training.n_samples))*100) : 0;

  const runTraining = async () => {
    setTrainingBusy(true); setTrainingError('');
    try {
      const result = await retrainModel();
      if (result.data?.status==='error') throw new Error(result.data.message);
      setProgress(100); setTraining(result.data?.metadata || result.data);
    } catch (e) { setTrainingError(e.message||'Training failed'); }
    finally { window.setTimeout(() => setTrainingBusy(false), 350); }
  };

  return (
    <main style={s.page}>
      <section style={s.shell}>
        <div style={s.hero}>
          <div>
            <p style={s.kicker}>Bachao ML Operations</p>
            <h1 style={s.title}>Risk model training console</h1>
            <p style={s.subtitle}>Train the RandomForest risk classifier against Karachi incident history, safe-area negatives, and live journey outcomes.</p>
          </div>
          <div style={s.runPanel}>
            <div style={s.runTop}>
              <div>
                <p style={s.runLabel}>Model state</p>
                <strong style={s.runState}>{trainingBusy ? 'Training in progress' : training?.status || 'Awaiting status'}</strong>
              </div>
              <button type="button" style={{ ...s.button, opacity: trainingBusy ? 0.65 : 1 }} onClick={runTraining} disabled={trainingBusy}>
                {trainingBusy ? 'Training...' : 'Run real training'}
              </button>
            </div>
            <div style={s.progressTrack}>
              <span style={{ ...s.progressFill, width: `${trainingBusy ? progress : training ? 100 : 16}%` }} />
            </div>
            <div style={s.runMeta}>
              <span>Last trained: {fmtTime(training?.trained_at)}</span>
              <span>Duration: {fmtMs(training?.duration_ms)}</span>
            </div>
            {trainingError && <p style={s.error}>{trainingError}</p>}
          </div>
        </div>

        <StatsBar hotspotCount={hotspots.length} signalCount={signals.filter(s => s.current_risk_level==='HIGH').length} incidentCount={incidents.length} topSignal={topSignal?.name} />

        <section style={s.metricsGrid}>
          <MetricCard label="Holdout F1"   value={fmtPct(training?.holdout_f1)}       detail={`Precision ${fmtPct(training?.holdout_precision)}`} tone="#22C55E" />
          <MetricCard label="Accuracy"     value={fmtPct(training?.holdout_accuracy)} detail={`Recall ${fmtPct(training?.holdout_recall)}`}       tone="#0EA5E9" />
          <MetricCard label="Cross-val F1" value={fmtPct(training?.cv_f1_mean)}       detail={`Std dev ${training?.cv_f1_std ?? 'pending'}`}       tone="#F59E0B" />
          <MetricCard label="Samples"      value={fmtNum(training?.n_samples)}         detail={`${highRiskRate}% high-risk labels`}                 tone="#7C3AED" />
        </section>

        <section style={s.gridTwo}>
          <div style={s.panel}>
            <div style={s.panelHeader}>
              <div>
                <p style={s.kicker}>Feature signal</p>
                <h2 style={s.panelTitle}>What the model learned</h2>
              </div>
              <span style={s.pill}>{training?.model_type || 'RandomForestClassifier'}</span>
            </div>
            <div style={{ display: 'grid', gap: 14 }}>
              {featureImportances.map(item => (
                <div key={item.feature} style={{ display: 'grid', gap: 7 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                    <span style={{ color: '#475569', fontSize: 13, textTransform: 'capitalize' }}>{item.feature.replace(/_/g,' ')}</span>
                    <span style={{ color: '#0D1829', fontSize: 13, fontWeight: 800 }}>{fmtPct(item.importance)}</span>
                  </div>
                  <div style={{ height: 9, background: '#EEF1F9', borderRadius: 999, overflow: 'hidden' }}>
                    <span style={{ display: 'block', height: '100%', background: 'linear-gradient(90deg,#0EA5E9,#22C55E)', borderRadius: 999, width: `${Math.max(Number(item.importance||0)*100,3)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={s.panel}>
            <div style={s.panelHeader}>
              <div>
                <p style={s.kicker}>Evaluation</p>
                <h2 style={s.panelTitle}>Confusion matrix</h2>
              </div>
              <span style={s.pill}>{fmtNum(training?.test_samples)} test rows</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12 }}>
              <MatrixCell label="LOW → LOW (correct)"  value={matrix[0]?.[0]} good />
              <MatrixCell label="LOW → HIGH (false alarm)" value={matrix[0]?.[1]} />
              <MatrixCell label="HIGH → LOW (miss)"    value={matrix[1]?.[0]} />
              <MatrixCell label="HIGH → HIGH (correct)" value={matrix[1]?.[1]} good />
            </div>
          </div>
        </section>

        <section style={s.gridTwo}>
          <div style={s.panel}>
            <div style={s.panelHeader}>
              <div>
                <p style={s.kicker}>Training data</p>
                <h2 style={s.panelTitle}>Source ledger</h2>
              </div>
              <span style={s.pill}>{fmtNum(profile.feature_count)} features</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12 }}>
              {[
                { label: 'Historical incidents',  value: profile.historical_incident_rows },
                { label: 'Safe-area examples',    value: profile.generated_safe_examples  },
                { label: 'Live journey outcomes', value: profile.live_journey_outcomes     },
                { label: 'Crime area rows',       value: profile.crime_area_rows           },
              ].map((src, i) => (
                <div key={i} style={{ background: '#EEF1F9', borderRadius: 12, padding: 16, border: '1px solid rgba(15,23,42,0.08)' }}>
                  <strong style={{ display: 'block', color: '#0D1829', fontSize: 28 }}>{fmtNum(src.value)}</strong>
                  <span style={{ display: 'block', color: '#94A3B8', fontSize: 12, marginTop: 6 }}>{src.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={s.panel}>
            <div style={s.panelHeader}>
              <div>
                <p style={s.kicker}>Weekly safety brief</p>
                <h2 style={s.panelTitle}>Incident intelligence</h2>
              </div>
              <span style={s.pill}>AI assisted</span>
            </div>
            <p style={{ color: '#475569', fontSize: 15, lineHeight: 1.75, margin: 0 }}>
              {aiLoading ? 'Analysing this week\'s data...' : aiInsights}
            </p>
          </div>
        </section>

        <section style={s.panel}>
          <div style={s.panelHeader}>
            <div>
              <p style={s.kicker}>Field reports</p>
              <h2 style={s.panelTitle}>Recent incidents</h2>
            </div>
            <span style={s.pill}>{fmtNum(incidents.length)} total</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 12 }}>
            {incidents.slice(0, 20).map((inc, i) => (
              <IncidentCard key={`${inc.incident_id||inc.type||'inc'}-${i}`} incident={inc} />
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}

function MetricCard({ label, value, detail, tone }) {
  return (
    <div style={{ position: 'relative', overflow: 'hidden', background: '#FFFFFF',
                  border: '1px solid rgba(15,23,42,0.08)', borderRadius: 12, padding: 20, minHeight: 126 }}>
      <span style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: tone }} />
      <p style={{ color: '#94A3B8', fontSize: 13, fontWeight: 800, margin: 0 }}>{label}</p>
      <strong style={{ display: 'block', color: '#0D1829', fontSize: 34, marginTop: 12 }}>{value}</strong>
      <span style={{ display: 'block', color: '#94A3B8', fontSize: 12, marginTop: 8 }}>{detail}</span>
    </div>
  );
}

function MatrixCell({ label, value, good }) {
  return (
    <div style={{ minHeight: 112, background: '#EEF1F9', border: `1px solid ${good ? 'rgba(34,197,94,0.4)' : 'rgba(239,68,68,0.2)'}`,
                  borderRadius: 10, padding: 16, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <strong style={{ fontSize: 34, lineHeight: 1, color: good ? '#22C55E' : '#F59E0B' }}>{value ?? '—'}</strong>
      <span style={{ color: '#475569', fontSize: 12, lineHeight: 1.4 }}>{label}</span>
    </div>
  );
}

const s = {
  page:       { minHeight: '100vh', background: '#F5F7FF', color: '#0D1829',
                fontFamily: 'Inter,ui-sans-serif,system-ui,-apple-system,sans-serif' },
  shell:      { width: 'min(1400px,calc(100% - 32px))', margin: '0 auto', padding: '32px 0 56px' },
  hero:       { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(320px,100%),1fr))',
                gap: 24, alignItems: 'stretch', marginBottom: 24 },
  kicker:     { color: '#0EA5E9', fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5, margin: '0 0 8px' },
  title:      { color: '#0D1829', fontSize: 40, lineHeight: 1.1, margin: 0 },
  subtitle:   { color: '#475569', fontSize: 16, lineHeight: 1.7, margin: '16px 0 0' },
  runPanel:   { background: '#FFFFFF', border: '1px solid rgba(14,165,233,0.25)', borderRadius: 12,
                padding: 20, boxShadow: '0 4px 24px rgba(13,24,41,0.07)' },
  runTop:     { display: 'flex', gap: 16, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' },
  runLabel:   { margin: 0, color: '#94A3B8', fontSize: 12, textTransform: 'uppercase', fontWeight: 800 },
  runState:   { display: 'block', color: '#0D1829', fontSize: 20, marginTop: 5 },
  button:     { minHeight: 44, border: 0, borderRadius: 8, background: '#0EA5E9', color: '#fff',
                fontWeight: 700, padding: '0 20px', cursor: 'pointer', whiteSpace: 'nowrap', fontSize: 14 },
  progressTrack:{ height: 8, background: '#EEF1F9', borderRadius: 999, overflow: 'hidden', marginTop: 22 },
  progressFill: { display: 'block', height: '100%', background: 'linear-gradient(90deg,#0EA5E9,#22C55E)', transition: 'width 220ms ease' },
  runMeta:    { display: 'flex', justifyContent: 'space-between', gap: 12, color: '#94A3B8', fontSize: 12, marginTop: 12, flexWrap: 'wrap' },
  error:      { color: '#EF4444', background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 8, padding: 10, margin: '14px 0 0' },
  metricsGrid:{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 14, margin: '20px 0 18px' },
  gridTwo:    { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(360px,100%),1fr))', gap: 18, marginBottom: 18 },
  panel:      { background: '#FFFFFF', border: '1px solid rgba(15,23,42,0.08)', borderRadius: 12, padding: 20 },
  panelHeader:{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 18, marginBottom: 18 },
  panelTitle: { margin: 0, color: '#0D1829', fontSize: 20, fontWeight: 700 },
  pill:       { color: '#0369A1', background: 'rgba(14,165,233,0.1)', border: '1px solid rgba(14,165,233,0.25)',
                borderRadius: 999, padding: '6px 12px', fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap' },
};

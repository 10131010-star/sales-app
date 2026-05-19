import type { KpiSummary, VisitLog } from '@/data/types';

export function aggregateVisits(visits: VisitLog[]): KpiSummary {
  const frontOk = visits.filter((x) => x.frontOk).length;
  const metManager = visits.filter((x) => x.metManager).length;
  const fullTalk = visits.filter((x) => x.fullTalk).length;
  const prospect = visits.filter((x) => x.prospect).length;
  const appointment = visits.filter((x) => x.appointment).length;
  const verbalOk = visits.filter((x) => x.verbalOk).length;
  const won = visits.filter((x) => x.won).length;
  const ftr = won;

  return {
    visits: visits.length,
    frontOk,
    metManager,
    fullTalk,
    prospect,
    appointment,
    verbalOk,
    won,
    ftr,
    frontOkRate: visits.length ? frontOk / visits.length : 0,
    metManagerRate: visits.length ? metManager / visits.length : 0,
    fullTalkRate: visits.length ? fullTalk / visits.length : 0,
    prospectRate: visits.length ? prospect / visits.length : 0,
    appointmentRate: visits.length ? appointment / visits.length : 0,
    verbalOkRate: visits.length ? verbalOk / visits.length : 0,
    wonRate: visits.length ? won / visits.length : 0,
    ftrRate: fullTalk ? ftr / fullTalk : 0,
  };
}

export function formatRate(rate: number): string {
  return `${Math.round(rate * 100)}%`;
}

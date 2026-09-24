// Progress lives in localStorage; the game still runs (without saving) if storage is blocked.
// Each mission keeps its own Moonwells, fallen bosses and taken items; stats and Glimmer are shared.
const KEY = 'pixielords-save-v1';
const SKEY = 'pixielords-settings-v1';

export const levelCost = lvl => Math.round(160 + 70 * (lvl - 1) + 9 * (lvl - 1) ** 2);

export const freshMission = () => ({ shrine: null, kindled: [], dead: [], items: [], cleared: false });

export function freshSave(ng = 0) {
  return {
    v: 2, stats: { vit: 1, end: 1, str: 1, spi: 1 }, glimmer: 0, elixirMax: 4, deaths: 0, time: 0, ng,
    mission: 'keep', unlocked: ['keep'], missions: {}, grave: null, charms: [], equipped: [],
  };
}

// Version 1 had a single level and called the currency by another name.
function migrate(d) {
  if (d.v === 1) {
    if (d.glimmer == null && d.amrita != null) { d.glimmer = d.amrita; delete d.amrita; }
    const cleared = (d.dead || []).includes('boss');
    d.missions = { keep: { shrine: d.shrine || 'grove', kindled: d.kindled || ['grove'], dead: d.dead || [], items: (d.items || []).map(i => i.replace('amrita', 'glimmer')), cleared } };
    if (d.grave) d.grave.mission = 'keep';
    d.mission = 'keep'; d.unlocked = cleared ? ['keep', 'rotwood'] : ['keep'];
    d.charms = []; d.equipped = [];
    for (const k of ['shrine', 'kindled', 'dead', 'items', 'seenMessages']) delete d[k];
    d.v = 2;
  }
  return d.v === 2 ? d : null;
}

export class Save {
  constructor() {
    this.data = null;
    try { this.data = JSON.parse(localStorage.getItem(KEY)); } catch { this.data = null; }
    if (this.data) this.data = migrate(this.data);
    this.exists = !!this.data;
    if (!this.data) this.data = freshSave();
  }
  get level() { const s = this.data.stats; return s.vit + s.end + s.str + s.spi - 3; }
  get stats() { return this.data.stats; }
  get glimmer() { return this.data.glimmer; }
  set glimmer(v) { this.data.glimmer = Math.max(0, Math.round(v)); }
  get elixirMax() { return this.data.elixirMax; }
  get deaths() { return this.data.deaths; }
  get time() { return this.data.time; }
  get ng() { return this.data.ng; }
  // The current mission's state.
  get m() { return this.mission(this.data.mission); }
  mission(id) { return (this.data.missions[id] ||= freshMission()); }
  summary(levels) {
    const d = this.data, m = Math.floor(d.time / 60);
    return `${levels?.[d.mission]?.name || ''} · Level ${this.level} · ${m} min${d.ng ? ` · NG+${d.ng}` : ''}`;
  }
  reset(ng = 0) { this.data = freshSave(ng); }
  write() {
    try { localStorage.setItem(KEY, JSON.stringify(this.data)); this.exists = true; } catch { /* storage unavailable */ }
  }
}

export function loadSettings() {
  const def = { sens: 1, invertY: false, master: .8, music: .55, sfx: .9, shake: 1, quality: 1 };
  try { return { ...def, ...JSON.parse(localStorage.getItem(SKEY) || '{}') }; } catch { return def; }
}
export function saveSettings(s) { try { localStorage.setItem(SKEY, JSON.stringify(s)); } catch { /* ignore */ } }

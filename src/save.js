// Progress lives in localStorage; the game still runs (without saving) if storage is blocked.
const KEY = 'pixielords-save-v1';
const SKEY = 'pixielords-settings-v1';

export const levelCost = lvl => Math.round(160 + 70 * (lvl - 1) + 9 * (lvl - 1) ** 2);

export function freshSave(ng = 0) {
  return {
    v: 1, stats: { vit: 1, end: 1, str: 1, spi: 1 }, glimmer: 0, elixirMax: 4, shrine: 'grove', kindled: ['grove'],
    dead: [], items: [], grave: null, deaths: 0, time: 0, ng, seenMessages: [],
  };
}

export class Save {
  constructor() {
    this.data = null;
    try { this.data = JSON.parse(localStorage.getItem(KEY)); } catch { this.data = null; }
    if (this.data && this.data.v !== 1) this.data = null;
    // Older saves called the currency by another name.
    if (this.data && this.data.glimmer == null && this.data.amrita != null) {
      this.data.glimmer = this.data.amrita; delete this.data.amrita;
      this.data.items = (this.data.items || []).map(i => i.replace('amrita', 'glimmer'));
    }
    this.exists = !!this.data;
    if (!this.data) this.data = freshSave();
  }
  get level() { const s = this.data.stats; return s.vit + s.end + s.str + s.spi - 3; }
  get stats() { return this.data.stats; }
  get glimmer() { return this.data.glimmer; }
  set glimmer(v) { this.data.glimmer = Math.max(0, Math.round(v)); }
  get elixirMax() { return this.data.elixirMax; }
  get kindled() { return this.data.kindled; }
  get deaths() { return this.data.deaths; }
  get time() { return this.data.time; }
  get ng() { return this.data.ng; }
  summary() {
    const d = this.data, m = Math.floor(d.time / 60);
    return `Level ${this.level} · ${m} min${d.ng ? ` · NG+${d.ng}` : ''}`;
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

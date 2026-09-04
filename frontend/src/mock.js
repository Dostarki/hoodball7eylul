// Tum veriler simdilik frontend'de (mock) tutulur ve tarayici localStorage'a kaydedilir.

export const BASE_ROWS = [
  '....####....',
  '..##....##..',
  '.#........#.',
  '.#........#.',
  '#..##..##..#',
  '#..##..##..#',
  '#..........#',
  '.#........#.',
  '.#..####..#.',
  '..#......#..',
  '...######...',
  '............',
];

const withTop = (topRows, fromRow = 0) => [...topRows, ...BASE_ROWS.slice(fromRow)];

export const CHARACTERS = [
  {
    id: 'arc',
    name: 'ARC',
    title: 'Antenli Kaptan',
    desc: 'Dengeli oyuncu. Kafa vurusu net, zıplaması guvenilir.',
    stats: { hiz: 7, ziplama: 8, vurus: 7 },
    bitmap: withTop(['.....#......', '.....#......']),
  },
  {
    id: 'mohawk',
    name: 'MOHAWK',
    title: 'Punk Forvet',
    desc: 'Agresif, one cikar. Sut gucu yuksek.',
    stats: { hiz: 8, ziplama: 6, vurus: 9 },
    bitmap: withTop(['.....##.....', '.....##.....', '....####....', '..########..'], 2),
  },
  {
    id: 'cap',
    name: 'SAPKA',
    title: 'Sokak Ustasi',
    desc: 'Vizor arkasinda soguk kanli. Kontrolu seven oyuncu.',
    stats: { hiz: 7, ziplama: 7, vurus: 8 },
    bitmap: withTop(['............', '...######...', '..########..', '.###########'], 2),
  },
  {
    id: 'afro',
    name: 'AFRO',
    title: 'Ritim Ustasi',
    desc: 'Buyuk kafa, buyuk alan. Hava toplarinda kral.',
    stats: { hiz: 6, ziplama: 9, vurus: 7 },
    bitmap: withTop(
      ['..########..', '.##########.', '############', '############', '##........##', '.#........#.'],
      4
    ),
  },
  {
    id: 'halo',
    name: 'HALE',
    title: 'Melek Kanat',
    desc: 'Hafif ve hizli. Yerde herkesi geride birakir.',
    stats: { hiz: 9, ziplama: 8, vurus: 6 },
    bitmap: withTop(['..########..', '............']),
  },
  {
    id: 'spiky',
    name: 'DIKEN',
    title: 'Elektrik Sac',
    desc: 'Enerjik ve tahmin edilemez. Surprizlere hazir ol.',
    stats: { hiz: 8, ziplama: 8, vurus: 7 },
    bitmap: withTop(['.#..#..#..#.', '.##.####.##.', '..########..', '.##########.'], 2),
  },
  {
    id: 'glasses',
    name: 'GOZLUK',
    title: 'Analist',
    desc: 'Her topu hesaplar. Pozisyon almada usta.',
    stats: { hiz: 7, ziplama: 7, vurus: 7 },
    bitmap: [
      '............',
      '............',
      '....####....',
      '..##....##..',
      '.#........#.',
      '.#........#.',
      '#.###..###.#',
      '#.#.####.#.#',
      '#.###..###.#',
      '.#........#.',
      '.#..####..#.',
      '..#......#..',
      '...######...',
      '............',
    ],
  },
  {
    id: 'crown',
    name: 'KRAL',
    title: 'Tac Sahibi',
    desc: 'Ligin efsanesi. Guclu vurus, agir ama etkili.',
    stats: { hiz: 6, ziplama: 7, vurus: 9 },
    bitmap: withTop(['#..#.##.#..#', '#..#.##.#..#', '############', '############'], 2),
  },
];

export const BALL_BITMAP = [
  '..####..',
  '.#....#.',
  '#..##..#',
  '#.##...#',
  '#...##.#',
  '#..##..#',
  '.#....#.',
  '..####..',
];

export const TROPHY_BITMAP = [
  '############',
  '#.########.#',
  '#.########.#',
  '#.########.#',
  '.#.######.#.',
  '..########..',
  '...######...',
  '....####....',
  '.....##.....',
  '.....##.....',
  '....####....',
  '...######...',
  '..########..',
  '............',
];

export const PLAYER_TEAM = { id: 'you', name: 'ARC FC', short: 'ARC', isPlayer: true };

export const BOT_TEAMS = [
  { id: 'ink', name: 'INK UNITED', short: 'INK', charId: 'mohawk', style: 'Baski yapan, agresif' },
  { id: 'paper', name: 'PAPER CITY', short: 'PPR', charId: 'cap', style: 'Sabirli, pozisyon oyunu' },
  { id: 'bit', name: 'BIT ROVERS', short: 'BIT', charId: 'spiky', style: 'Hizli kontra' },
  { id: 'pixel', name: 'PIKSEL SPOR', short: 'PXL', charId: 'glasses', style: 'Hesapli, hatasiz' },
  { id: 'circle', name: 'DAIRE SK', short: 'DSK', charId: 'crown', style: 'Guclu, acimasiz' },
];

export const ALL_TEAMS = [PLAYER_TEAM, ...BOT_TEAMS];

export const ARENAS = {
  paper: {
    id: 'paper',
    name: 'KAGIT ARENA',
    desc: 'Murekkep uzerine kagit. Klasik gunduz sahasi.',
    bg: '#efede4',
    ink: '#1c1c22',
  },
  inverted: {
    id: 'inverted',
    name: 'MUREKKEP ARENA',
    desc: 'Kagit uzerine murekkep. Ters cevrilmis gece sahasi.',
    bg: '#1c1c22',
    ink: '#efede4',
  },
};

// 6 takimli tek devreli fikstur (indisler ALL_TEAMS'e gore, 0 = oyuncu)
export const ROUNDS = [
  [[0, 5], [1, 4], [2, 3]],
  [[0, 4], [5, 3], [1, 2]],
  [[0, 3], [4, 2], [5, 1]],
  [[0, 2], [3, 1], [4, 5]],
  [[0, 1], [2, 5], [3, 4]],
];

export const MATCH_SECONDS = 60;

export const CONTROLS = [
  { action: 'Sola / Saga hareket', keys: ['←', '→'], alt: ['A', 'D'], mobile: 'Sol / Sag butonlari' },
  { action: 'Zipla', keys: ['↑'], alt: ['W', 'SPACE'], mobile: 'Zipla butonu' },
  { action: 'Vurus (Sut)', keys: ['X'], alt: ['K', '↓'], mobile: 'Vur butonu' },
  { action: 'Duraklat', keys: ['P'], alt: ['ESC'], mobile: 'Duraklat ikonu' },
];

export const FEATURES = [
  {
    title: '1-Bit Saha',
    text: 'Iki renk, sifir gurultu. Her piksel murekkeple cizildi; kalabalik, kale ve top ayni 1-bit dilde konusur.',
  },
  {
    title: 'Cok Zor Bot',
    text: 'Rakip, topun dusus noktasini onceden hesaplar, kaleyi kapatir ve bosluk buldugunda sutu ceker. Kazanmak icin oyun okuman gerekir.',
  },
  {
    title: '60 Saniyelik Maclar',
    text: 'Her mac tam bir dakika. Hizli kararlar, kisa maclar, uzun lig. Beraberlik puan getirir; galibiyet uc puan.',
  },
];

// ---------- localStorage yardimcilari ----------
const KEYS = {
  char: 'futbot.char',
  league: 'futbot.league',
  sound: 'futbot.sound',
  history: 'futbot.history',
};

const read = (k, fallback) => {
  try {
    const v = localStorage.getItem(k);
    return v ? JSON.parse(v) : fallback;
  } catch {
    return fallback;
  }
};
const write = (k, v) => {
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch {
    /* ignore */
  }
};

export const getSelectedCharId = () => read(KEYS.char, 'arc');
export const setSelectedCharId = (id) => write(KEYS.char, id);
export const getCharacter = (id) => CHARACTERS.find((c) => c.id === id) || CHARACTERS[0];

export const getSoundEnabled = () => read(KEYS.sound, true);
export const setSoundEnabled = (v) => write(KEYS.sound, v);

export const getHistory = () => read(KEYS.history, []);
export const pushHistory = (entry) => {
  const h = [entry, ...getHistory()].slice(0, 20);
  write(KEYS.history, h);
  return h;
};

// ---------- Lig mantigi ----------
export const newLeague = () => ({ round: 0, results: [] });
export const getLeague = () => read(KEYS.league, newLeague());
export const saveLeague = (l) => write(KEYS.league, l);
export const resetLeague = () => {
  const l = newLeague();
  saveLeague(l);
  return l;
};

export const arenaForRound = (round) => (round % 2 === 0 ? 'paper' : 'inverted');

export const nextFixture = (league) => {
  if (league.round >= ROUNDS.length) return null;
  const [home, away] = ROUNDS[league.round][0];
  return {
    round: league.round,
    home: ALL_TEAMS[home],
    away: ALL_TEAMS[away],
    arena: arenaForRound(league.round),
  };
};

const randGoals = () => {
  const r = Math.random();
  if (r < 0.25) return 0;
  if (r < 0.55) return 1;
  if (r < 0.8) return 2;
  if (r < 0.92) return 3;
  return 4;
};

export const recordPlayerResult = (league, playerGoals, botGoals) => {
  if (league.round >= ROUNDS.length) return league;
  const pairs = ROUNDS[league.round];
  const roundResults = pairs.map(([h, a], i) => ({
    home: h,
    away: a,
    hs: i === 0 ? playerGoals : randGoals(),
    as: i === 0 ? botGoals : randGoals(),
    arena: arenaForRound(league.round),
  }));
  const next = { round: league.round + 1, results: [...league.results, roundResults] };
  saveLeague(next);
  return next;
};

export const computeStandings = (league) => {
  const rows = ALL_TEAMS.map((t, i) => ({
    idx: i,
    team: t,
    o: 0,
    g: 0,
    b: 0,
    m: 0,
    a: 0,
    y: 0,
    p: 0,
  }));
  league.results.flat().forEach((r) => {
    const H = rows[r.home];
    const A = rows[r.away];
    H.o++;
    A.o++;
    H.a += r.hs;
    H.y += r.as;
    A.a += r.as;
    A.y += r.hs;
    if (r.hs > r.as) {
      H.g++;
      A.m++;
      H.p += 3;
    } else if (r.hs < r.as) {
      A.g++;
      H.m++;
      A.p += 3;
    } else {
      H.b++;
      A.b++;
      H.p++;
      A.p++;
    }
  });
  return rows
    .map((r) => ({ ...r, av: r.a - r.y }))
    .sort((x, y) => y.p - x.p || y.av - x.av || y.a - x.a || x.team.name.localeCompare(y.team.name));
};

export const leagueFinished = (league) => league.round >= ROUNDS.length;

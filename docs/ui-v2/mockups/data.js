// Mockup data copied from index.html (read-only reference; the mockups do not touch the game).
const ASSET = '../../../';
const SPR = { bug: 'public/assets/characters/bug', mecha: 'assets/characters/engineering/mecha_freshy', lab: 'assets/characters/science/lab_maniac', night: 'assets/characters/medicine/night_shifter', chem: 'assets/characters/pharmacy/chemist_pro', animal: 'assets/characters/veterinary/animal_keeper', dental: 'assets/characters/dentistry/dental_blitz', music: 'assets/characters/music/sound_wave', runner: 'assets/characters/sports/ace_runner', global: 'assets/characters/muic/global_exchange', public: 'assets/characters/public_health/health_guardian', nurse: 'assets/characters/nursing/angel_of_care' };
const HEROES = [
  { id: 'bug', name: 'Bug Hunter', f: 'ICT', star: 1, cost: 80, type: 'ระยะไกล', skill: 'Infinite Loop', desc: 'ยิงเป้าหมายเดิมต่อเนื่อง ยิ่งยิงยิ่งเร็ว', hp: 360, atk: 39, range: 160 },
  { id: 'mecha', name: 'Mecha Freshy', f: 'EG', star: 2, cost: 120, type: 'แทงก์', skill: 'Emergency Barrier', desc: 'รับดาเมจครั้งแรกได้ลดลงมาก', hp: 1250, atk: 38, range: 38 },
  { id: 'lab', name: 'Lab Maniac', f: 'SC', star: 3, cost: 180, type: 'โจมตีวงกว้าง', skill: 'Chain Reaction', desc: 'โจมตีเป้าหมายหลักและกระจายดาเมจ', hp: 640, atk: 85, range: 145 },
  { id: 'night', name: 'Night Shifter', f: 'SI', star: 3, cost: 180, type: 'ฮีล', skill: 'Emergency Care', desc: 'รักษาเพื่อนที่บาดเจ็บหนักที่สุด', hp: 740, atk: 25, range: 160 },
  { id: 'chem', name: 'Chemist Pro', f: 'PY', star: 3, cost: 220, type: 'พิษ', skill: 'Toxic Formula', desc: 'ทำให้ศัตรูติดพิษต่อเนื่อง', hp: 760, atk: 68, range: 150 },
  { id: 'animal', name: 'Animal Keeper', f: 'VS', star: 3, cost: 220, type: 'อัญเชิญ', skill: 'Animal Assist', desc: 'เรียกสุนัขช่วยสู้เป็นระยะ', hp: 900, atk: 52, range: 110 },
  { id: 'dental', name: 'Dental Blitz', f: 'DT', star: 4, cost: 240, type: 'เจาะเกราะ', skill: 'Tooth Breaker', desc: 'เจาะเกราะศัตรูด้วยการโจมตีหนัก', hp: 1200, atk: 118, range: 45 },
  { id: 'music', name: 'Sound Wave', f: 'MS', star: 4, cost: 240, type: 'หน่วง', skill: 'Sonic Stage', desc: 'ปล่อยคลื่นเสียงชะลอศัตรูเป็นกลุ่ม', hp: 950, atk: 48, range: 155 },
  { id: 'runner', name: 'Ace Runner', f: 'SS', star: 4, cost: 300, type: 'พุ่งชน', skill: 'Overdrive', desc: 'พุ่งเข้าหาศัตรูพร้อมดาเมจเปิดตัว', hp: 1400, atk: 135, range: 43 },
  { id: 'global', name: 'Global Exchange', f: 'IC', star: 4, cost: 320, type: 'เพิ่ม AT', skill: 'Global Link', desc: 'ฟื้น AT ให้ทีมทันทีเมื่อ Deploy', hp: 1120, atk: 58, range: 155 },
  { id: 'public', name: 'Health Guardian', f: 'PH', star: 5, cost: 340, type: 'โล่', skill: 'Barrier Zone', desc: 'สร้างโล่ลดความเสียหายให้พันธมิตรใกล้เคียง', hp: 2350, atk: 85, range: 55 },
  { id: 'nurse', name: 'Angel of Care', f: 'NS', star: 5, cost: 360, type: 'ฮีลหมู่', skill: 'Blessing of Life', desc: 'รักษาเพื่อนหลายตัวพร้อมกัน', hp: 1550, atk: 35, range: 185 },
];
const FAC = { SI: '#5bd6a2', RA: '#59ccaa', DT: '#73ddff', PY: '#ec85bc', NS: '#ffa3be', SC: '#bb83ff', PH: '#5acbb9', MT: '#89b4ff', PT: '#87c4aa', TM: '#b5d56d', EG: '#ffae44', EN: '#8bd98b', VS: '#8de7ac', ICT: '#39c5ff', LA: '#ffbc88', SH: '#dda5ff', IC: '#69aaff', MS: '#ed7aff', SS: '#ffae68' };
function por(h, size) {
  const s = size || 64;
  return `<div class="por" style="width:${s}px;height:${s}px;background-image:url(${ASSET}${SPR[h.id]}/idle.png);background-size:400% 100%"></div>`;
}
function stars(n) { return '<span class="stars">' + '★'.repeat(n) + '<b>' + '★'.repeat(5 - n) + '</b></span>'; }
function card(h, o) {
  o = o || {};
  return `<div class="card r${h.star} ${o.sel ? 'sel' : ''} ${o.dim ? 'dim' : ''}" style="--fc:${FAC[h.f]}">${o.sel ? '<span class="tick">✓</span>' : ''}${por(h)}<div class="nm">${h.name}</div>${stars(h.star)}<div class="cost">${h.cost} AT</div></div>`;
}

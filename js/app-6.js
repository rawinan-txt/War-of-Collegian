
const faculties=[['SI', 'แพทยศาสตร์ศิริราชพยาบาล', '🩺', '#5bd6a2', 'Pulse Strike'], ['RA', 'แพทยศาสตร์โรงพยาบาลรามาธิบดี', '🏥', '#59ccaa', 'Care Wave'], ['DT', 'ทันตแพทยศาสตร์', '🦷', '#73ddff', 'Toothfall'], ['PY', 'เภสัชศาสตร์', '💊', '#ec85bc', 'Potion Burst'], ['NS', 'พยาบาลศาสตร์', '👩\u200d⚕️', '#ffa3be', 'Nursing Pulse'], ['SC', 'วิทยาศาสตร์', '🧪', '#bb83ff', 'Chemical Burst'], ['PH', 'สาธารณสุขศาสตร์', '🛡️', '#5acbb9', 'Guardian Wave'], ['MT', 'เทคนิคการแพทย์', '🔬', '#89b4ff', 'Scan Burst'], ['PT', 'กายภาพบำบัด', '🦿', '#87c4aa', 'Motion Wave'], ['TM', 'เวชศาสตร์เขตร้อน', '🦠', '#b5d56d', 'Bio Storm'], ['EG', 'วิศวกรรมศาสตร์', '⚙️', '#ffae44', 'Missile Strike'], ['EN', 'สิ่งแวดล้อมและทรัพยากรศาสตร์', '🌱', '#8bd98b', 'Nature Surge'], ['VS', 'สัตวแพทยศาสตร์', '🐾', '#8de7ac', 'Animal Stampede'], ['ICT', 'เทคโนโลยีสารสนเทศและการสื่อสาร', '💻', '#39c5ff', 'Digital Beam', {
    buildingName:'ICT Building (MUICT)', sprite:'assets/bases/ict.png', referenceUrl:'https://www.ict.mahidol.ac.th/en/contact-us/', displayScale:2, groundOffset:0
}], ['LA', 'ศิลปศาสตร์', '📖', '#ffbc88', 'Word Storm'], ['SH', 'สังคมศาสตร์และมนุษยศาสตร์', '🗣️', '#dda5ff', 'Voice Wave'], ['IC', 'วิทยาลัยนานาชาติ', '🌐', '#69aaff', 'Global Burst'], ['MS', 'วิทยาลัยดุริยางคศิลป์', '🎵', '#ed7aff', 'Sonic Wave'], ['SS', 'วิทยาลัยวิทยาศาสตร์และเทคโนโลยีการกีฬา', '🏃', '#ffae68', 'Sport Rush'], ['CRS', 'วิทยาลัยศาสนศึกษา', '🕊️', '#d2c7ff', 'Harmony Wave']];
const SELECTABLE_FACULTY_IDS=new Set(['SI', 'RA', 'DT', 'PY', 'NS', 'SC', 'PH', 'MT', 'PT', 'TM', 'EG', 'EN', 'VS', 'ICT', 'LA', 'SH', 'IC', 'MS', 'SS']);
const heroes=[ {
    id:'bug', name:'Bug Hunter', f:'ICT', star:1, cost:80, cd:3.8, hp:360, atk:39, range:160, spd:52, interval:.85, emoji:'💻', skill:'Infinite Loop', desc:'ยิงเป้าหมายเดิมต่อเนื่อง ยิ่งยิงยิ่งเร็ว', type:'ranged'
}, {
    id:'mecha', name:'Mecha Freshy', f:'EG', star:2, cost:120, cd:6, hp:1250, atk:38, range:38, spd:32, interval:1.3, emoji:'⚙️', skill:'Emergency Barrier', desc:'รับดาเมจครั้งแรกได้ลดลงมาก', type:'tank'
}, {
    id:'lab', name:'Lab Maniac', f:'SC', star:3, cost:180, cd:8, hp:640, atk:85, range:145, spd:37, interval:1.7, emoji:'🧪', skill:'Chain Reaction', desc:'โจมตีเป้าหมายหลักและกระจายดาเมจ', type:'aoe'
}, {
    id:'night', name:'Night Shifter', f:'SI', star:3, cost:180, cd:9, hp:740, atk:25, range:160, spd:40, interval:1.7, emoji:'🩺', skill:'Emergency Care', desc:'รักษาเพื่อนที่บาดเจ็บหนักที่สุด', type:'heal'
}, {
    id:'chem', name:'Chemist Pro', f:'PY', star:3, cost:220, cd:10, hp:760, atk:68, range:150, spd:37, interval:1.4, emoji:'💊', skill:'Toxic Formula', desc:'ทำให้ศัตรูติดพิษต่อเนื่อง', type:'poison'
}, {
    id:'animal', name:'Animal Keeper', f:'VS', star:3, cost:220, cd:11, hp:900, atk:52, range:110, spd:39, interval:1.6, emoji:'🐕', skill:'Animal Assist', desc:'เรียกสุนัขช่วยสู้เป็นระยะ', type:'summon'
}, {
    id:'dental', name:'Dental Blitz', f:'DT', star:4, cost:240, cd:11, hp:1200, atk:118, range:45, spd:54, interval:1.1, emoji:'🦷', skill:'Tooth Breaker', desc:'เจาะเกราะศัตรูด้วยการโจมตีหนัก', type:'pierce'
}, {
    id:'music', name:'Sound Wave', f:'MS', star:4, cost:240, cd:12, hp:950, atk:48, range:155, spd:40, interval:1.4, emoji:'🎸', skill:'Sonic Stage', desc:'ปล่อยคลื่นเสียงชะลอศัตรูเป็นกลุ่ม', type:'slow'
}, {
    id:'runner', name:'Ace Runner', f:'SS', star:4, cost:300, cd:13, hp:1400, atk:135, range:43, spd:91, interval:1.05, emoji:'🏃', skill:'Overdrive', desc:'พุ่งเข้าหาศัตรูพร้อมดาเมจเปิดตัว', type:'dash'
}, {
    id:'global', name:'Global Exchange', f:'IC', star:4, cost:320, cd:14, hp:1120, atk:58, range:155, spd:43, interval:1.4, emoji:'🌐', skill:'Global Link', desc:'ฟื้น AT ให้ทีมทันทีเมื่อ Deploy', type:'income'
}, {
    id:'public', name:'Health Guardian', f:'PH', star:5, cost:340, cd:15, hp:2350, atk:85, range:55, spd:30, interval:1.5, emoji:'🛡️', skill:'Barrier Zone', desc:'สร้างโล่ลดความเสียหายให้พันธมิตรใกล้เคียง', type:'shield'
}, {
    id:'nurse', name:'Angel of Care', f:'NS', star:5, cost:360, cd:16, hp:1550, atk:35, range:185, spd:38, interval:1.35, emoji:'👩‍⚕️', skill:'Blessing of Life', desc:'รักษาเพื่อนหลายตัวพร้อมกัน', type:'massheal'
}];
const HEALTH_GROUP=['SI', 'RA', 'DT', 'PY', 'NS', 'MT', 'PT', 'TM', 'PH'], CAMPUS_GROUP=['MS', 'SS', 'IC', 'SH', 'LA', 'CMMU'];
const SYNERGIES=[ {
    id:'tech_alliance', name:'💻⚙️ Tech Alliance', desc:'ICT + วิศวะ: ดาเมจ +10% (เฉพาะสองตัวนี้)', active:fs=>fs.includes('ICT')&&fs.includes('EG'), fx:{
        dmgMul:1.1, dmgFaculties:['ICT', 'EG']
    }
}, {
    id:'healthcare', name:'🏥 Healthcare Network', desc:'สายสุขภาพ 3 ตัวขึ้นไป: ฮีล +12%', active:fs=>fs.filter(f=>HEALTH_GROUP.includes(f)).length>=3, fx:{
        healMul:1.12
    }
}, {
    id:'campus_life', name:'🎒 Campus Life', desc:'กิจกรรม/ดนตรี/กีฬา/สังคม 2 ตัวขึ้นไป: Cooldown -8%', active:fs=>fs.filter(f=>CAMPUS_GROUP.includes(f)).length>=2, fx:{
        cdMul:.92
    }
}];
function calcSynergies(ids){
    const fs=ids.map(id=>heroes.find(h=>h.id===id).f);
    return SYNERGIES.filter(s=>s.active(fs))
}
function synergyFx(ids){
    const list=calcSynergies(ids);
    let cdMul=1, healMul=1;
    const dmg={
    };
    for(const s of list){
        if(s.fx.cdMul)cdMul*=s.fx.cdMul;
        if(s.fx.healMul)healMul*=s.fx.healMul;
        if(s.fx.dmgMul)for(const f of s.fx.dmgFaculties)dmg[f]=(dmg[f]||1)*s.fx.dmgMul
    }
    return{
        list, cdMul, healMul, dmgFor:id=>{
            const h=heroes.find(x=>x.id===id);
            return h&&dmg[h.f]||1
        }
    }
}
const ULTIMATES={
    wifi:{
        name:'📡 Wi-Fi Down', desc:'ศัตรูทั้งหมดสตัน 3 วินาที'
    }, rain:{
        name:'🌧️ Salaya Rain', desc:'ศัตรูเคลื่อนที่ช้าลง 40% นาน 12 วินาที'
    }, shuttle:{
        name:'🚌 Campus Shuttle', desc:'รถชัตเทิลพุ่งผ่านสนาม ดาเมจ 300 + ผลักศัตรูถอยหลัง'
    }
};
let ultType='wifi';
const FACULTY_LASER=Object.freeze({
    damage:500, cooldown:45, knockback:0, stun:0, slow:0, hits:1, beamTime:.6
});
const FACULTY_LASER_VFX={
    ICT:{
        color:'#38BDF8', particleStyle:'digital'
    }, EG:{
        color:'#FB923C', particleStyle:'sparks'
    }, SC:{
        color:'#C084FC', particleStyle:'molecules'
    }, SI:{
        color:'#22D3EE', particleStyle:'heartbeat'
    }, RA:{
        color:'#22D3EE', particleStyle:'heartbeat'
    }, MS:{
        color:'#F472B6', particleStyle:'notes'
    }, VS:{
        color:'#4ADE80', particleStyle:'nature'
    }
};
function laserVfx(id){
    return FACULTY_LASER_VFX[id]||{
        color:(faculties.find(f=>f[0]===id)||[])[3]||'#7dd3fc', particleStyle:'default'
    }
}
function absorbShield(u, block){
    let left=block;
    for(const pid in u.shieldSrc){
        if(left<=0)break;
        const take=Math.min(left, u.shieldSrc[pid]);
        u.shieldSrc[pid]-=take;
        left-=take;
        if(u.ally)CombatStats.recordDefense(pid, take);
        if(u.shieldSrc[pid]<=1e-9)delete u.shieldSrc[pid]
    }
}
function addShield(u, pid, amt, cap){
    const add=Math.min(amt, cap-u.shield);
    if(add>0){
        u.shield+=add;
        u.shieldSrc[pid]=(u.shieldSrc[pid]||0)+add
    }
}
let statsTab='dmg', statsOpen=false, statsTick=0;
const statsShown={
};
const STATS_TABS={
    dmg:'DMG', def:'DEF', heal:'HEAL'
}, STAT_KEY={
    dmg:'totalDamage', def:'totalDefense', heal:'totalHealing'
};
function fmtNum(n){
    return Math.round(n).toLocaleString('en-US')
}
function mmss(t){
    t=Math.floor(t||0);
    return String(Math.floor(t/60)).padStart(2, '0')+':'+String(t%60).padStart(2, '0')
}
function statsSource(){
    return battle&&battle.finalStats?battle.finalStats.rows:CombatStats.getAllCharacterStats()
}
function statsRows(tab){
    const key=STAT_KEY[tab];
    return statsSource().map((r, i)=>{
        const h=heroes.find(x=>x.id===r.characterId), f=faculties.find(x=>x[0]===r.facultyId); return{
            id:r.characterId, name:r.characterName, emoji:h?h.emoji:'', faculty:(f?f[2]+' ':'')+r.facultyId, value:r[key], i
        }
    }).sort((a, b)=>b.value-a.value||a.i-b.i)
}
function buildStatsList(){
    for(const k in statsShown)delete statsShown[k];
    const el=document.getElementById('statsList');
    if(!el)return;
    el.innerHTML=team.map(id=>{
        const h=heroes.find(x=>x.id===id); return '<div class="srow" id="srow-'+id+'" style="border-left:4px solid '+facColor(h.f)+';padding-left:8px"><div class="shead"><span class="sname">'+h.name+'</span><b class="sval" id="sval-'+id+'">0</b></div><div class="small" id="sfac-'+id+'"></div><div class="sbar"><div id="sbar-'+id+'" style="width:0%"></div></div></div>'
    }).join('')
}
function renderStatsPanel(force=false){
    if(!statsOpen&&!force)return;
    const now=performance.now();
    if(!force&&now-statsTick<200)return;
    statsTick=now;
    const r=statsRows(statsTab), max=Math.max(1, ...r.map(x=>x.value));
    r.forEach((x, idx)=>{
        const row=document.getElementById('srow-'+x.id); if(!row)return; row.style.order=String(idx); const prev=force?x.value:(statsShown[x.id]===undefined?0:statsShown[x.id]); const shown=Math.abs(x.value-prev)<1?x.value:prev+(x.value-prev)*.45; statsShown[x.id]=shown; document.getElementById('sval-'+x.id).textContent=fmtNum(shown); document.getElementById('sfac-'+x.id).textContent=(idx+1)+'. '+stripIcon(x.faculty); document.getElementById('sbar-'+x.id).style.width=(Math.round(1000*x.value/max)/10)+'%'
    });
    const f=battle&&battle.finalStats;
    document.getElementById('statsTime').textContent=mmss(battle?(f?f.time:battle.t):0);
    document.getElementById('statsExtra').textContent='Faculty Laser '+fmtNum(f?f.laserDamage:CombatStats.laserDamage)+' · Ultimate '+fmtNum(f?f.ultDamage:CombatStats.ultDamage)+' (นับแยก)'
}
function setStatsTab(tab){
    if(!STATS_TABS[tab])return;
    statsTab=tab;
    for(const t in STATS_TABS)document.getElementById('tab-'+t).classList.toggle('active', t===tab);
    document.getElementById('statsPanel').className='stats-panel tab-'+tab;
    renderStatsPanel(true)
}
function toggleStatsPanel(){
    statsOpen=!statsOpen;
    document.getElementById('stageWrap').classList.toggle('closed', !statsOpen);
    if(statsOpen)renderStatsPanel(true)
}
function renderResultStats(){
    const f=battle&&battle.finalStats, el=document.getElementById('resultStats');
    if(!f||!el)return;
    const rows=f.rows.slice().sort((a, b)=>b.totalDamage-a.totalDamage);
    el.innerHTML='<table style="width:100%;border-collapse:collapse;margin:10px 0"><tr><th align="left">ตัวละคร</th><th>DMG</th><th>DEF</th><th>HEAL</th><th>Deploy</th></tr>'+rows.map(r=>'<tr><td>'+r.characterName+'</td><td align="center">'+fmtNum(r.totalDamage)+'</td><td align="center">'+fmtNum(r.totalDefense)+'</td><td align="center">'+fmtNum(r.totalHealing)+'</td><td align="center">'+r.deploymentCount+'</td></tr>').join('')+'</table><div class="small">Faculty Laser '+fmtNum(f.laserDamage)+' · Ultimate '+fmtNum(f.ultDamage)+' (นับแยกจากตัวละคร)</div>'
}
const SPRITES={
};
/* Random numbers. Two independent seeded streams per battle (battle.rng):
   COMBAT (crand): everything the simulation does - enemy type and spawn position, boss rain positions, per-unit jitter and
   damage-number jitter (drawn at simulation events, so they are identical whatever the effects setting is).
   VFX (vrand): only presentation that depends on the effects level or the frame rate - particles and screen shake.
   Combat never draws from VFX and VFX never draws from Combat, so effects quality cannot change a battle. */ function createSeededRng(seed){
    let a=seed>>>0, draws=0;
    return{
        next(){
            draws++;
            a=(a+0x6d2b79f5)>>>0;
            let t=a;
            t=Math.imul(t^(t>>>15), t|1);
            t^=t+Math.imul(t^(t>>>7), t|61);
            return((t^(t>>>14))>>>0)/4294967296
        }, get state(){
            return a
        }, get draws(){
            return draws
        }
    }
}
let NEXT_SEED=null;
try{
    const m=/[?&]seed=(\d+)/.exec(location.search);
    if(m)NEXT_SEED=Number(m[1])>>>0
}
catch(e){
}
function setBattleSeed(n){
    NEXT_SEED=n==null?null:n>>>0
}
function newRngs(seed){
    const s=(seed!==undefined?seed:NEXT_SEED!==null?NEXT_SEED:Math.floor(Math.random()*4294967296))>>>0;
    return{
        seed:s, combat:createSeededRng(s), vfx:createSeededRng((s^0x9e3779b9)>>>0)
    }
}
const crand=()=>battle.rng.combat.next(), vrand=()=>battle.rng.vfx.next();
/* Sprites load lazily: only the characters a screen/battle needs (ensureSprites). A record stays in SPRITES after loading, so
   it is never fetched twice. Only idle is required: a missing or failed other sheet falls back (explicitly) instead of
   dropping the whole character to the placeholder drawing. */ let DEBUG_ANIM=false;
try{
    DEBUG_ANIM=/[?&]debug(=1)?(&|$)/.test(location.search)||localStorage.getItem('woc.debug')==='1'
}
catch(e){
}
function setDebug(on){
    DEBUG_ANIM=!!on
}
const FALLBACK_LOG=[];
const SPRITE_DEPS={
    animal:['dog']
};
function ensureSprites(ids){
    if(typeof CHARACTER_ANIMS==='undefined'||typeof Image==='undefined')return;
    for(const id of ids){
        const c=CHARACTER_ANIMS[id]||(typeof ENEMY_ANIMS!=='undefined'?ENEMY_ANIMS[id]:null);
        if(SPRITES[id]||!c)continue;
        const rec={
            id, ready:false, failed:false, anims:{
            }, fallback:c.fallback||{
            }, warned:{
            }
        };
        SPRITES[id]=rec;
        for(const a in c.anims){
            const st={
                img:new Image(), def:c.anims[a], status:'loading'
            };
            st.img.onload=()=>{
                st.status='ready';
                if(a==='idle')rec.ready=true
            };
            st.img.onerror=()=>{
                st.status='failed';
                if(a==='idle')rec.failed=true
            };
            st.img.src=c.anims[a].sheet;
            rec.anims[a]=st
        }
    }
}
function spriteIdsFor(ids){
    const s=new Set();
    for(const id of ids){
        s.add(id);
        (SPRITE_DEPS[id]||[]).forEach(d=>s.add(d))
    }
    return[...s]
}
function animFor(rec, name){
    const own=rec.anims[name];
    for(const n of [name, ...(rec.fallback[name]||[]), 'idle']){
        const a=rec.anims[n];
        if(a&&a.status==='ready'){
            if(n!==name&&DEBUG_ANIM&&(!own||own.status==='failed'))noteFallback(rec, name, n);
            return a
        }
    }
    return rec.anims.idle
}
function noteFallback(rec, name, n){
    if(rec.warned[name])return;
    rec.warned[name]=1;
    FALLBACK_LOG.push({
        id:rec.id, state:name, using:n
    });
    console.warn("[sprite] "+rec.id+": no usable '"+name+"' animation, using '"+n+"'")
}
const DEFAULT_MUZZLE=[18, -14];
function anchorOf(id, kind, def){
    const c=(typeof CHARACTER_ANIMS!=='undefined'&&CHARACTER_ANIMS[id])||(typeof ENEMY_ANIMS!=='undefined'&&ENEMY_ANIMS[id]), a=c&&c.anchors&&c.anchors[kind];
    return a||def
}
function muzzleOf(u){
    const a=anchorOf(u.id, 'muzzle', DEFAULT_MUZZLE);
    return[u.x+(u.ally?a[0]:-a[0]), u.y+a[1]]
}
function spriteReady(id){
    const s=SPRITES[id];
    return !!(s&&s.ready&&!s.failed)
}
function frameIndex(def, t){
    const i=Math.floor(t*def.frameRate);
    return def.repeat===-1?i%def.frameCount:Math.min(i, def.frameCount-1)
}
function animState(u){
    if(!u.alive)return'death';
    if(u.hurtT>0)return'hurt';
    if(u.stun>0)return'stun';
    if(u.skillT>0)return'skill';
    if(u.atkT>0)return'attack';
    if(u.moved)return'walk';
    return'idle'
}
function advanceAnim(u, dt){
    const s=animState(u);
    if(s!==u.animName){
        u.animName=s;
        u.animT=0
    }
    else u.animT+=dt;
    /* visual clock follows the combat timers, so a hurt reaction (or any state switch) can never desync attack/skill frames from their impact events */if(s==='attack')u.animT=ATK_DUR-u.atkT;
    else if(s==='skill')u.animT=SKILL_DUR-u.skillT;
    else if(s==='hurt')u.animT=HURT_DUR-u.hurtT
}
function drawSpriteFrame(id, name, t, x, y, ally){
    const rec=SPRITES[id], a=animFor(rec, name), d=a.def, i=frameIndex(d, t), fw=d.frameWidth||64, fh=d.frameHeight||64, sc=d.scale||2, feet=d.feetRow==null?55:d.feetRow, dw=fw*sc, dh=fh*sc, dy=Math.round(y+24-(feet+1)*sc);
    ctx.imageSmoothingEnabled=false;
    const sh=d.shadow&&(d.shadow[i]||d.shadow[d.shadow.length-1]), a0=ctx.globalAlpha;
    if(sh)ctx.globalAlpha=a0*sh[2];
    ctx.fillStyle='#162b4850';
    ctx.beginPath();
    ctx.ellipse(x+(sh?sh[0]*(ally?1:-1):0), y+24, sh?sh[1]:22, 6, 0, 0, Math.PI*2);
    ctx.fill();
    ctx.globalAlpha=a0;
    if(ally)ctx.drawImage(a.img, i*fw, 0, fw, fh, Math.round(x-dw/2), dy, dw, dh);
    else{
        ctx.save();
        ctx.translate(Math.round(x), 0);
        ctx.scale(-1, 1);
        ctx.drawImage(a.img, i*fw, 0, fw, fh, -dw/2, dy, dw, dh);
        ctx.restore()
    }
}
function drawBars(u){/* a boss sprite is drawn 1.65x larger, so its bar sits higher and wider (visual only) */
    const ec=!u.ally&&typeof ENEMY_ANIMS!=='undefined'&&ENEMY_ANIMS[u.id], boss=u.type==='boss', x=u.x, y=ec&&ec.barY!==undefined?u.y+ec.barY+70:u.y-(boss?62:0), w=boss?95:45;
    rect(x-w/2, y-70, w, 6, '#28314b');
    rect(x-w/2, y-70, w*Math.max(0, u.hp/u.maxHp), 6, u.ally?'#50ed9c':'#ff697e');
    if(u.buff>0){
        rect(x-w/2+2, y-82, 1, 1, '#52d49a');
        rect(x-w/2+1, y-81, 3, 1, '#52d49a');
        rect(x-w/2, y-80, 5, 1, '#52d49a');
        rect(x-w/2+2, y-79, 1, 3, '#52d49a')
    }
    if(u.weak>0){
        rect(x+w/2-3, y-82, 1, 3, '#b88bff');
        rect(x+w/2-5, y-79, 5, 1, '#b88bff');
        rect(x+w/2-4, y-78, 3, 1, '#b88bff');
        rect(x+w/2-3, y-77, 1, 1, '#b88bff')
    }
    if(u.stun>0){
        ctx.font='20px system-ui';
        ctx.textAlign='center';
        ctx.fillStyle='#fff';
        ctx.fillText('💫', x, y-76)
    }
    if(u.shield>0){
        ctx.strokeStyle='#66d6ff99';
        ctx.lineWidth=2;
        ctx.beginPath();
        ctx.arc(x, u.y-17, 31, 0, Math.PI*2);
        ctx.stroke()
    }
}
function drawMuzzleFlash(u){
    const d=u.ally?1:-1, m=muzzleOf(u), x=Math.round(m[0]), y=Math.round(m[1]), c=u.ally?'#bff3ff':'#ffd0d0', k=u.ally?'#7fe3ff':'#ff8a8a';
    rect(x-2, y-2, 4, 4, '#ffffff');
    rect(x+(d>0?2:-10), y-1, 8, 2, c);
    rect(x-1, y-8, 2, 5, k);
    rect(x-1, y+3, 2, 5, k);
    rect(x+(d>0?10:-14), y-1, 4, 2, k)
}
function drawUnit(u){
    if(!spriteReady(u.id)){
        drawUnitCanvas(u);
        return
    }
    drawSpriteFrame(u.id, u.animName||'idle', u.animT||0, u.x, u.y, u.ally);
    if(u.flashT>0&&u.animName==='hurt')drawMuzzleFlash(u);
    drawBars(u)
}
const SKILL_MODE={
    bug:'onStack', mecha:'onDeploy', lab:'every3', night:'onPulse', chem:'every3', animal:'onPulse', dental:'every3', music:'every3', runner:'onDeploy', global:'onDeploy', public:'onPulse', nurse:'onPulse'
};
const SKILL_DUR=.72, ATK_DUR=.5, HURT_DUR=.25, SKILL_IMPACT=.43, FX_MAX=300;
let fxLevel='full';
function setFxLevel(l){
    fxLevel=l==='reduced'?'reduced':l==='off'?'off':'full';
    if(fxLevel!=='off')try{
        localStorage.setItem('fxLevel', fxLevel)
    }
    catch(e){
    }
}
function fxLabel(){
    return fxLevel==='full'?'เอฟเฟกต์: เต็ม':'เอฟเฟกต์: ลด'
}
function toggleFx(){
    setFxLevel(fxLevel==='full'?'reduced':'full');
    document.getElementById('fxBtn').textContent=fxLabel()
}
function triggerSkill(u){
    u.skillT=SKILL_DUR;
    u.skillN=(u.skillN||0)+1;
    u.pend.push({
        t:SKILL_IMPACT, kind:'skillfx'
    })
}
function fxSpawn(x, y, vx, vy, life, color, size, grav){
    const b=battle;
    if(!b||fxLevel==='off')return;
    let p;
    if(b.particles.length>=FX_MAX){
        p=b.particles[b.fxHead%FX_MAX];
        b.fxHead++
    }
    else{
        p=b.fxFree.pop()||{
        };
        b.particles.push(p)
    }
    p.x=x;
    p.y=y;
    p.vx=vx;
    p.vy=vy;
    p.life=life;
    p.max=life;
    p.color=color;
    p.size=size;
    p.grav=grav
}
function updateFx(dt){
    const b=battle, ps=b.particles;
    let w=0;
    for(let i=0; i<ps.length; i++){
        const p=ps[i];
        p.x+=p.vx*dt;
        p.y+=p.vy*dt;
        p.vy+=p.grav*dt;
        p.life-=dt;
        if(p.life>0)ps[w++]=p;
        else b.fxFree.push(p)
    }
    ps.length=w
}
function fxBurst(x, y, color, n, size){
    if(!battle||fxLevel==='off')return;
    if(fxLevel==='reduced')n=Math.ceil(n/2);
    for(let i=0; i<n; i++){
        const a=vrand()*Math.PI*2, v=25+vrand()*120;
        fxSpawn(x, y, Math.cos(a)*v, Math.sin(a)*v, .35+vrand()*.45, color, size, 140)
    }
}
function fxRing(x, y, color, r){
    if(!battle||fxLevel==='off')return;
    const n=fxLevel==='reduced'?8:16;
    for(let i=0; i<n; i++){
        const a=i/n*Math.PI*2;
        fxSpawn(x, y, Math.cos(a)*r*2.5, Math.sin(a)*r*1.2, .4, color, 3, 0)
    }
}
function fxBeam(x1, y1, x2, y2, color){
    if(!battle||fxLevel==='off')return;
    const len=Math.hypot(x2-x1, y2-y1), step=fxLevel==='reduced'?12:6;
    for(let d=0; d<=len; d+=step){
        const t=d/len;
        fxSpawn(x1+(x2-x1)*t, y1+(y2-y1)*t, 0, 0, .25, color, 4, 0)
    }
}
function fxShake(p){
    if(battle&&fxLevel==='full')battle.shake=Math.max(battle.shake, p)
}
function heroColor(id){
    const h=heroes.find(x=>x.id===id), f=h&&faculties.find(x=>x[0]===h.f);
    return f?f[3]:'#9fe3ff'
}
function fxDefaultSkill(u){
    fxRing(u.x, u.y-20, heroColor(u.id), 12);
    fxBurst(u.x, u.y-20, heroColor(u.id), 10, 3)
}
/* Data-driven skill effects. A character's effect is data (character.json signature.fx, generated into fx.js as CHARACTER_FX):
   a list of ops. Coordinates are pixels relative to the skill anchor (x mirrored for enemies). Ops only call the fx* helpers,
   which only draw and only use vrand, so an effect can never change combat. */ function fxPos(c, p, off){
    return[c.x+c.dir*(c.ax+p[0])+(off?c.dir*off[0]:0), c.y+(c.ay+p[1])+(off?off[1]:0)]
}
function fxFlash(color, alpha, dur){
    if(!battle||fxLevel==='off')return;
    battle.flash={
        color, alpha:fxLevel==='reduced'?alpha*.5:alpha, t:dur, d:dur
    }
}
function runFxOps(ops, c, off){
    if(fxLevel==='off')return;
    for(const o of ops){
        switch(o.op){
            case'beam':{
                const f=fxPos(c, o.from, off), t=fxPos(c, o.to, off);
                fxBeam(f[0], f[1], t[0], t[1], o.color);
                break
            }
            case'burst':{
                const p=fxPos(c, o.at, off);
                fxBurst(p[0], p[1], o.color, o.count, o.size);
                break
            }
            case'ring':case'shockwave':{
                const p=fxPos(c, o.at, off);
                fxRing(p[0], p[1], o.color, o.radius);
                break
            }
            case'spawn':{
                const p=fxPos(c, o.at, off);
                fxSpawn(p[0], p[1], o.v[0]*c.dir, o.v[1], o.life, o.color, o.size, o.grav);
                break
            }
            case'shake':fxShake(o.amount);
            break;
            case'repeat':for(let i=0; i<o.count; i++)runFxOps(o.ops, c, [(off?off[0]:0)+i*o.step[0], (off?off[1]:0)+i*o.step[1]]);
            break;
            case'spiral':{
                const b=fxPos(c, o.at, off);
                for(let k=0; k<o.count; k++){
                    const a=k*o.angleStep, r=o.radius0+k*o.radiusStep;
                    fxSpawn(b[0]+c.dir*Math.cos(a)*r, b[1]+Math.sin(a)*r*(o.squash||1), 0, 0, o.life, o.colors[k%o.colors.length], o.size, 0)
                }
                break
            }
            case'arc':{
                const b=fxPos(c, o.at, off);
                for(let a=o.from; a<=o.to; a+=o.step)fxSpawn(b[0]+c.dir*Math.cos(a)*o.radius, b[1]+Math.sin(a)*o.radius*(o.squash||1), 0, 0, o.life, o.color, o.size, 0);
                break
            }
            case'explosion':{
                const p=fxPos(c, o.at, off);
                fxRing(p[0], p[1], o.color, o.radius);
                fxBurst(p[0], p[1], o.color2||o.color, o.count, o.size);
                if(o.shake)fxShake(o.shake);
                break
            }
            case'aura':{
                const p=fxPos(c, o.at, off), n=fxLevel==='reduced'?Math.ceil(o.count/2):o.count;
                for(let i=0; i<n; i++){
                    const a=i/n*Math.PI*2;
                    fxSpawn(p[0]+c.dir*Math.cos(a)*o.radius, p[1]+Math.sin(a)*o.radius*.5, 0, -o.rise, o.life, o.color, o.size, 0)
                }
                break
            }
            case'trail':{
                const f=fxPos(c, o.from, off), t=fxPos(c, o.to, off), n=fxLevel==='reduced'?Math.ceil(o.count/2):o.count;
                for(let i=0; i<n; i++){
                    const k=n>1?i/(n-1):0;
                    fxSpawn(f[0]+(t[0]-f[0])*k, f[1]+(t[1]-f[1])*k, 0, 0, o.life*(.4+.6*k), o.color, o.size, 0)
                }
                break
            }
            case'flash':fxFlash(o.color, o.alpha, o.duration);
            break;
            case'dissolve':{
                const p=fxPos(c, o.at, off), n=fxLevel==='reduced'?Math.ceil(o.count/2):o.count;
                for(let i=0; i<n; i++)fxSpawn(p[0]+c.dir*vrand()*o.w, p[1]+vrand()*o.h, 0, -(10+vrand()*20), o.life*(.5+vrand()*.5), o.color, o.size, 0);
                break
            }
        }
    }
}
function runSkillFx(u){
    const d=typeof CHARACTER_FX!=='undefined'&&CHARACTER_FX[u.id];
    if(!d){
        fxDefaultSkill(u);
        return
    }
    if(fxLevel==='off')return;
    const a=d.anchor||[0, 0];
    runFxOps(d.ops, {
        x:u.x, y:u.y, ax:a[0], ay:a[1], dir:u.ally?1:-1
    })
}
const IMPACT_DELAY=.25, HEAL_DELAY=.43, SUMMON_DELAY=.43, PROJECTILE_SPEED=600, RANGED_MIN=80;
function snapAttacker(u){
    return{
        type:u.type, ally:u.ally, id:u.id, src:srcOf(u)
    }
}
function startAttack(u, target, val){
    u.atkCount=(u.atkCount||0)+1;
    if(SKILL_MODE[u.id]==='every3'&&u.atkCount%3===0)triggerSkill(u);
    u.atkT=.5;
    u.cast=.27;
    u.fx=.38;
    const pa={
        t:IMPACT_DELAY, kind:'attack', target, val, a:snapAttacker(u)
    };
    if(u.kit==='advisor'&&u.atkCount%ENEMY_KITS.advisor.everyHits===0){
        pa.a.weak=true;
        u.skillT=SKILL_DUR
    }
    u.pend.push(pa)
}
function resolvePend(u, p){
    if(p.kind==='attack'){
        if(!p.target.alive)return;
        if(u.range>RANGED_MIN)launchProjectile(u, p);
        else applyAttack(p.a, p.target, p.val)
    }
    else if(p.kind==='heal')doHeal(u);
    else if(p.kind==='summon')doSummon(u);
    else if(p.kind==='base')doBaseHit(u);
    else if(p.kind==='skillfx')runSkillFx(u)
}
function launchProjectile(u, p){
    const b=battle, o=b.projFree.pop()||{
    };
    u.flashT=.14;
    const m=muzzleOf(u);
    o.x=m[0];
    o.y=m[1];
    o.target=p.target;
    o.val=p.val;
    o.a=p.a;
    o.color=u.ally?'#8fe9ff':'#ff8a8a';
    b.projectiles.push(o)
}
function updateProjectiles(dt){
    const b=battle, ps=b.projectiles;
    for(let i=ps.length-1; i>=0; i--){
        const p=ps[i], t=p.target;
        let done=false;
        if(!t.alive)done=true;
        else{
            const dx=t.x-p.x, step=PROJECTILE_SPEED*dt;
            if(Math.abs(dx)<=step+4){
                applyAttack(p.a, t, p.val);
                done=true
            }
            else{
                p.x+=Math.sign(dx)*step;
                p.y+=(t.y-18-p.y)*Math.min(1, dt*8)
            }
        }
        if(done){
            p.target=null;
            ps[i]=ps[ps.length-1];
            ps.pop();
            b.projFree.push(p)
        }
    }
}
function applyAttack(a, target, val){
    const b=battle, foes=a.ally?b.enemies:b.units;
    damage(target, val, a.src);
    if(!a.ally)enemyImpact(a, target);
    if(a.weak&&target.alive&&!(target.weak>0)&&!(target.weakImm>0)){
        target.weak=ENEMY_KITS.advisor.weakTime;
        target.weakImm=ENEMY_KITS.advisor.weakImmune;
        burst(target.x, target.y-20, '#b88bff', 9)
    }
    if(a.type==='aoe'){
        for(const other of foes)if(other!==target&&other.alive&&Math.abs(other.x-target.x)<90)damage(other, val*.48, a.src);
        burst(target.x, target.y, '#d88aff', 12)
    }
    else if(a.type==='poison'){
        target.poison=3.8;
        target.poisonSource=a.src;
        burst(target.x, target.y, '#a5fa8a', 7)
    }
    else if(a.type==='slow'){
        for(const other of foes)if(other.alive&&Math.abs(other.x-target.x)<90)other.slow=2.4;
        burst(target.x, target.y, '#ee83ff', 9)
    }
    else burst(target.x, target.y, a.ally?'#82e7ff':'#ff9393', 5)
}
function doHeal(u){
    const b=battle, injured=b.units.filter(a=>a.alive&&a.hp<a.maxHp&&Math.abs(a.x-u.x)<u.range);
    injured.sort((a, c)=>a.hp/a.maxHp-c.hp/c.maxHp);
    for(const a of injured.slice(0, u.type==='massheal'?4:1)){
        const hv=(u.type==='massheal'?150:185)*b.syn.healMul;
        const eff=Math.min(hv, a.maxHp-a.hp);
        a.hp+=eff;
        CombatStats.recordHealing(srcOf(u), eff);
        burst(a.x, a.y-22, '#72ff9d', 5);
        b.floaters.push({
            x:a.x, y:a.y-52, txt:'+'+Math.round(eff), life:.75, color:'#54ffb1'
        })
    }
}
function doSummon(u){
    const b=battle;
    if(b.units.length>=35)return;
    const dog=makeUnit({
        id:'dog', hp:270, atk:33, range:36, spd:75, interval:.75, emoji:'🐕', type:'basic'
    }, true, u.x+15);
    dog.owner=u.id;
    b.units.push(dog);
    burst(dog.x, dog.y, '#9bf8cc', 8)
}
function doBaseHit(u){
    const b=battle, baseX=u.ally?963:135;
    if(u.ally){
        if(b.bossSpawned&&b.bossDead){
            const dealt=Math.min(b.enemyHp, u.atk);
            b.enemyHp-=dealt;
            CombatStats.recordBaseDamage(u.owner||u.id, dealt)
        }
        else{
            const dealt=Math.min(Math.max(0, b.enemyHp-1), u.atk*.3);
            b.enemyHp-=dealt;
            CombatStats.recordBaseDamage(u.owner||u.id, dealt)
        }
    }
    else b.baseHp-=u.atk;
    burst(baseX, 320, u.ally?'#ffbd83':'#72caff', 6)
}
function srcOf(u){
    return u.ally?(u.owner||u.id):null
}
const CombatStats={
    rec:{
    }, baseDamage:{
    }, laserDamage:0, ultDamage:0, resetBattleStats(){
        this.rec={
        };
        this.baseDamage={
        };
        this.laserDamage=0;
        this.ultDamage=0;
        for(const id of team){
            const h=heroes.find(x=>x.id===id);
            this.rec[id]={
                characterId:id, characterName:h.name, facultyId:h.f, totalDamage:0, totalDefense:0, totalHealing:0, deploymentCount:0
            }
        }
    }, _add(id, key, n){
        const r=this.rec[id];
        if(r&&n>0)r[key]+=n
    }, recordDamage(id, n){
        if(id==='__base__'||id==='__laser__'){
            if(n>0)this.laserDamage+=n
        }
        else if(id==='__ult__'){
            if(n>0)this.ultDamage+=n
        }
        else this._add(id, 'totalDamage', n)
    }, recordDefense(id, n){
        this._add(id, 'totalDefense', n)
    }, recordHealing(id, n){
        this._add(id, 'totalHealing', n)
    }, recordDeploy(id){
        const r=this.rec[id];
        if(r)r.deploymentCount++
    }, recordBaseDamage(id, n){
        if(n>0)this.baseDamage[id]=(this.baseDamage[id]||0)+n
    }, getCharacterStats(id){
        return this.rec[id]||null
    }, getAllCharacterStats(){
        return team.map(id=>this.rec[id]).filter(Boolean)
    }
};
let faculty='ICT', team=['bug', 'mecha', 'lab', 'night', 'animal', 'music'], screen='home', battle=null, ctx=document.getElementById('game').getContext('2d'), last=0;
/* one orchestrated moment: a navy curtain with a gold edge wipes across on every screen change (reduced motion: hidden by CSS) */
function curtain(){
    const c=document.getElementById('curtain');
    if(!c||c.offsetWidth===undefined)return;
    c.classList.remove('go');
    void c.offsetWidth;
    c.classList.add('go')
}
function show(s){
    screen=s;
    curtain();
    ['home', 'faculty', 'team', 'stageSelect', 'battle', 'result'].forEach(id=>document.getElementById(id).classList.toggle('hidden', id!==s));
    if(s==='faculty')renderFaculty();
    if(s==='team')renderTeam();
    if(s==='stageSelect')renderStages()
}
function fdata(){
    return faculties.find(f=>f[0]===faculty)
}
function renderFaculty(){
    const selected=fdata();
    const grid=document.getElementById('facultyGrid');
    grid.innerHTML=faculties.filter(f=>SELECTABLE_FACULTY_IDS.has(f[0])).map(f=>`<button type="button" class="faculty-option ${f[0]===faculty?'selected':''}" style="--fo:${f[3]}" onclick="chooseFaculty('${f[0]}')" aria-pressed="${f[0]===faculty}"><span class="fac-mono" style="--fc:${f[3]}">${f[0]}</span><span class="faculty-option-text"><strong>${f[1]}</strong><small>${f[0]}</small></span>${f[0]===faculty?'<span class="faculty-option-check">✓</span>':''}</button>`).join('');
    document.getElementById('facultySelectCount').textContent=SELECTABLE_FACULTY_IDS.size+' คณะ';
    document.getElementById('baseEmblem').textContent=selected[0];
    const bcfg=baseCfg(selected);
    ensureBase(selected);
    document.getElementById('facultyBaseImg').classList.toggle('hidden', !bcfg);
    document.getElementById('baseBuilding').classList.toggle('hidden', !!bcfg);
    if(bcfg){
        document.getElementById('facultyBaseImg').alt=bcfg.buildingName;
        document.getElementById('facultyBaseImg').src=bcfg.sprite
    }
    document.getElementById('facultyBaseArt').style.setProperty('--faculty-color',selected[3]);
    document.getElementById('baseName').textContent=selected[1]+' BASE';
    document.getElementById('facultyInfo').innerHTML=`<div class="info-faction" style="--fc:${selected[3]}"><span class="fac-mono" style="--fc:${selected[3]}">${selected[0]}</span><div><span class="small">คณะที่เลือก</span><strong>${selected[1]}</strong><span class="small">${selected[0]} · Faculty Guild</span></div></div><div class="info-line"><span>ประเภทฐาน</span><strong>Faculty Base</strong></div><div class="info-line"><span>สกิลฐาน</span><strong>Faculty Laser</strong></div><div class="info-line"><span>เอฟเฟกต์ประจำคณะ</span><strong>${selected[4]}</strong></div><div class="info-line"><span>พลังโจมตีสกิลฐาน</span><strong>500 DMG</strong></div><div class="info-line"><span>คูลดาวน์</span><strong>45 วินาที</strong></div><div class="info-hint">การเลือกคณะมีผลกับชื่อ สี และเอฟเฟกต์ของฐาน ไม่จำกัดตัวละครที่ใช้จัดทีม</div>`;
    document.getElementById('facultyPreview').textContent='เลือกคณะทางขวาเพื่อดูฐานและรายละเอียดทางซ้าย';
}
function chooseFaculty(id){
    faculty=id;
    renderFaculty()
}
function confirmFaculty(){
    show('team')
}
/* UI helpers (presentation only) */
const ROLE_TH={ranged:'ระยะไกล', tank:'แทงก์', aoe:'โจมตีวงกว้าง', heal:'ฮีล', massheal:'ฮีลหมู่', poison:'พิษ', summon:'อัญเชิญ', pierce:'เจาะเกราะ', slow:'หน่วง', dash:'พุ่งชน', income:'เพิ่ม AT', shield:'โล่', basic:'พื้นฐาน'};
function facColor(code){
    const f=faculties.find(x=>x[0]===code);
    return f?f[3]:'#3d8bff'
}
function stripIcon(t){
    return String(t).replace(/^[^\p{L}\p{N}]+/u, '')
}
function starsHtml(n){
    return '<span class="stars" aria-label="'+n+' ดาว">'+'★'.repeat(n)+'<i>'+'★'.repeat(5-n)+'</i></span>'
}
/* first idle frame of the real sprite sheet; native lazy loading keeps a 100-character collection light */
function portrait(h, cls){
    const c=typeof CHARACTER_ANIMS!=='undefined'&&CHARACTER_ANIMS[h.id], a=c&&c.anims&&c.anims.idle;
    if(!a)return '<span class="'+cls+' noimg spr-box">'+h.name.charAt(0)+'</span>';
    return '<span class="'+cls+' spr-box"><img src="'+a.sheet+'" alt="" loading="lazy" decoding="async" draggable="false" style="width:'+(a.frameCount*100)+'%"></span>'
}
/* Team Builder collection state (kept while the player moves between screens) */
const ROLE_INFO={DPS:{icon:'⚔',label:'DPS'},Tank:{icon:'⬟',label:'Tank'},Healer:{icon:'✚',label:'Healer'},Support:{icon:'✦',label:'Support'}};
const HERO_ROLES={bug:'DPS',mecha:'Tank',lab:'DPS',night:'Healer',chem:'DPS',animal:'Support',dental:'DPS',music:'Support',runner:'DPS',global:'Support',public:'Tank',nurse:'Healer'};
function heroRole(h){return HERO_ROLES[h.id]||'DPS'}
function roleBadge(h){const r=heroRole(h), info=ROLE_INFO[r];return `<span class="role-badge role-${r.toLowerCase()}" title="${info.label}" aria-label="บทบาท ${info.label}">${info.icon}</span>`}
function openSynergyHelp(){
 const list=document.getElementById('synHelpList');
 list.innerHTML=SYNERGIES.map(s=>`<article class="syn-entry"><strong>${s.name}</strong><p>${s.desc}</p></article>`).join('');
 document.getElementById('synergyHelp').showModal();
}
const TB={q:'', fac:'', role:'', minStar:1, sort:'default', sortDir:'asc', focus:null};
function filterHeroes(list, st){
    const q=(st.q||'').trim().toLowerCase();
    const out=list.filter(h=>(!q||(h.name+' '+h.skill+' '+h.desc+' '+h.f).toLowerCase().includes(q))&&(!st.fac||h.f===st.fac)&&(!st.role||heroRole(h)===st.role)&&h.star>=st.minStar);
    const comparators={star:(a,b)=>a.star-b.star||a.cost-b.cost,cost:(a,b)=>a.cost-b.cost||a.star-b.star,fac:(a,b)=>a.f.localeCompare(b.f)||a.star-b.star,default:(a,b)=>heroes.indexOf(a)-heroes.indexOf(b)};
    return out.slice().sort((a,b)=>comparators[st.sort](a,b)*(st.sortDir==='asc'?1:-1));
}
function tbSet(k,v){
    if(k==='sort'){
        if(TB.sort===v)TB.sortDir=TB.sortDir==='asc'?'desc':'asc';
        else {TB.sort=v;TB.sortDir=v==='default'?'asc':'desc';}
    }else if(k==='q')TB.q=v;
    else TB[k]=TB[k]===v?'':v;
    renderTeam();
}
function tbPreviewStar(input){
    const value=Number(input.value);
    document.getElementById('starValue').textContent=value+' ★ ขึ้นไป';
    input.style.setProperty('--star-progress',((value-1)/4*100)+'%');
}
function tbSetStar(v){TB.minStar=Number(v);renderTeam()}
function tbClear(){
    Object.assign(TB,{q:'',fac:'',role:'',minStar:1,sort:'default',sortDir:'asc'});
    document.getElementById('tbSearch').value='';renderTeam();
}
function tbFocusHero(id){
    TB.focus=id;
    const h=heroes.find(x=>x.id===id);
    if(h)document.getElementById('tbFocus').innerHTML=focusHtml(h)
}
function focusHtml(h){
    return `<div class="fp" style="--fc:${facColor(h.f)}">${portrait(h,'')}</div><div><h3>${h.name} ${starsHtml(h.star)}</h3><div class="cmeta" style="justify-content:flex-start"><span class="cfac">${h.f}</span><span>${heroRole(h)}</span><span>${h.cost} AT</span></div><p><span class="sk">${h.skill}</span> · ${h.desc}</p></div><div class="tb-stats"><div><span>HP</span><b>${h.hp}</b></div><div><span>ATK</span><b>${h.atk}</b></div><div><span>ระยะ</span><b>${h.range}</b></div></div>`
}
function renderTbFilters(){
    const facs=[...new Set(heroes.map(h=>h.f))];
    const chip=(on,onclick,label,extra,fc)=>`<button type="button" class="fchip ${fc?'':'plain'} ${on?'on':''}" ${fc?'style="--fc:'+fc+'"':''} aria-pressed="${on}" onclick="${onclick}">${label}${extra||''}</button>`;
    let h='<div><h4>คณะ</h4><div class="chips">'+facs.map(f=>chip(TB.fac===f,"tbSet('fac','"+f+"')",f,'<span class="n">'+heroes.filter(x=>x.f===f).length+'</span>',facColor(f))).join('')+'</div></div>';
    h+=`<div class="star-filter"><h4>ดาว <output id="starValue">${TB.minStar} ★ ขึ้นไป</output></h4><input aria-label="ดาวขั้นต่ำ" type="range" min="1" max="5" step="1" value="${TB.minStar}" oninput="tbPreviewStar(this)" onchange="tbSetStar(this.value)" style="--star-progress:${(TB.minStar-1)*25}%"><div class="star-scale"><span>1 ★</span><span>5 ★</span></div></div>`;
    h+='<div><h4>บทบาท</h4><div class="chips">'+Object.keys(ROLE_INFO).map(r=>chip(TB.role===r,"tbSet('role','"+r+"')",`<span class="role-mini role-${r.toLowerCase()}">${ROLE_INFO[r].icon}</span> ${r}`)).join('')+'</div></div>';
    h+='<div><h4>เรียงตาม</h4><div class="chips">'+[['default','ค่าเริ่มต้น'],['star','ดาว'],['cost','ต้นทุน AT'],['fac','คณะ']].map(([k,l])=>chip(TB.sort===k,"tbSet('sort','"+k+"')",l+(TB.sort===k?(TB.sortDir==='asc'?' ↑':' ↓'):' ↕'))).join('')+'</div></div>';
    const active=TB.q||TB.fac||TB.role||TB.sort!=='default'||TB.sortDir!=='asc'||TB.minStar!==1;
    if(active)h+='<div><button type="button" class="secondary" onclick="tbClear()">ล้างตัวกรอง</button></div>';
    document.getElementById('tbFilters').innerHTML=h;
}
function renderTeam(){
    ensureSprites(spriteIdsFor(team));
    const full=team.length>=6, list=filterHeroes(heroes, TB);
    renderTbFilters();
    document.getElementById('tbCount').textContent=heroes.length;
    document.getElementById('tbCountNote').textContent=list.length===heroes.length?'ลากตัวละครไปวางในช่องทีม · คลิกเพื่อเลือก':`แสดง ${list.length} จาก ${heroes.length}`;
    document.getElementById('teamGrid').innerHTML=list.length?list.map(h=>{
        const on=team.includes(h.id);
        return `<div data-selected="${on?'true':'false'}" class="ccard r${h.star} ${on?'sel':''} ${full?'full':''}" style="--fc:${facColor(h.f)}" role="button" tabindex="0" aria-pressed="${on}" onclick="toggleHero('${h.id}')" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();toggleHero('${h.id}')}" draggable="true" data-hero="${h.id}" ondragstart="tbDragStart(event,'${h.id}')" ondragend="tbDragEnd()" onmouseenter="tbFocusHero('${h.id}')" onfocus="tbFocusHero('${h.id}')"><span class="ccoin">${h.cost}</span><div class="cin"><div class="cportrait">${portrait(h,'')}</div>${roleBadge(h)}<div class="cribbon" title="${h.name}">${h.name}</div>${starsHtml(h.star)}<div class="cmeta"><span class="cfac">${h.f}</span><span>${heroRole(h)}</span></div></div></div>`
    }).join(''):'<div class="tb-empty"><b>ไม่พบตัวละครที่ตรงกัน</b>ลองลบตัวกรองบางอย่าง หรือล้างทั้งหมด<br><br><button type="button" class="secondary" onclick="tbClear()">ล้างตัวกรอง</button></div>';
    let slots='';
    for(let i=0;i<6;i++){
        const h=heroes.find(x=>x.id===team[i]);
        slots+=h?`<div class="tslot filled" data-slot="${i}" draggable="true" ondragstart="tbDragStart(event,'${h.id}')" ondragend="tbDragEnd()" ondragover="tbDragOver(event)" ondragleave="tbDragLeave(event)" ondrop="tbDrop(event,${i})" style="--fc:${facColor(h.f)}" role="button" tabindex="0" aria-label="เอา ${h.name} ออกจากทีม" onclick="toggleHero('${h.id}')" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();toggleHero('${h.id}')}"><span class="n">${i+1}</span>${portrait(h,'e')}${roleBadge(h)}<span class="nm">${h.name}</span><span class="ct">${h.cost} AT</span></div>`:`<div class="tslot empty" data-slot="${i}" ondragover="tbDragOver(event)" ondragleave="tbDragLeave(event)" ondrop="tbDrop(event,${i})"><span class="n">${i+1}</span><span class="drop-hint">+ วางตัวละคร</span></div>`
    }
    document.getElementById('teamSlots').innerHTML=slots;
    const fh=heroes.find(x=>x.id===TB.focus)||heroes.find(x=>x.id===team[0])||heroes[0];
    document.getElementById('tbFocus').innerHTML=focusHtml(fh);
    document.getElementById('teamCount').classList.toggle('ok', team.length===6);
    document.getElementById('teamCount').textContent=`เลือกแล้ว ${team.length}/6 ตัว · สามารถผสมคณะได้อิสระ`;
    document.getElementById('startBtn').disabled=team.length!==6;
    document.getElementById('ultPick').innerHTML=Object.entries(ULTIMATES).map(([id, u])=>`<div class="tile ${ultType===id?'sel':''}" role="button" tabindex="0" aria-pressed="${ultType===id}" onclick="chooseUlt('${id}')" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();chooseUlt('${id}')}"><strong>${stripIcon(u.name)}</strong></div>`).join('');
    document.getElementById('ultDesc').textContent=ULTIMATES[ultType]?stripIcon(ULTIMATES[ultType].name)+': '+ULTIMATES[ultType].desc:'';
    const sl=team.length?calcSynergies(team):[];
    document.getElementById('teamSyn').innerHTML=sl.length?'<b>Synergy ที่ติดอยู่</b><br>'+sl.map(s=>`${stripIcon(s.name)} — ${s.desc}`).join('<br>'):'ไม่มี Synergy'
}
// Drag cards into team slots; occupied slots are replaced or swapped.
let tbDraggedId=null;
let tbSuppressClick=false;
function tbDragStart(event,id){
    tbDraggedId=id;
    event.dataTransfer.effectAllowed='move';
    event.dataTransfer.setData('text/plain',id);
    event.currentTarget.classList.add('dragging');
    document.getElementById('teamSlots').classList.add('drop-ready');
}
function tbDragEnd(){
    tbDraggedId=null;
    document.querySelectorAll('.dragging,.drag-over').forEach(el=>el.classList.remove('dragging','drag-over'));
    document.getElementById('teamSlots').classList.remove('drop-ready');
}
function tbDragOver(event){event.preventDefault();event.dataTransfer.dropEffect='move';event.currentTarget.classList.add('drag-over')}
function tbDragLeave(event){if(!event.currentTarget.contains(event.relatedTarget))event.currentTarget.classList.remove('drag-over')}
function tbPlaceHero(id,slot){
    if(!heroes.some(h=>h.id===id)||slot<0||slot>=6)return;
    const previous=team.indexOf(id);
    if(previous===slot)return;
    const occupant=team[slot];
    if(previous>=0){
        if(occupant){team[slot]=id;team[previous]=occupant}
        else {team.splice(previous,1);team.splice(Math.min(slot,team.length),0,id)}
    }else if(occupant){team[slot]=id}
    else if(team.length<6){team.splice(Math.min(slot,team.length),0,id)}
    TB.focus=id;
    renderTeam();
}
function tbDrop(event,slot){
    event.preventDefault();
    const id=event.dataTransfer.getData('text/plain')||tbDraggedId;
    tbDragEnd();
    tbPlaceHero(id,slot);
}
// Pointer fallback supports dragging on touchscreens as well as mouse.
let tbPointer=null;
document.addEventListener('pointerdown',event=>{
    const card=event.target.closest('#teamGrid .ccard, #teamSlots .tslot.filled');
    if(!card||event.button!==0)return;
    const id=card.dataset.hero||(team[Number(card.dataset.slot)]);
    if(!id)return;
    tbPointer={id,x:event.clientX,y:event.clientY,active:false};
});
document.addEventListener('pointermove',event=>{
    if(!tbPointer||event.pointerType==='mouse')return;
    if(!tbPointer.active&&Math.hypot(event.clientX-tbPointer.x,event.clientY-tbPointer.y)>10){
        tbPointer.active=true;
        document.getElementById('teamSlots').classList.add('drop-ready');
    }
    if(!tbPointer.active)return;
    event.preventDefault();
    document.querySelectorAll('#teamSlots .drag-over').forEach(el=>el.classList.remove('drag-over'));
    const slot=document.elementFromPoint(event.clientX,event.clientY)?.closest('#teamSlots .tslot');
    if(slot)slot.classList.add('drag-over');
},{passive:false});
document.addEventListener('pointerup',event=>{
    if(!tbPointer)return;
    const drag=tbPointer;tbPointer=null;
    if(!drag.active)return;
    const slot=document.elementFromPoint(event.clientX,event.clientY)?.closest('#teamSlots .tslot');
    tbDragEnd();
    tbSuppressClick=true;
    setTimeout(()=>{tbSuppressClick=false},80);
    if(slot)tbPlaceHero(drag.id,Number(slot.dataset.slot));
},true);
document.addEventListener('pointercancel',()=>{tbPointer=null;tbDragEnd()});
document.addEventListener('click',event=>{
    if(tbSuppressClick&&event.target.closest('#teamGrid .ccard,#teamSlots .tslot')){
        event.preventDefault();event.stopImmediatePropagation();tbSuppressClick=false;
    }
},true);
function toggleHero(id){
    TB.focus=id;
    if(team.includes(id))team=team.filter(x=>x!==id);
    else if(team.length<6)team.push(id);
    renderTeam()
}
function startBattle(seed){
    ensureSprites(spriteIdsFor(team).concat(STAGES[stage].enemies));
    const R=newRngs(seed);
    battle={
        rng:R, seed:R.seed, t:0, at:180, maxAt:1000, income:10, level:1, upgrade:130, baseHp:5000, enemyHp:6500, units:[], enemies:[], particles:[], floaters:[], trails:[], cd:{
        }, baseCd:0, enemyTimer:4, bossSpawned:false, bossDead:false, paused:false, speed:1, ended:false, kills:0, deployed:0, notice:'ส่งตัวละครเพื่อป้องกันฐาน', noticeTime:4, syn:synergyFx(team), ult:0, rain:0, shuttle:null, warnings:[], laser:null, corpses:[], projectiles:[], projFree:[], shake:0, fxHead:0, fxFree:[], stage:stage
    };
    document.getElementById('battleInfo').textContent=battle.syn.list.length?'Synergy: '+battle.syn.list.map(s=>stripIcon(s.name)).join(' · '):'ไม่มี Synergy';
    team.forEach(id=>battle.cd[id]=0);
    document.getElementById('battleTitle').textContent=STAGES[stage].name;
    document.getElementById('hpPlayerName').textContent=`ฐาน ${fdata()[0]}`;
    document.getElementById('hpPlayerBox').style.borderLeftColor=fdata()[3];
    document.getElementById('battleCards').innerHTML=team.map(id=>{
        const h=heroes.find(x=>x.id===id); return `<button class="unitbtn r${h.star} ready" id="card-${id}" style="--fc:${facColor(h.f)}" onclick="deploy('${id}')" data-tip="${h.skill}: ${h.desc}"><span class="cin"><span class="cdfill" id="cdf-${id}"></span><span class="ccoin">${h.cost}</span><span class="cportrait">${portrait(h,'')}</span><span class="cribbon">${h.name}</span><small id="cd-${id}">พร้อม</small></span></button>`
    }).join('');
    document.getElementById('pauseBtn').textContent='หยุด';
    document.getElementById('speedBtn').textContent='1×';
    AUTO.on=false;
    renderAuto();
    document.getElementById('fxBtn').textContent=fxLabel();
    CombatStats.resetBattleStats();
    buildStatsList();
    renderStatsPanel(true);
    show('battle')
}
function notice(s){
    battle.notice=s;
    battle.noticeTime=2.7
}
function deploy(id){
    const b=battle, h=heroes.find(x=>x.id===id);
    if(!b||b.ended||b.paused||b.at<h.cost||b.cd[id]>0||b.units.length>=35)return;
    b.at-=h.cost;
    b.cd[id]=h.cd*b.syn.cdMul;
    b.deployed++;
    CombatStats.recordDeploy(id);
    const u=makeUnit(h, true, 116+b.units.length%4*8);
    b.units.push(u);
    if(SKILL_MODE[id]==='onDeploy')triggerSkill(u);
    if(h.type==='income'){
        b.at=Math.min(b.maxAt, b.at+85);
        notice('Global Link +85 AT')
    }
    if(h.type==='dash'){
        u.x+=95;
        burst(u.x, u.y, '#ffb34d', 16)
    }
    burst(u.x, u.y, '#6de4ff', 9)
}
function makeUnit(h, ally, x){
    return{
        id:h.id, x, y:327+(crand()-.5)*30, ally, hp:h.hp, maxHp:h.hp, atk:h.atk, range:h.range, spd:h.spd, interval:h.interval, cd:.2, emoji:h.emoji, type:h.type, poison:0, slow:0, stun:0, shield:h.type==='tank'?160:0, shieldSrc:h.type==='tank'?{
            [h.id]:160
        }
        :{
        }, summon:0, hit:0, stack:0, lastTarget:null, alive:true, walk:crand()*6, cast:0, fx:0, animName:'idle', animT:0, atkT:0, skillT:0, hurtT:0, hurtCd:0, moved:false, px:x, pend:[]
    }
}
const enemyTemplates=()=>({
    basic:{
        id:'assignment', hp:420, atk:52, range:40, spd:38, interval:1.4, emoji:'📄', type:'basic'
    }, fast:{
        id:'deadline', hp:300, atk:65, range:38, spd:67, interval:1.1, emoji:'⏰', type:'basic'
    }, tank:{
        id:'group', hp:1350, atk:58, range:42, spd:25, interval:1.6, emoji:'📚', type:'tank'
    }, ranged:{
        id:'quiz', hp:450, atk:75, range:125, spd:32, interval:1.8, emoji:'📝', type:'ranged'
    }, boss:{
        id:'final', hp:6400, atk:150, range:58, spd:20, interval:1.8, emoji:'👹', type:'boss'
    }, professor:{
        id:'professor', hp:440, atk:62, range:150, spd:30, interval:2.3, emoji:'👨‍🏫', type:'ranged'
    }, ta:{
        id:'ta', hp:270, atk:31, range:95, spd:62, interval:1.5, emoji:'📚', type:'basic', kit:'ta'
    }, advisor:{
        id:'advisor', hp:1300, atk:50, range:140, spd:22, interval:2.6, emoji:'📋', type:'elite', kit:'advisor'
    }, exammaster:{
        id:'exammaster', hp:5800, atk:97, range:150, spd:21, interval:2.2, emoji:'🧙', type:'boss', kit:'exammaster'
    }
});
/* Stages are data: the enemy roster (sprites are loaded for it only), the spawn pick, the spawn gap and the boss.
   Stage 1 is the original schedule, bit for bit; Stage 2 brings the teaching staff. */
const STAGES={
    1:{
        name:'Stage 1 · Midterm Rush', desc:'งานเดี่ยว งานกลุ่ม และข้อสอบกลางภาคบุกมาเป็นระลอก ปิดท้ายด้วยบอส Final Exam', enemies:['assignment', 'deadline', 'group', 'quiz', 'final'], bossType:'boss', bossAt:85,
        pick:(t, r)=>t>32&&r<.25?'tank':t>22&&r<.4?'ranged':r<.25?'fast':'basic',
        gap:t=>Math.max(1.8, 4.6-t*.02)
    }, 2:{
        name:'Stage 2 · Faculty Staff', desc:'อาจารย์โหด ผู้ช่วยสอนที่คอยบัฟ และอาจารย์ที่ปรึกษาที่ลดพลังโจมตี ปิดท้ายด้วยบอส Exam Master', enemies:['assignment', 'deadline', 'professor', 'ta', 'advisor', 'exammaster'], bossType:'exammaster', bossAt:90,
        pick:(t, r)=>t>52&&r<.12?'advisor':t>28&&r<.3?'professor':t>12&&r<.46?'ta':r<.2?'fast':'basic',
        gap:t=>Math.max(2.5, 5.5-t*.02)
    }, 3:{
        name:'Stage 3 · Group Project Hell', desc:'กลุ่มงานตัวหนาและข้อสอบระยะไกลบุกพร้อมผู้ช่วยสอนที่คอยบัฟ ปิดท้ายด้วย Final Exam ที่แข็งแกร่งขึ้น', enemies:['assignment', 'deadline', 'group', 'quiz', 'ta', 'final'], bossType:'boss', bossAt:95,
        scale:{
            hp:1.08, atk:1.03
        },
        pick:(t, r)=>t>40&&r<.2?'tank':t>20&&r<.38?'ranged':t>10&&r<.5?'ta':r<.3?'fast':'basic',
        gap:t=>Math.max(2.2, 4.4-t*.02)
    }, 4:{
        name:'Stage 4 · Thesis Defense', desc:'อาจารย์ ผู้ช่วยสอน และอาจารย์ที่ปรึกษาผสมกับกลุ่มงานตัวหนา ก่อนเจอ Exam Master ตัวจริง', enemies:['deadline', 'group', 'quiz', 'professor', 'ta', 'advisor', 'exammaster'], bossType:'exammaster', bossAt:100,
        scale:{
            hp:1.08, atk:1.02
        },
        pick:(t, r)=>t>60&&r<.12?'advisor':t>35&&r<.28?'tank':t>24&&r<.46?'professor':t>14&&r<.6?'ta':r<.25?'ranged':'fast',
        gap:t=>Math.max(2.6, 5.4-t*.02)
    }, 5:{
        name:'Stage 5 · Exam Week', desc:'สัปดาห์สอบ ศัตรูทุกชนิดบุกถี่ที่สุด และบอสสองตัวมาเรียงกัน Final Exam แล้วตามด้วย Exam Master', enemies:['assignment', 'deadline', 'group', 'quiz', 'professor', 'ta', 'advisor', 'final', 'exammaster'], bossType:'boss', bossAt:90, bossType2:'exammaster', bossAt2:150,
        scale:{
            hp:1.05, atk:1
        },
        pick:(t, r)=>t>60&&r<.1?'advisor':t>45&&r<.25?'tank':t>30&&r<.4?'professor':t>16&&r<.55?'ta':t>10&&r<.7?'ranged':r<.3?'fast':'basic',
        gap:t=>Math.max(2.5, 5.2-t*.02)
    }
};
/* sprite ids of the default stage (kept for compatibility); a battle loads the roster of its own stage */
const ENEMY_SPRITE_IDS=STAGES[1].enemies;
let stage=1;
const ENEMY_NAMES={
    assignment:'Assignment Monster', deadline:'Deadline Monster', group:'Group Project Gang', quiz:'Midterm Exam', final:'Final Exam', professor:'Strict Professor', ta:'Ruthless TA', advisor:'Thesis Advisor', exammaster:'Exam Master'
};
function setStage(n){
    if(!STAGES[n])return;
    stage=+n;
    renderStages()
}
function renderStages(){
    const el=document.getElementById('stagePick');
    if(!el)return;
    el.innerHTML=Object.entries(STAGES).map(([n, s])=>{
        const boss=enemyTemplates()[s.bossType].id;
        return `<div class="stage-card ${stage==n?'sel':''}" role="button" tabindex="0" aria-pressed="${stage==n}" onclick="setStage(${n})" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();setStage(${n})}"><h3>${s.name}</h3><p>${s.desc}</p><div class="stage-roster">${s.enemies.map(id=>`<figure class="${id===boss?'boss':''}" title="${ENEMY_NAMES[id]}"><img src="assets/enemies/${id}/static.png" alt="${ENEMY_NAMES[id]}" loading="lazy" decoding="async" draggable="false"><figcaption>${ENEMY_NAMES[id]}</figcaption></figure>`).join('')}</div><p class="stage-meta">บอส: <b>${ENEMY_NAMES[boss]}</b> · ปรากฏที่ ${s.bossAt} วินาที</p></div>`
    }).join('');
    document.getElementById('stageTeam').innerHTML=team.map(id=>{
        const x=heroes.find(h=>h.id===id);
        return x?`<figure class="r${x.star}" style="--fc:${facColor(x.f)}">${portrait(x, '')}<figcaption>${x.name}</figcaption></figure>`:''
    }).join('')
}
/* Enemy abilities. Deterministic on purpose: no random draws, so they can never separate combat from visuals. */
const ENEMY_KITS={
    ta:{first:3, interval:9, radius:150, buffTime:4, castHold:.4},
    advisor:{everyHits:3, weakTime:3, weakImmune:6},
    exammaster:{first:7, zones:[1, 2, 3], gap:[10, 8, 7], warn:1.5, radius:70, dmg:115}
};
function enemyKit(u, dt){
    const b=battle;
    if(u.kit==='ta'){
        const K=ENEMY_KITS.ta;
        u.kitT=(u.kitT===undefined?K.first:u.kitT)-dt;
        if(u.kitT<=0){
            let n=0;
            for(const e of b.enemies)if(e.alive&&e!==u&&Math.abs(e.x-u.x)<K.radius){
                e.buff=K.buffTime;
                n++
            }
            if(n){
                u.kitT=K.interval;
                u.skillT=SKILL_DUR;
                u.castHold=K.castHold;
                burst(u.x, u.y-20, '#52d49a', 12)
            }
            else u.kitT=1.5
        }
    }
}
function examMasterPhase(u, dt){
    const b=battle, K=ENEMY_KITS.exammaster, r=u.hp/u.maxHp;
    if(r<.25&&u.phase<3){
        u.phase=3;
        u.atk*=1.2;
        u.areaTimer=Math.min(u.areaTimer, 2);
        notice('Exam Master · Final Bell ระวังพื้นที่โจมตีหลายจุด')
    }
    else if(r<.6&&u.phase<2){
        u.phase=2;
        u.areaTimer=Math.min(u.areaTimer, 2.5);
        notice('Exam Master · Proctor Mode พื้นที่โจมตีมากขึ้น')
    }
    u.areaTimer-=dt;
    if(u.areaTimer<=0){
        const zones=K.zones[u.phase-1], front=b.units.filter(a=>a.alive).sort((p, q)=>q.x-p.x), xs=[];
        for(let i=0; i<zones; i++){
            let x=front.length?front[Math.min(i*2, front.length-1)].x:300+i*160;
            for(const used of xs)if(Math.abs(used-x)<K.radius)x=used+K.radius*(x>=used?1:-1);
            xs.push(Math.max(120, Math.min(900, x)))
        }
        for(const x of xs)b.warnings.push({
            x, t:K.warn, r:K.radius, dmg:K.dmg, color:'#a35bff', icon:'⚠'
        });
        u.skillT=SKILL_DUR;
        u.castHold=.7;
        u.areaTimer=K.gap[u.phase-1];
        burst(u.x, u.y-30, '#a35bff', 14)
    }
}
function enemyImpact(a, t){
    const c=typeof ENEMY_ANIMS!=='undefined'&&ENEMY_ANIMS[a.id];
    if(c&&c.fx)fxBurst(t.x, t.y-18, c.fx.color, 7, 3)
}
/* a boss death plays longer than the 0.7s a normal corpse stays */
function deathLife(id){
    const c=typeof ENEMY_ANIMS!=='undefined'&&ENEMY_ANIMS[id], d=c&&c.anims&&c.anims.death;
    return d&&d.frameCount/d.frameRate>.7?d.frameCount/d.frameRate+.05:0
}
function spawnEnemy(type){
    const templates=enemyTemplates();
    const h=templates[type];
    const u=makeUnit(h, false, 968-crand()*15);
    bumpEnemy(u);
    if(type==='boss'){
        u.phase=1;
        u.rainTimer=0
    }
    if(h.kit){
        u.kit=h.kit;
        if(h.kit==='exammaster'){
            u.phase=1;
            u.areaTimer=ENEMY_KITS.exammaster.first
        }
    }
    const sc=STAGES[battle.stage||1].scale;
    if(sc){
        u.hp=u.maxHp=Math.round(h.hp*sc.hp);
        u.atk=Math.round(h.atk*sc.atk)
    }
    battle.enemies.push(u);
    if(type==='boss')notice('Final Exam Boss ปรากฏตัว');
    if(h.kit==='exammaster')notice('Exam Master ปรากฏตัว · ระวังวงเตือนบนพื้น')
}
function bumpEnemy(u){
    u.y=326+(crand()-.5)*25
}
function burst(x, y, color, n=12){
    fxBurst(x, y, color, n, 3)
}
function beam(a, z, color){
    if(!battle||battle.trails.length>90)return;
    battle.trails.push({
        x:a.x, y:a.y-19, tx:z.x, ty:z.y-19, color, life:.17, max:.17
    })
}
function upgradeIncome(){
    const b=battle;
    if(!b||b.ended||b.paused||b.level>=6||b.at<b.upgrade)return;
    b.at-=b.upgrade;
    b.level++;
    b.income=Math.round(b.income*1.42);
    b.upgrade=Math.round(b.upgrade*1.7);
    notice('AT Generation Lv.'+b.level)
}
function baseSkill(){
    const b=battle;
    if(!b||b.ended||b.paused||b.baseCd>0)return false;
    const L=FACULTY_LASER, v=laserVfx(faculty);
    b.baseCd=L.cooldown;
    for(const e of [...b.enemies]){
        if(e.alive){
            damage(e, L.damage, '__laser__');
            burst(e.x, e.y, v.color, 15)
        }
    }
    b.laser={
        t:L.beamTime, max:L.beamTime, color:v.color, style:v.particleStyle
    };
    fxShake(3);
    fxBurst(150, 318, v.color, 10, 3);
    notice('Faculty Laser · '+L.damage+' damage');
    return true
}
/* AUTO PLAY: a player-input automation layer, not a buff. It only calls the same actions a human uses (deploy, upgradeIncome,
   baseSkill), so every rule (AT, cost, cooldown, unit cap, laser cooldown) is enforced by those functions. Deterministic rules on
   observable state, evaluated every AUTO.interval seconds of SIMULATION time (so pause and 2x speed behave); no random draws.
   The ultimate stays manual. */
const AUTO={
    on:false, laser:true, upgrade:true, ult:true, interval:.25
};
const AUTO_BASE_X=135, AUTO_FRONT=new Set(['tank', 'shield', 'pierce', 'dash']), AUTO_DPS=new Set(['ranged', 'aoe', 'poison', 'slow', 'pierce', 'summon']), AUTO_HEAL=new Set(['heal', 'massheal']);
function autoTick(dt){
    const b=battle;
    b.autoT=(b.autoT||0)+dt;
    b.autoUltT=b.ult>=100?(b.autoUltT||0)+dt:0;
    for(let n=0; n<2&&b.autoT>=AUTO.interval; n++){
        b.autoT-=AUTO.interval;
        autoDecide()
    }
    if(b.autoT>AUTO.interval)b.autoT=AUTO.interval
}
function autoState(){
    const b=battle, foes=b.enemies.filter(e=>e.alive), mine=b.units.filter(a=>a.alive);
    let nearest=Infinity, clustered=0;
    for(const e of foes){
        nearest=Math.min(nearest, e.x);
        clustered=Math.max(clustered, foes.filter(o=>Math.abs(o.x-e.x)<110).length)
    }
    const gap=foes.length?nearest-AUTO_BASE_X:Infinity;
    return{
        foes, mine, gap, clustered, threat:gap<260, danger:gap<160, boss:foes.some(e=>e.type==='boss'), bigFoe:foes.some(e=>e.hp>1000),
        ranged:foes.filter(e=>e.range>RANGED_MIN).length, injured:mine.filter(a=>a.hp<a.maxHp*.65).length,
        hurtFront:mine.some(a=>AUTO_FRONT.has(a.type)&&a.hp<a.maxHp*.5), front:mine.filter(a=>AUTO_FRONT.has(a.type)).length,
        healers:mine.filter(a=>AUTO_HEAL.has(a.type)).length, engaged:foes.filter(e=>mine.some(a=>Math.abs(a.x-e.x)<150)).length
    }
}
function autoScore(h, S){
    const t=h.type, have=S.mine.filter(a=>(a.owner||a.id)===h.id).length;
    let s=h.star*6;
    if(AUTO_FRONT.has(t))s+=S.front<Math.max(1, Math.ceil(S.foes.length/3)+(S.boss?1:0))?38:6;
    if(AUTO_DPS.has(t)){
        s+=24;
        if(t==='aoe'&&S.clustered>=3)s+=16;
        if(t==='poison'&&(S.boss||S.bigFoe))s+=12;
        if(t==='slow'&&S.foes.length>=3)s+=10;
        if(t==='pierce'&&S.clustered>=2)s+=8;
        if(S.boss&&(t==='aoe'||t==='pierce'||t==='poison'))s+=8
    }
    if(AUTO_HEAL.has(t)){
        s+=S.injured>=2||S.hurtFront?44:(S.healers<1&&S.mine.length>=4?18:-30);
        if(S.healers>=2)s-=20
    }
    if(t==='income')s+=battle.t<80?14:2;
    if(S.threat){
        if(AUTO_FRONT.has(t))s+=20;
        s+=(500-h.cost)/12
    }
    return s-Math.min(36, have*9)
}
function autoPick(S){
    const b=battle;
    if(b.units.length>=35)return null;
    const ready=team.map(id=>heroes.find(x=>x.id===id)).filter(x=>x&&b.cd[x.id]<=0);
    const scored=ready.map((x, i)=>({
        h:x, s:autoScore(x, S), i
    })).sort((p, q)=>q.s-p.s||p.i-q.i);
    const ok=scored.filter(c=>b.at>=c.h.cost);
    if(!ok.length)return null;
    /* save AT for a clearly better unit that is within reach (up to ~25 s of income), but never while enemies are close to the base (threat or approaching within 420 px), when AT is nearly full or with fewer than 2 units out */
    const top=scored[0];
    if(!S.threat&&!(S.gap<420)&&b.at<b.maxAt-40&&top.h.cost>b.at&&(top.h.cost-b.at)/b.income<=25&&top.s>ok[0].s+10&&S.mine.length>=2)return null;
    /* variety guard: after four deployments of the same hero in a row, wait (up to 8 s) for a different ready hero instead of repeating it */
    const recent=b.autoRecent||[];
    if(!S.danger&&recent.length>=4&&recent.slice(-4).every(id=>id===ok[0].h.id)){
        const alt=scored.find(c=>c.h.id!==ok[0].h.id&&c.h.cost>b.at&&(c.h.cost-b.at)/b.income<=8);
        if(alt)return null
    }
    return ok[0].h
}
function autoWantsUpgrade(S){
    const b=battle;
    if(!AUTO.upgrade||b.level>=6||b.at<b.upgrade||S.threat||S.mine.length<2)return false;
    const remain=Math.max(0, STAGES[b.stage||1].bossAt+75-b.t);
    if(b.upgrade/(b.income*.42)>remain*.7)return false;
    const approaching=S.foes.length&&S.gap<620;
    return b.at-b.upgrade>=(approaching?120:0)
}
function autoWantsLaser(S){
    const b=battle;
    if(!AUTO.laser||b.baseCd>0||!S.foes.length)return false;
    const dmg=FACULTY_LASER.damage;
    let value=0, kills=0;
    for(const e of S.foes){
        const left=e.hp+(e.shield||0);
        value+=Math.min(dmg, left);
        if(left<=dmg)kills++
    }
    return S.danger&&value>=300||S.threat&&value>=dmg*2||value>=dmg*3||kills>=2
}
/* Auto Ultimate. Rules per ultimate, on observable state only. The meter (100) is the only cost and useUltimate() enforces it,
   pause and the end of the battle. Rule inputs: S = autoState(), held = seconds the meter has been full. After 25 s of holding a
   full meter the bar for a fire is lowered (a full meter gains nothing, so waiting longer wastes the damage that would fill it).
   Game today has three ultimates: a damage sweep, a stun and a slow. There is no healing or buff ultimate, so there is no
   "heal" or "support" rule; a future ultimate must add its own entry here or it stays manual. */
const AUTO_ULT_RULES={
    shuttle:(S, held)=>{
        let value=0, kills=0;
        for(const e of S.foes){
            const left=e.hp+(e.shield||0);
            value+=Math.min(300, left);
            if(left<=300)kills++
        }
        return S.danger&&value>=200||S.foes.length>=3&&value>=700||kills>=3||S.boss&&S.foes.length>=2&&value>=500||held>25&&S.foes.length>=2&&value>=400
    }, wifi:(S, held)=>{
        const n=S.foes.length;
        return S.danger||S.threat&&n>=2||S.hurtFront&&S.engaged>=3||S.boss&&S.engaged>=1&&S.injured>=1||held>25&&S.engaged>=2
    }, rain:(S, held)=>{
        const n=S.foes.length;
        return n>=4&&S.gap<620||S.threat&&n>=2||S.boss&&S.gap<620||held>25&&n>=2
    }
};
function autoWantsUlt(S){
    const b=battle, rule=AUTO_ULT_RULES[ultType];
    if(!AUTO.ult||!rule||b.ult<100||!S.foes.length)return false;
    return rule(S, b.autoUltT||0)
}
function autoDecide(){
    const b=battle;
    if(!b||b.ended||b.paused)return;
    const S=autoState();
    if(autoWantsLaser(S))baseSkill();
    if(autoWantsUlt(S))useUltimate();
    if(autoWantsUpgrade(S)){
        const lv=b.level;
        upgradeIncome();
        if(b.level>lv)return
    }
    const pick=autoPick(S);
    if(pick){
        const n=b.units.length;
        deploy(pick.id);
        if(b.units.length>n){
            (b.autoRecent=b.autoRecent||[]).push(pick.id);
            if(b.autoRecent.length>6)b.autoRecent.shift()
        }
        if(b.units.length>n&&b.floaters.length<90){
            const u=b.units[b.units.length-1];
            b.floaters.push({
                x:u.x, y:u.y-58, txt:'AUTO', life:.7, color:'#ffe066'
            })
        }
    }
}
function renderAuto(){
    const bt=document.getElementById('autoBtn');
    if(!bt)return;
    bt.textContent=AUTO.on?'Auto: เปิด':'Auto: ปิด';
    bt.classList.toggle('green', AUTO.on);
    bt.classList.toggle('secondary', !AUTO.on);
    bt.ariaPressed=String(AUTO.on);
    document.getElementById('autoOpts').classList.toggle('hidden', !AUTO.on);
    document.getElementById('autoLaserBtn').classList.toggle('on', AUTO.laser);
    document.getElementById('autoUpgBtn').classList.toggle('on', AUTO.upgrade);
    document.getElementById('autoUltBtn').classList.toggle('on', AUTO.ult);
    document.getElementById('autoUltBtn').ariaPressed=String(AUTO.ult);
    document.getElementById('autoLaserBtn').ariaPressed=String(AUTO.laser);
    document.getElementById('autoUpgBtn').ariaPressed=String(AUTO.upgrade)
}
function toggleAuto(){
    AUTO.on=!AUTO.on;
    if(battle){
        battle.autoT=0;
        if(!battle.ended)notice(AUTO.on?'Auto เปิด · ใช้กฎเดียวกับผู้เล่น':'Auto ปิด · เล่นเอง')
    }
    renderAuto()
}
function setAutoOpt(k){
    if(k!=='laser'&&k!=='upgrade'&&k!=='ult')return;
    AUTO[k]=!AUTO[k];
    renderAuto()
}
function useUltimate(){
    const b=battle;
    if(!b||b.ended||b.paused||b.ult<100)return false;
    b.ult=0;
    b.ultFires=(b.ultFires||0)+1;
    if(ultType==='wifi'){
        for(const e of b.enemies){
            e.stun=3;
            burst(e.x, e.y-20, '#8fe3ff', 10)
        }
        notice('Wi-Fi Down · ศัตรูสตัน 3 วินาที')
    }
    else if(ultType==='rain'){
        b.rain=12;
        notice('Salaya Rain · ศัตรูช้าลง 40%')
    }
    else{
        b.shuttle={
            x:80, hit:new Set()
        };
        notice('Campus Shuttle มาแล้ว')
    }
    return true
}
function bossPhase(u, dt){
    if(u.kit==='exammaster')return examMasterPhase(u, dt);
    const r=u.hp/u.maxHp;
    if(r<.2&&u.phase<3){
        u.phase=3;
        u.rainTimer=Math.min(u.rainTimer||0, .5);
        u.atk*=1.3;
        u.interval*=.5;
        notice('Overtime · บอสโกรธ โจมตีเร็วและแรงขึ้น')
    }
    else if(r<.5&&u.phase<2){
        u.phase=2;
        u.rainTimer=.5;
        notice('Exam Paper Rain · ระวังกระดาษข้อสอบ')
    }
    if(u.phase>=2){
        u.rainTimer-=dt;
        if(u.rainTimer<=0){
            for(let i=0; i<3; i++)battle.warnings.push({
                x:150+i*180+crand()*100, t:1
            });
            u.skillT=SKILL_DUR;
            u.rainTimer=6
        }
    }
}
function updateWarnings(dt){
    const b=battle;
    if(b.warnings.length&&!b.enemies.some(e=>e.alive&&e.type==='boss')){
        b.warnings=[];
        return
    }
    for(const w of b.warnings){
        w.t-=dt;
        if(w.t<=0){
            for(const a of b.units)if(a.alive&&Math.abs(a.x-w.x)<(w.r||60))damage(a, w.dmg||160, 'boss');
            burst(w.x, 330, w.color||'#ff6b6b', 14);
            if(w.r)fxShake(2)
        }
    }
    b.warnings=b.warnings.filter(w=>w.t>0)
}
function chooseUlt(id){
    ultType=id;
    renderTeam()
}
function togglePause(){
    if(!battle||battle.ended)return;
    battle.paused=!battle.paused;
    document.getElementById('pauseBtn').textContent=battle.paused?'ต่อ':'หยุด'
}
function speedToggle(){
    if(!battle)return;
    battle.speed=battle.speed===1?2:1;
    document.getElementById('speedBtn').textContent=battle.speed+'×'
}
function damage(u, amt, sourceId=null){
    if(!u.alive)return 0;
    let n=amt;
    if(u.shield>0){
        const block=Math.min(n, u.shield);
        u.shield-=block;
        n-=block;
        absorbShield(u, block)
    }
    const actual=Math.max(0, Math.min(u.hp, n));
    u.hp-=n;
    const feedsUlt=sourceId!=='__ult__'&&sourceId!=='__base__'&&sourceId!=='__laser__';
    if(battle&&feedsUlt)battle.ult=Math.min(100, battle.ult+(u.ally?actual/60:actual/80));
    if(battle&&!u.ally&&sourceId)CombatStats.recordDamage(sourceId, actual);
    u.hit=.15;
    if(actual>0&&u.hurtCd<=0){
        u.hurtT=.25;
        u.hurtCd=.6
    }
    if(n>0&&battle.floaters.length<90)battle.floaters.push({
        x:u.x+(crand()-.5)*15, y:u.y-45, txt:String(Math.round(n)), life:.65, color:u.ally?'#ffbdc5':'#fff5a4'
    });
    if(u.hp<=0){
        u.alive=false;
        if(spriteReady(u.id)){
            const cp={
                id:u.id, x:u.x, y:u.y, ally:u.ally, t:0
            }, dl=deathLife(u.id);
            if(dl)cp.life=dl;
            battle.corpses.push(cp)
        }
        burst(u.x, u.y, u.ally?'#8ee6ff':'#ff8d8d', 15);
        if(!u.ally){
            battle.kills++;
            if(feedsUlt)battle.ult=Math.min(100, battle.ult+3);
            if(u.type==='boss'){
                const S=STAGES[battle.stage||1];
                if(!battle.enemies.some(e=>e!==u&&e.alive&&e.type==='boss')&&!(S.bossType2&&!battle.boss2Spawned))battle.bossDead=true;
                fxShake(3)
            }
        }
    }
    return actual
}
function update(dt){
    const b=battle;
    if(!b||b.ended||b.paused)return;
    dt=Math.min(dt, .06)*b.speed;
    b.t+=dt;
    b.at=Math.min(b.maxAt, b.at+b.income*dt);
    b.baseCd=Math.max(0, b.baseCd-dt);
    b.rain=Math.max(0, b.rain-dt);
    b.shake=Math.max(0, b.shake-dt*20);
    if(b.laser){
        b.laser.t-=dt;
        if(b.laser.t<=0)b.laser=null
    }
    for(const e of b.enemies)if(e.alive&&e.type==='boss')bossPhase(e, dt);
    updateWarnings(dt);
    if(b.shuttle){
        const s=b.shuttle;
        s.x+=700*dt;
        for(const e of b.enemies){
            if(e.alive&&!s.hit.has(e)&&e.x<=s.x){
                s.hit.add(e);
                damage(e, 300, '__ult__');
                e.x=Math.min(1025, e.x+120);
                burst(e.x, e.y-20, '#ffd45a', 10)
            }
        }
        if(s.x>1100)b.shuttle=null
    }
    b.noticeTime=Math.max(0, b.noticeTime-dt);
    if(b.flash){
        b.flash.t-=dt;
        if(b.flash.t<=0)b.flash=null
    }
    for(const id of team)b.cd[id]=Math.max(0, b.cd[id]-dt);
    b.enemyTimer-=dt;
    if(b.enemyTimer<=0){
        const r=crand(), S=STAGES[b.stage||1];
        spawnEnemy(S.pick(b.t, r));
        b.enemyTimer=S.gap(b.t)
    }
    const BS=STAGES[b.stage||1];
    if(b.t>=BS.bossAt&&!b.bossSpawned){
        b.bossSpawned=true;
        spawnEnemy(BS.bossType)
    }
    if(BS.bossType2&&b.t>=BS.bossAt2&&!b.boss2Spawned){
        b.boss2Spawned=true;
        spawnEnemy(BS.bossType2)
    }
    if(AUTO.on)autoTick(dt);
    for(const u of [...b.units, ...b.enemies]){
        if(!u.alive)continue;
        u.moved=Math.abs(u.x-u.px)>.01;
        u.px=u.x;
        u.atkT=Math.max(0, u.atkT-dt);
        u.skillT=Math.max(0, u.skillT-dt);
        u.hurtT=Math.max(0, u.hurtT-dt);
        u.hurtCd=Math.max(0, u.hurtCd-dt);
        u.flashT=Math.max(0, (u.flashT||0)-dt);
        advanceAnim(u, dt);
        u.cd-=dt;
        u.hit=Math.max(0, u.hit-dt);
        u.walk+=dt*8;
        u.cast=Math.max(0, u.cast-dt);
        u.fx=Math.max(0, u.fx-dt);
        u.slow=Math.max(0, u.slow-dt);
        if(u.buff>0)u.buff-=dt;
        if(u.weak>0)u.weak-=dt;
        if(u.weakImm>0)u.weakImm-=dt;
        if(u.poison>0){
            u.poison-=dt;
            damage(u, 13*dt, u.poisonSource||null)
        }
        if(!u.alive)continue;
        u.stun=Math.max(0, u.stun-dt);
        if(u.stun>0){
            u.pend.length=0;
            u.atkT=0;
            u.skillT=0;
            continue
        }
        if(u.pend.length){
            for(const p of u.pend)p.t-=dt;
            const due=u.pend.filter(p=>p.t<=0);
            u.pend=u.pend.filter(p=>p.t>0);
            for(const p of due)resolvePend(u, p)
        }
        if(!u.ally&&u.kit){
            enemyKit(u, dt);
            if(u.castHold>0){
                u.castHold-=dt;
                continue
            }
        }
        const foes=u.ally?b.enemies:b.units;
        const direction=u.ally?1:-1;
        let target=null, dist=Infinity;
        for(const e of foes){
            if(!e.alive)continue;
            const d=(e.x-u.x)*direction;
            if(d>=-10&&d<dist){
                target=e;
                dist=d
            }
        }
        if(u.type==='heal'||u.type==='massheal'){
            const injured=b.units.filter(a=>a.alive&&a.hp<a.maxHp&&Math.abs(a.x-u.x)<u.range);
            if(injured.length&&u.cd<=0){
                u.pend.push({
                    t:HEAL_DELAY, kind:'heal'
                });
                triggerSkill(u);
                u.cd=u.interval
            }
            else if(dist>95)u.x+=direction*u.spd*dt;
            continue
        }
        if(u.type==='summon'){
            u.summon-=dt;
            if(u.summon<=0&&b.units.length<35){
                u.pend.push({
                    t:SUMMON_DELAY, kind:'summon'
                });
                triggerSkill(u);
                u.summon=10
            }
        }
        if(u.type==='shield'){
            for(const a of b.units)if(a.alive&&Math.abs(a.x-u.x)<100)addShield(a, u.id, 9*dt, 180);
            u.pulseT=(u.pulseT===undefined?0:u.pulseT)-dt;
            if(u.pulseT<=0){
                triggerSkill(u);
                u.pulseT=8
            }
        }
        const slow=(u.slow>0?.55:1)*(!u.ally&&b.rain>0?.6:1)*(u.buff>0?1.25:1);
        if(target&&dist<=u.range){
            if(u.cd<=0){
                let val=u.atk;
                if(u.type==='ranged'&&u.ally){
                    const prevStack=u.stack;
                    u.stack=u.lastTarget===target?Math.min(8, u.stack+1):0;
                    if(u.stack===8&&prevStack<8)triggerSkill(u);
                    u.lastTarget=target;
                    val*=1+u.stack*.09
                }
                if(u.type==='pierce')val+=40;
                if(u.type==='tank'&&u.ally)val*=.85;
                if(u.ally)val*=b.syn.dmgFor(u.id);
                if(u.weak>0)val*=.75;
                startAttack(u, target, val);
                u.cd=u.interval*(u.slow>0?1.35:1)*(!u.ally&&b.rain>0?1/.6:1)*(u.type==='ranged'&&u.ally?1-u.stack*.035:1)*(u.buff>0?1/1.2:1)
            }
        }
        else if(target&&dist>u.range){
            u.x+=direction*u.spd*slow*dt
        }
        else{
            const baseX=u.ally?963:135;
            if((baseX-u.x)*direction>u.range){
                u.x+=direction*u.spd*slow*dt
            }
            else if(u.cd<=0){
                u.pend.push({
                    t:IMPACT_DELAY, kind:'base'
                });
                u.atkT=.5;
                u.cd=u.interval
            }
        }
        u.x=Math.max(80, Math.min(1025, u.x))
    }
    updateProjectiles(dt);
    b.units=b.units.filter(u=>u.alive);
    b.enemies=b.enemies.filter(u=>u.alive);
    for(const c of b.corpses)c.t+=dt;
    b.corpses=b.corpses.filter(c=>c.t<(c.life||.7));
    updateFx(dt);
    for(const f of b.floaters){
        f.y-=28*dt;
        f.life-=dt
    }
    b.floaters=b.floaters.filter(f=>f.life>0);
    for(const t of b.trails)t.life-=dt;
    b.trails=b.trails.filter(t=>t.life>0);
    if(b.baseHp<=0)finish(false);
    else if(b.enemyHp<=0)finish(true);
    if(b.t>300)finish(false)
}
function finish(win){
    battle.ended=true;
    battle.finalStats={
        rows:CombatStats.getAllCharacterStats().map(r=>({
            ...r
        })), time:battle.t, laserDamage:CombatStats.laserDamage, ultDamage:CombatStats.ultDamage
    };
    renderStatsPanel(true);
    renderResultStats();
    document.getElementById('result').classList.toggle('win', !!win);
    document.getElementById('result').classList.toggle('lose', !win);
    document.getElementById('resultTitle').textContent=win?'ชนะแล้ว':'แพ้';
    document.getElementById('resultDesc').textContent=`${fdata()[1]} · เวลา ${Math.floor(battle.t)} วินาที · กำจัด ${battle.kills} ตัว · Deploy ${battle.deployed} ครั้ง`;
    show('result')
}
function rect(x, y, w, h, color){
    ctx.fillStyle=color;
    ctx.fillRect(x, y, w, h)
}
function text(s, x, y, size=18, color='#fff', align='center'){
    ctx.font=`bold ${size}px system-ui`;
    ctx.textAlign=align;
    ctx.fillStyle=color;
    ctx.fillText(s, x, y)
}
function rounded(x, y, w, h, r, c){
    ctx.fillStyle=c;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
    ctx.fill()
}
function draw(){
    if(screen!=='battle'||!battle)return;
    const b=battle, sh=fxLevel==='full'?b.shake:0;
    ctx.save();
    if(sh>0)ctx.translate(Math.round((vrand()-.5)*sh*2), Math.round((vrand()-.5)*sh*2));
    drawScene(b);
    ctx.restore();
    if(b.flash&&fxLevel!=='off'){
        ctx.save();
        ctx.globalAlpha=b.flash.alpha*Math.max(0, b.flash.t/b.flash.d);
        ctx.fillStyle=b.flash.color;
        ctx.fillRect(0, 0, 1100, 440);
        ctx.restore()
    }
    if(DEBUG_ANIM&&FALLBACK_LOG.length){
        ctx.font='12px monospace';
        ctx.textAlign='left';
        ctx.fillStyle='#ffe08b';
        FALLBACK_LOG.slice(-4).forEach((f, i)=>ctx.fillText('fallback '+f.id+'.'+f.state+' -> '+f.using, 8, 64+i*14))
    }
}
function drawScene(b){
    const sky=ctx.createLinearGradient(0, 0, 0, 440);
    sky.addColorStop(0, '#75c4ff');
    sky.addColorStop(1, '#d9edff');
    rect(0, 0, 1100, 440, sky);
    ctx.fillStyle='#e6f5ff';
    for(let i=0; i<9; i++){
        const x=i*153+45;
        ctx.beginPath();
        ctx.ellipse(x, 70+(i%3)*19, 60, 18, 0, 0, Math.PI*2);
        ctx.fill()
    }
    rect(0, 235, 1100, 112, '#a9c7d0');
    for(let i=0; i<10; i++){
        const x=i*125;
        rect(x, 220, 85, 125, i%2?'#c7d9e8':'#a8c6dc');
        rect(x+14, 245, 16, 23, '#5c91b2');
        rect(x+48, 245, 16, 23, '#5c91b2')
    }
    rect(0, 344, 1100, 96, '#c2c7c9');
    rect(0, 344, 1100, 6, '#faf1d5');
    for(let x=0; x<1100; x+=90)rect(x, 394, 45, 4, '#e6e7d5');
    for(let i=0; i<7; i++){
        const x=i*175+60;
        rect(x, 215, 10, 129, '#6b7e68');
        ctx.fillStyle='#5ca96d';
        ctx.beginPath();
        ctx.arc(x+5, 214, 38, 0, Math.PI*2);
        ctx.fill()
    }
    drawBase(35, 240, true);
    drawBase(975, 240, false);
    for(const c of b.corpses)drawSpriteFrame(c.id, 'death', c.t, c.x, c.y, c.ally);
    for(const u of [...b.enemies, ...b.units].sort((a, c)=>a.y-c.y))drawUnit(u);
    for(const p of b.projectiles)drawProjectile(p, b);
    drawLaser(b);
    if(b.shuttle){
        ctx.font='72px system-ui';
        ctx.textAlign='center';
        ctx.fillStyle='#fff';
        ctx.fillText('🚌', b.shuttle.x, 365)
    }
    if(b.rain>0){
        ctx.fillStyle='#4a78b844';
        ctx.fillRect(0, 0, 1100, 440)
    }
    for(const w of b.warnings){
        const p=1-Math.max(0, w.t);
        ctx.save();
        ctx.globalAlpha=.35+.35*Math.sin(b.t*18);
        ctx.fillStyle=w.color||'#ff3b3b';
        ctx.beginPath();
        ctx.ellipse(w.x, 335, (w.r||60)*(.6+.4*p), 22, 0, 0, Math.PI*2);
        ctx.fill();
        if(w.r){
            ctx.strokeStyle=w.color||'#ff3b3b';
            ctx.lineWidth=3;
            ctx.beginPath();
            ctx.ellipse(w.x, 335, w.r, 24, 0, 0, Math.PI*2);
            ctx.stroke()
        }
        ctx.restore();
        ctx.font='22px system-ui';
        ctx.textAlign='center';
        ctx.fillText(w.icon||'📝', w.x, 300-60*Math.max(0, w.t))
    }
    for(const t of b.trails){
        ctx.save();
        ctx.globalAlpha=Math.max(0, t.life/t.max)*.8;
        ctx.strokeStyle=t.color;
        ctx.shadowColor=t.color;
        ctx.shadowBlur=22;
        ctx.lineWidth=5;
        ctx.beginPath();
        ctx.moveTo(t.x, t.y);
        ctx.lineTo(t.tx, t.ty);
        ctx.stroke();
        ctx.restore()
    }
    for(const p of b.particles){
        ctx.globalAlpha=p.life/p.max>.3?1:.55;
        ctx.fillStyle=p.color;
        ctx.fillRect(Math.round(p.x), Math.round(p.y), p.size, p.size)
    }
    ctx.globalAlpha=1;
    for(const f of b.floaters){
        ctx.save();
        ctx.globalAlpha=Math.min(1, f.life*2);
        ctx.shadowColor='#132746';
        ctx.shadowBlur=4;
        text(f.txt, f.x, f.y, 16, f.color);
        ctx.restore()
    }
    if(b.noticeTime>0){
        rounded(310, 77, 480, 35, 12, '#183967c9');
        text(b.notice, 550, 100, 17, '#fff1aa')
    }
    if(b.paused){
        rounded(350, 150, 400, 120, 20, '#0b1837df');
        text('⏸ PAUSED', 550, 222, 38)
    }
}
/* enemy projectiles are drawn by style (ENEMY_ANIMS[id].fx.proj); enemies shoot to the left, so tips point left. Deterministic: no random draws. */
function drawProjectile(p, b){
    const c=!p.a.ally&&typeof ENEMY_ANIMS!=='undefined'&&ENEMY_ANIMS[p.a.id], kind=c&&c.fx&&c.fx.proj, px=Math.round(p.x), py=Math.round(p.y);
    if(!kind){
        rect(px-3, py-3, 6, 6, p.color);
        rect(px-(p.a.ally?9:-5), py-1, 4, 2, p.color);
        return
    }
    const flip=Math.floor(b.t*16)%2;
    if(kind==='pen'){
        rect(px-6, py-1, 10, 3, '#b3122c');
        rect(px-6, py-1, 10, 1, '#ff6b7a');
        rect(px-9, py-1, 3, 3, '#1b1a33');
        rect(px+4, py-1, 2, 3, '#c9ccdc')
    }
    else if(kind==='pencil'){
        rect(px-6, py-1, 12, 3, '#ffcf3a');
        rect(px-6, py-1, 12, 1, '#fff0a0');
        rect(px+6, py-1, 3, 3, '#ff7aa8');
        rect(px-9, py-1, 3, 3, '#e8c28a');
        rect(px-11, py, 2, 1, '#2b2b3a')
    }
    else if(kind==='paper'){
        if(flip){
            rect(px-4, py-3, 8, 6, '#f6f2e8');
            rect(px-3, py-1, 4, 1, '#e0334a')
        }
        else{
            rect(px-3, py-4, 6, 8, '#f6f2e8');
            rect(px-2, py-2, 3, 1, '#e0334a')
        }
    }
    else if(kind==='orb'){
        rect(px-4, py-3, 8, 6, '#7a3fe0');
        rect(px-3, py-4, 6, 8, '#7a3fe0');
        rect(px-2, py-2, 4, 4, '#d2b0ff');
        rect(px+5, py-1, 4, 2, '#8d4cf0');
        rect(px+10, py, 2, 1, '#b88bff')
    }
    else if(kind==='energy'){
        rect(px-6, py-5, 12, 10, '#3a1a7a');
        rect(px-5, py-6, 10, 12, '#3a1a7a');
        rect(px-3, py-3, 6, 6, '#ff6fd0');
        rect(px-1, py-1, 2, 2, '#ffffff');
        rect(px+7, py-2, 6, 4, '#7a3fe0');
        rect(px+14, py-1, 4, 2, '#a35bff')
    }
    else if(kind==='bang'){
        rect(px-5, py-2, 10, 7, '#ffd23a');
        rect(px-3, py-5, 6, 3, '#ffd23a');
        rect(px-1, py-3, 2, 5, '#b3122c');
        rect(px-1, py+3, 2, 1, '#b3122c')
    }
}
const LASER_BMP={
    digital:['101', '010', '101'], sparks:['010', '111', '010'], molecules:['011', '101', '110'], heartbeat:['01010', '11111', '01110', '00100'], notes:['011', '010', '110'], nature:['011', '110', '010'], default:['010', '111', '010']
};
function drawLaser(b){
    const L=b.laser;
    if(!L)return;
    const p=L.t/L.max, x0=150, x1=1060, y=318, th=p>.66?20:p>.33?12:8, top=y-(th>>1), ph=Math.floor(b.t*24), blocks=Math.ceil((x1-x0)/4);
    for(let i=0; i<blocks; i++){
        if(p<.2&&(i&1))continue;
        const x=x0+i*4, w=(i+ph)%7<3?4:0;
        ctx.fillStyle=L.color;
        ctx.fillRect(x, top-w, 4, th+w*2)
    }
    ctx.fillStyle='#ffffff';
    ctx.fillRect(x0, y-2, x1-x0, 4);
    const rows=LASER_BMP[L.style]||LASER_BMP.default, n=fxLevel==='reduced'?6:14;
    ctx.fillStyle=L.color;
    for(let k=0; k<n; k++){
        const bx=x0+((k*83+ph*14)%(x1-x0-20)), by=y-34+((k*37+ph*6)%68);
        rows.forEach((r, j)=>{
            for(let i=0; i<r.length; i++)if(r[i]==='1')ctx.fillRect(bx+i*3, by+j*3, 3, 3)
        })
    }
}
/* Faculty base sprites. Optional 6th field of a faculty entry: {buildingName, sprite, referenceUrl, displayScale, groundOffset}.
   Loaded when the faculty screen is shown; until it is ready (or if it fails) the original drawing is used. */
const BASE_IMGS={};
function baseCfg(f){
    return f&&f[5]&&f[5].sprite?f[5]:null
}
function ensureBase(f){
    const c=baseCfg(f);
    if(!c||BASE_IMGS[f[0]])return;
    const r=BASE_IMGS[f[0]]={img:new Image(), ok:false};
    r.img.onload=()=>{
        r.ok=true
    };
    r.img.onerror=()=>{
        r.ok=false
    };
    r.img.src=c.sprite
}
function baseReady(f){
    const r=baseCfg(f)&&BASE_IMGS[f[0]];
    return r&&r.ok&&r.img.naturalWidth?r.img:null
}
function drawBase(x, y, ally){
    const bf=fdata(), bimg=ally&&baseReady(bf);
    if(bimg){
        const bc=baseCfg(bf), k=bc.displayScale||1, w=bimg.naturalWidth*k, h=bimg.naturalHeight*k;
        ctx.imageSmoothingEnabled=false;
        ctx.drawImage(bimg, Math.round(x-5), Math.round(y+102+(bc.groundOffset||0)-h), w, h);
        return
    }
    const color=ally?fdata()[3]:'#f77986';
    rounded(x, y, 100, 102, 8, ally?'#f0f8ff':'#e6d3e3');
    rect(x+15, y-25, 70, 30, color);
    rect(x+34, y+50, 31, 52, '#446b91');
    for(let i=0; i<3; i++)rect(x+10+i*30, y+12, 17, 22, '#6a9dcc');
    text(ally?fdata()[2]:'📚', x+50, y-2, 28);
    text(ally?faculty:'EXAM', x+50, y+45, 15, '#1c3457')
}
function drawUnitCanvas(u){
    const x=u.x, y=u.y, sz=u.type==='boss'?1.65:u.id==='dog'?.7:1;
    ctx.save();
    ctx.translate(x, y);
    if(!u.ally)ctx.scale(-1, 1);
    ctx.scale(sz, sz);
    const walk=Math.sin(u.walk)*3, action=u.cast>0?7:0;
    ctx.fillStyle='#162b4850';
    ctx.beginPath();
    ctx.ellipse(0, 22, 22, 6, 0, 0, Math.PI*2);
    ctx.fill();
    if(u.fx>0){
        ctx.save();
        ctx.globalAlpha=u.fx/.38*.55;
        ctx.strokeStyle=u.ally?'#7ce9ff':'#ff738a';
        ctx.lineWidth=4;
        ctx.shadowColor=ctx.strokeStyle;
        ctx.shadowBlur=15;
        ctx.beginPath();
        ctx.arc(0, -16, 30+(1-u.fx/.38)*20, 0, Math.PI*2);
        ctx.stroke();
        ctx.restore()
    }
    // School-uniform chibi body, distinct faculty accent, legs and arms
    const accent=({
        'bug':'#49b9fa', 'mecha':'#f5aa38', 'lab':'#b995ff', 'night':'#6ce3a0', 'chem':'#f88cb5', 'animal':'#8dd6a2', 'dental':'#5ab6e5', 'music':'#d07eff', 'runner':'#ff9c52', 'global':'#7ab9ff', 'public':'#59c5a7', 'nurse':'#f4a5bf'
    })[u.id]||(u.ally?'#4bc7e9':'#bd6e83');
    ctx.fillStyle='#253856';
    ctx.fillRect(-10, 12+walk, 7, 12);
    ctx.fillRect(4, 12-walk, 7, 12);
    ctx.fillStyle=u.ally?'#f5f8ff':'#6a5369';
    ctx.beginPath();
    ctx.roundRect(-15, -8, 30, 26, 7);
    ctx.fill();
    ctx.fillStyle=accent;
    ctx.fillRect(-15, 5, 30, 5);
    ctx.strokeStyle=u.ally?'#284a77':'#452f50';
    ctx.lineWidth=5;
    ctx.beginPath();
    ctx.moveTo(-13, -2);
    ctx.lineTo(-21, -1+walk);
    ctx.moveTo(13, -2);
    ctx.lineTo(21, -8-action);
    ctx.stroke();
    ctx.fillStyle=u.ally?'#ffd9bd':'#c7adbf';
    ctx.beginPath();
    ctx.arc(0, -24, 20, 0, Math.PI*2);
    ctx.fill();
    ctx.fillStyle=u.ally?'#253455':'#443047';
    ctx.beginPath();
    ctx.arc(0, -30, 20, Math.PI, Math.PI*2);
    ctx.lineTo(18, -30);
    ctx.lineTo(14, -38);
    ctx.lineTo(6, -34);
    ctx.lineTo(-5, -41);
    ctx.lineTo(-15, -34);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle='#152c4c';
    ctx.beginPath();
    ctx.ellipse(-7, -22, 3.3, 4.5, 0, 0, Math.PI*2);
    ctx.ellipse(7, -22, 3.3, 4.5, 0, 0, Math.PI*2);
    ctx.fill();
    ctx.strokeStyle='#a45c60';
    ctx.lineWidth=1.6;
    ctx.beginPath();
    ctx.arc(0, -16, 4, 0, Math.PI);
    ctx.stroke();
    ctx.font='19px system-ui';
    ctx.textAlign='center';
    ctx.fillText(u.emoji, 21, -2-action);
    if(u.phase===3){
        ctx.globalAlpha=.3;
        ctx.fillStyle='#ff2a2a';
        ctx.beginPath();
        ctx.arc(0, -10, 36, 0, Math.PI*2);
        ctx.fill();
        ctx.globalAlpha=1
    }
    if(u.hit>0){
        ctx.globalAlpha=Math.min(.7, u.hit*4);
        ctx.fillStyle='#fff';
        ctx.beginPath();
        ctx.arc(0, -22, 21, 0, Math.PI*2);
        ctx.fill()
    }
    ctx.restore();
    const w=u.type==='boss'?95:45;
    rect(x-w/2, y-65*sz, w, 6, '#28314b');
    rect(x-w/2, y-65*sz, w*Math.max(0, u.hp/u.maxHp), 6, u.ally?'#50ed9c':'#ff697e');
    if(u.stun>0){
        ctx.font='20px system-ui';
        ctx.textAlign='center';
        ctx.fillText('💫', x, y-72*sz)
    }
    if(u.shield>0){
        ctx.strokeStyle='#66d6ff99';
        ctx.lineWidth=2;
        ctx.beginPath();
        ctx.arc(x, y-17, 31*sz, 0, Math.PI*2);
        ctx.stroke()
    }
}
function updateHud(){
    if(screen!=='battle'||!battle)return;
    const b=battle;
    renderStatsPanel();
    document.getElementById('hpPlayerText').textContent=`${Math.ceil(b.baseHp)} / 5000`;
    document.getElementById('hpPlayerFill').style.width=Math.max(0, 100*b.baseHp/5000)+'%';
    document.getElementById('hpPlayerBar').classList.toggle('low', b.baseHp<1500);
    document.getElementById('hpEnemyText').textContent=`${Math.ceil(b.enemyHp)} / 6500`;
    document.getElementById('hpEnemyFill').style.width=Math.max(0, 100*b.enemyHp/6500)+'%';
    document.getElementById('waveText').textContent=`⏱ ${Math.floor(b.t)}s · ${b.bossSpawned?'BOSS WAVE':'WAVE '+(1+Math.floor(b.t/20))}`;
    document.getElementById('atText').textContent=`AT ${Math.floor(b.at)} / ${b.maxAt}`;
    document.getElementById('atBar').style.width=(100*b.at/b.maxAt)+'%';
    document.getElementById('incomeText').textContent=`+${b.income} AT/s · Lv.${b.level}`;
    document.getElementById('upgradeBtn').textContent=b.level>=6?'MAX AT Lv.6':`Upgrade ${b.upgrade} AT`;
    document.getElementById('upgradeBtn').disabled=b.at<b.upgrade||b.level>=6||b.paused;
    document.getElementById('baseBtn').textContent=b.baseCd>0?`Faculty Laser ${Math.ceil(b.baseCd)}s`:`Faculty Laser พร้อม`;
    document.getElementById('baseBtn').disabled=b.baseCd>0||b.paused;
    document.getElementById('ultBtn').textContent=b.ult>=100?`${stripIcon(ULTIMATES[ultType].name)} พร้อมใช้`:`${stripIcon(ULTIMATES[ultType].name)} ${Math.floor(b.ult)}%`;
    document.getElementById('ultBtn').disabled=b.ult<100||b.paused;
    for(const id of team){
        const h=heroes.find(x=>x.id===id), cd=b.cd[id];
        const el=document.getElementById('card-'+id);
        if(!el)continue;
        el.disabled=b.paused||b.at<h.cost||cd>0||b.units.length>=35;
        document.getElementById('cd-'+id).textContent=cd>0?cd.toFixed(1)+'s':(b.at<h.cost?'ขาด AT':'พร้อม');
        const cdMax=h.cd*b.syn.cdMul, cdf=document.getElementById('cdf-'+id);
        cdf.style.height=cd>0?Math.min(100, 100*cd/cdMax)+'%':'0%';
        cdf.classList.toggle('on', cd>0);
        el.classList.toggle('ready', cd<=0&&b.at>=h.cost);
        el.classList.toggle('cool', cd>0);
        el.classList.toggle('lack', cd<=0&&b.at<h.cost)
    }
    document.getElementById('message').textContent=b.noticeTime>0?b.notice:'เลือกเวลาส่งตัวให้คุ้มค่า AT และรับมือศัตรูแต่ละประเภท'
}
function frame(ts){
    const dt=last?(ts-last)/1000:0;
    last=ts;
    if(screen==='battle'){
        update(dt);
        draw();
        updateHud()
    }
    requestAnimationFrame(frame)
}
try{
    if(localStorage.getItem('fxLevel')==='reduced')fxLevel='reduced'
}
catch(e){
}
requestAnimationFrame(frame);

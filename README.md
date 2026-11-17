# 🎓 MU WAR of Collegian

> A 2D side-scrolling strategy and character-collection game inspired by university life at Mahidol University.

**MU Faculty Rush** เป็นเกมแนว 2D Auto-Battle / Strategy ที่ได้รับแรงบันดาลใจจากเกมแนวส่งยูนิตเข้าต่อสู้อัตโนมัติ เช่น LINE Rangers แต่สร้างระบบ ตัวละคร โลก และเอกลักษณ์ของเกมขึ้นใหม่โดยใช้ธีม **ชีวิตมหาวิทยาลัยและคณะต่าง ๆ ของ Mahidol University**

ผู้เล่นจะเลือก **Faculty** ที่ต้องการสังกัด ซึ่งทำหน้าที่เสมือน Guild/Faction ของผู้เล่น จากนั้นสะสมตัวละครจากคณะต่าง ๆ มาจัดทีมและต่อสู้ในด่านต่าง ๆ

(https://rawinan-txt.github.io/War-of-Collegian/)

---

# 🎮 Core Concept

แนวเกมหลัก:

**2D Side-Scrolling Auto Battle + Strategy + Character Collection + Faculty Community**

Gameplay Loop:

```text
Collect Characters
      ↓
Build Team
      ↓
Enter Stage
      ↓
Generate Money
      ↓
Deploy Characters
      ↓
Automatic Combat
      ↓
Destroy Enemy Base
      ↓
Earn Rewards
      ↓
Upgrade Characters
      ↓
Progress / Faculty Contribution
```

ผู้เล่นไม่ได้ควบคุมตัวละครโดยตรง

ผู้เล่นมีหน้าที่:

- เลือกทีมก่อนเริ่มเกม
- บริหารเงินระหว่าง Battle
- เลือกเวลาปล่อยตัวละคร
- อัปเกรด Income
- เลือกใช้ Ultimate
- วาง Composition ของทีม
- ใช้ Faculty Synergy ให้เหมาะกับด่าน

---

# 🏫 Player Faculty System

เมื่อสร้าง Account ผู้เล่นจะเลือก **Faculty ที่ต้องการสังกัด**

Faculty ทำหน้าที่คล้าย:

```text
Guild
+
Faction
+
Community
```

ตัวอย่าง:

```text
SELECT YOUR FACULTY

💻 ICT
⚙️ Engineering
🧬 Science
🩺 Medicine
💊 Pharmacy
🐾 Veterinary
🎵 Music
🌎 International College
...
```

Faculty ที่ผู้เล่นเลือก **ไม่ได้จำกัดตัวละครที่สามารถใช้ได้**

ตัวอย่าง:

```text
Player Faculty:

💻 ICT

สามารถจัดทีม:

💻 ICT
🩺 Medicine
⚙️ Engineering
🐾 Veterinary
🎵 Music
🧬 Science
```

ผู้เล่นทุกคนสามารถสะสมและใช้งานตัวละครจากทุกคณะได้

---

# 🏰 Faculty = Guild

Faculty เป็นระบบ Community หลักของเกม

สมาชิกของคณะเดียวกันช่วยกันสะสม:

```text
Faculty Points
```

Faculty Points ได้จากกิจกรรม เช่น:

- เล่น Campaign
- Daily Mission
- Weekly Mission
- Defeat Boss
- Event
- Faculty War
- Challenge Mode

ตัวอย่างหน้า Faculty:

```text
╔════════════════════════════╗

          💻 ICT

      FACULTY LEVEL 27

Members
8,421

Faculty Rank
#4

Weekly Points
1,284,920

██████████████░░░

Next Reward
💎 500

╚════════════════════════════╝
```

---

# 🏆 Faculty Ranking

ทุกคณะสามารถแข่งขันกันใน Ranking ประจำสัปดาห์

```text
MU FACULTY LEAGUE

🥇 ICT             3.2M
🥈 Engineering     2.6M
🥉 Science         2.4M
4. Medicine        2.1M
5. Pharmacy        1.9M
```

ระบบ Ranking ไม่ควรใช้จำนวนคะแนนรวมเพียงอย่างเดียว เพราะคณะที่มีผู้เล่นเยอะจะได้เปรียบ

ควรคำนวณจากหลายปัจจัย เช่น:

```text
Active Players
Average Contribution
Faculty Objectives
War Performance
Weekly Challenges
```

---

# ⚔️ Faculty War

การแข่งขันระหว่างคณะ

ตัวอย่าง:

```text
FACULTY WAR

💻 ICT
VS
⚙️ ENGINEERING

18 HOURS LEFT

ICT
██████████████ 57%

ENGINEERING
██████████ 43%
```

Faculty War ในช่วงแรกไม่จำเป็นต้องเป็น Real-Time PvP

ผู้เล่นช่วยคณะด้วยการทำ Mission เช่น:

```text
Defeat Boss
+100 Faculty Points

Clear Hard Stage
+50 Faculty Points

Win Battle
+30 Faculty Points
```

คะแนนของสมาชิกจะรวมเข้าสู่คะแนนของ Faculty

---

# 🏢 Faculty Base

ทุก Faculty มี Base ของตัวเอง

ตัวอย่าง:

```text
💻 ICT BASE

┌─────────────────────┐
│                     │
│    FACULTY HQ       │
│                     │
└─────────────────────┘

🏪 Faculty Shop
🧪 Research
⚔️ Faculty War
👥 Members
🏆 Ranking
🎁 Rewards
```

เมื่อ Faculty Level เพิ่มขึ้น Base สามารถเปลี่ยนรูปลักษณ์ได้

```text
Level 1
Small Room

↓

Level 10
Faculty Building

↓

Level 30
Advanced Campus

↓

Level 50
Faculty HQ
```

Faculty progression เน้น Community และ Cosmetic มากกว่า Combat Advantage

---

# 👥 Character System

ตัวละครทุกตัวมี Faculty ของตัวเอง

ตัวอย่าง:

```text
THE DEBUGGER

Faculty:
💻 ICT

Role:
Ranged / Tech

Rarity:
⭐⭐⭐⭐

Level:
28

HP
1,840

ATK
520

Skill:
STACK OVERFLOW
```

แต่ตัวละคร ICT สามารถใช้โดยผู้เล่นที่อยู่ Medicine, Engineering, Science หรือ Faculty อื่นได้ทั้งหมด

---

# 🎴 Character Properties

ตัวละครแต่ละตัวประกอบด้วย:

```text
Name

Faculty

Rarity

Role

Level

HP

ATK

DEF

Move Speed

Attack Speed

Attack Range

Deploy Cost

Cooldown

Normal Attack

Passive Skill

Active Skill
```

---

# ⭐ Character Rarity

ระบบ Rarity เบื้องต้น:

```text
⭐ Common

⭐⭐ Rare

⭐⭐⭐ Super Rare

⭐⭐⭐⭐ Epic

⭐⭐⭐⭐⭐ Legendary
```

Rarity ไม่ควรเป็นตัวกำหนดความเก่งทั้งหมด

ตัวละครระดับต่ำบางตัวควรยังมีประโยชน์จาก:

- Cost ต่ำ
- Cooldown เร็ว
- Synergy
- Specialized Skill
- Team Composition

---

# 🧩 Faculty Character Identity

แต่ละคณะมี Gameplay Identity ของตัวเอง

ตัวอย่าง:

### 💻 ICT

```text
Tech / Ranged / Control

Hack
Drone
Cooldown
Digital Debuff
```

### ⚙️ Engineering

```text
Tank / Builder

Barrier
Turret
Machine
Defense
```

### 🩺 Medical

```text
Healing / Sustain

Heal
Revive
Emergency Support
```

### 💊 Pharmacy

```text
Buff / Debuff

Potion
Poison
Stat Enhancement
```

### 🧬 Science

```text
AoE / Experimental

Explosion
Element
Lab Technology
```

### 🐾 Veterinary

```text
Summoner

Animal Units
Companion
Swarm
```

### 🎵 Music

```text
Team Support

ATK Buff
Speed Buff
Rhythm Effects
```

### 🏃 Sports

```text
Rush / Bruiser

High Speed
High Stamina
Physical Damage
```

คณะอื่น ๆ จะได้รับ Gameplay Identity ของตัวเองเช่นกัน

---

# 🔗 Faculty Synergy

Character Faculty มีผลกับ Team Building

แต่ **Player Faculty ไม่มี Combat Bonus โดยตรง**

ตัวอย่างทีม:

```text
ICT
ICT
ICT
Medicine
Engineering
Music
```

ปลด:

```text
💻 ICT NETWORK

3 ICT Characters

Cooldown
-8%
```

หรือ:

```text
Medicine
Medicine
Nursing
Pharmacy
Physical Therapy
ICT
```

ปลด:

```text
🏥 HEALTHCARE NETWORK

Healing
+12%
```

สามารถมี Cross-Faculty Synergy ได้ด้วย

ตัวอย่าง:

```text
ICT + Engineering

TECH ALLIANCE

Technology Damage
+10%
```

---

# ⚔️ Battle System

สนามเป็น 2D Side View

```text
PLAYER BASE                              ENEMY BASE

🏢                                         🏢
❤️ 5000                                  ❤️ 5000

     🛡️ →      💻 →       👹 ← 👹

─────────────────────────────────────────────

💰 420 / 1000

[UNIT] [UNIT] [UNIT] [UNIT] [UNIT] [UNIT]

               [ULTIMATE]
```

เป้าหมาย:

> ทำลาย Enemy Base ก่อนที่ Player Base จะถูกทำลาย

---

# 🚶 Unit Behaviour

เมื่อ Spawn ตัวละคร:

```text
Spawn
 ↓
Walk Forward
 ↓
Search Enemy
 ↓
Enemy In Range?
 ↓
Stop
 ↓
Attack
 ↓
Enemy Dies
 ↓
Continue Walking
```

ตัวละครต่อสู้แบบอัตโนมัติ

ผู้เล่นควบคุม Strategy ผ่านการเลือกเวลาปล่อยตัว

---

# 💰 Economy System

เงินเพิ่มอัตโนมัติระหว่าง Battle

ตัวอย่าง:

```text
Money

0 / 500

Income

+10 / second
```

ผู้เล่นสามารถใช้เงินเพื่อ:

```text
Deploy Character

หรือ

Upgrade Income
```

ตัวอย่าง:

```text
Income LV1
+10/sec

↓

Income LV2
+15/sec

↓

Income LV3
+22/sec

↓

Income LV4
+30/sec
```

ทำให้ผู้เล่นต้องตัดสินใจระหว่าง:

> ส่งกองทัพตอนนี้

หรือ

> ลงทุน Economy เพื่อได้เปรียบระยะยาว

---

# ⏱️ Character Cooldown

หลัง Deploy ตัวละคร การ์ดจะติด Cooldown

```text
THE DEBUGGER

Cost:
220

Cooldown:
8 sec
```

ทำให้ไม่สามารถ Spam ตัวละครที่แข็งแกร่งได้

---

# 💥 Ultimate System

ผู้เล่นมี Ultimate Meter

```text
████████░░

80%
```

Meter เพิ่มจาก:

- Damage
- Kill
- Taking Damage
- Battle Events

เมื่อเต็มสามารถใช้ Ultimate ได้

ตัวอย่าง:

### 📡 Wi-Fi Down

```text
All Enemies

STUN
3 Seconds
```

### 🌧️ Salaya Rain

```text
Enemy Movement Speed
-40%
```

### 🚌 Campus Shuttle

รถวิ่งผ่านสนาม

```text
Damage
+
Knockback
```

Ultimate ในอนาคตสามารถ Unlock และ Upgrade ได้

---

# 🗺️ Campaign

Campaign ได้แรงบันดาลใจจากชีวิตมหาวิทยาลัย

ตัวอย่าง Chapter:

```text
CHAPTER 1

FRESHMAN LIFE

Dormitory
↓
Cafeteria
↓
Library
↓
Lab
↓
Boss
```

ต่อมา:

```text
CHAPTER 2

MIDTERM INVASION
```

และ:

```text
CHAPTER 3

FINAL APOCALYPSE
```

---

# 👹 Enemy Design

ศัตรูไม่จำเป็นต้องเป็นนักศึกษาจากคณะอื่น

ศัตรูหลักควรเป็นสิ่งที่เกี่ยวกับชีวิตมหาวิทยาลัย เช่น:

```text
Assignment

Deadline

Quiz

8 AM Class

Traffic

Group Project

Sleep Deprivation

Midterm

Final Exam
```

ทำให้ Theme ของเกมเป็น:

> ทุกคณะร่วมมือกันเอาชีวิตรอดจากมหาวิทยาลัย

มากกว่าการทำให้คณะต่าง ๆ เป็นศัตรูกันตลอดเวลา

---

# 👑 Boss System

Boss มีหลาย Phase

ตัวอย่าง:

```text
FINAL EXAM

████████████████████
100%
```

### Phase 1

Normal Attack

### Phase 2

HP < 50%

```text
EXAM PAPER RAIN
```

โจมตีหลายตำแหน่งบนสนาม

### Phase 3

HP < 20%

```text
OVERTIME
```

Boss:

```text
Attack Speed +100%
Damage +30%
```

---

# 🎰 Character Collection

ผู้เล่นสามารถ Unlock ตัวละครจากทุก Faculty

ตัวอย่าง Collection:

```text
MY CHARACTERS

⭐⭐⭐⭐⭐
💻 ICT
Cyber Senior

⭐⭐⭐⭐
🩺 Medicine
Emergency Intern

⭐⭐⭐⭐
⚙️ Engineering
Mecha Freshy

⭐⭐⭐
🎵 Music
Bass Player

⭐⭐⭐⭐
🐾 Veterinary
Animal Whisperer

⭐⭐⭐⭐⭐
🧬 Science
Lab Maniac
```

---

# 🎨 Art Direction

Visual Style:

```text
2D
Cartoon
Chibi
Colorful
University Theme
Humorous
Mobile Game UI
```

ตัวละคร:

```text
Large Head
Small Body
Exaggerated Animation
Recognizable Faculty Identity
```

หลีกเลี่ยงการ Copy Character Design หรือ Asset จากเกมอื่นโดยตรง

เกมควรมี Visual Identity ของตัวเอง

---

# 🧱 Technical Direction

Prototype แนะนำ:

```text
Phaser 3
TypeScript
Vite
```

Target Platform แรก:

```text
Web Browser
Desktop
Mobile Browser
```

Architecture ควรเป็น Data-Driven เพื่อให้สามารถเพิ่ม Character ใหม่โดยไม่ต้องแก้ Game Engine

ตัวอย่าง:

```text
characters/
    ict/
    medicine/
    engineering/
    science/
    pharmacy/
    veterinary/
```

Character Definition:

```text
Character
├── id
├── name
├── faculty
├── rarity
├── role
├── stats
├── cost
├── cooldown
├── attack
├── passive
└── skill
```

---

# 🧪 MVP — Version 0.1

Version แรก **ยังไม่สร้างเกมเต็ม**

เป้าหมายคือพิสูจน์ว่า Core Battle สนุก

สร้าง:

```text
1 Battle Map

1 Player Base
1 Enemy Base

6 Player Characters
4 Enemy Types

1 Boss

6 Character Cards

Money System

Income Upgrade

Character Spawn

Movement

Target Detection

Combat

HP / Damage

Death

Cooldown

Enemy Spawn AI

1 Ultimate

Win / Lose

Basic Animation

Basic Sound
```

ตัวละคร Prototype ควรมาจากหลายคณะเพื่อทดสอบระบบ Mixed Faculty Team

ตัวอย่าง:

```text
💻 ICT
Ranged DPS

⚙️ Engineering
Tank

🩺 Medicine
Healer

🧬 Science
AoE

🐾 Veterinary
Summoner

🎵 Music
Support
```

---

# 🚀 Development Roadmap

```text
V0.1
Core Battle Prototype

↓

V0.2
Character System

↓

V0.3
Character Upgrade

↓

V0.4
Campaign / Stage Select

↓

V0.5
Full Faculty Character System

↓

V0.6
Account / Save System

↓

V0.7
Faculty Guild System

↓

V0.8
Faculty Ranking

↓

V0.9
Faculty War

↓

V1.0
First Playable Release
```

---

# 🎯 Design Principles

ทุก Feature ของเกมควรยึดหลัก:

### 1. Faculty ≠ Character Restriction

ผู้เล่นเลือก Faculty เพื่อ Community Identity

ไม่ใช่เพื่อจำกัด Character

### 2. Every Character Is Usable

ตัวละครทุกคณะสามารถใช้โดยผู้เล่นทุกคน

### 3. Faculty Matters

Faculty ของ Character ต้องมีผลต่อ Gameplay ผ่าน Identity และ Synergy

### 4. Strategy Before Rarity

Legendary ไม่ควรชนะทุกอย่าง

Team Composition และ Timing ต้องสำคัญ

### 5. Easy to Learn, Hard to Master

การเล่นพื้นฐานคือ:

```text
Get Money
→
Deploy Character
→
Fight
```

แต่ระดับสูงมี:

```text
Economy
Timing
Counter
Team Composition
Faculty Synergy
Ultimate Timing
```

### 6. University Identity

ตัวละคร ด่าน Boss Skill และ Event ควรได้รับแรงบันดาลใจจากชีวิตมหาวิทยาลัย

### 7. Original Game Identity

สามารถได้รับแรงบันดาลใจจากเกมแนว Auto-Battle Side-Scrolling Strategy แต่ระบบ Art Character UI Audio และ Assets ต้องสร้างขึ้นใหม่สำหรับโปรเจกต์นี้

---

# 🔥 Project Vision

เป้าหมายของ MU Faculty Rush คือสร้างเกมที่ผู้เล่นรู้สึกว่า:

> **“ฉันอยู่คณะนี้ แต่ฉันกำลังสะสมทีมจากทั้งมหิดล”**

Faculty สร้าง Community

Characters สร้าง Collection

Team Building สร้าง Strategy

Battle สร้าง Gameplay

และ Faculty War ทำให้ Community ทั้งมหาวิทยาลัยมีเหตุผลที่จะกลับมาเล่นร่วมกัน

---

**Current Status:** Concept / Prototype

**Next Milestone:** Build the first playable Battle Prototype.

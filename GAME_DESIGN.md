# MU War 0f Collegian — Game Design Document

## 1. Game Overview

**Genre:** 2D Side-Scrolling Strategy / Auto Battle / Character Collection

**Core Fantasy:**

ผู้เล่นเป็นนักศึกษาที่เลือกสังกัด Faculty หนึ่งแห่งของ MU และสร้างทีมจากตัวละครของคณะต่าง ๆ เพื่อผ่านเหตุการณ์และปัญหาชีวิตมหาวิทยาลัย

หัวใจของเกมมี 4 ส่วน:

```text
FACULTY
Community / Guild

CHARACTERS
Collection

TEAM BUILDING
Strategy

BATTLE
Real-time Deployment
```

---

# 2. Player Identity

ผู้เล่นมีข้อมูลหลัก:

```text
Player

├── Username
├── Level
├── EXP
├── Faculty
├── Coins
├── Gems
├── Characters
├── Team Presets
├── Campaign Progress
└── Faculty Contribution
```

## Faculty Selection

เมื่อเริ่มเกมครั้งแรก:

```text
WELCOME TO MU

Choose your Faculty

[ ICT ]
[ Engineering ]
[ Science ]
[ Medicine ]
[ Pharmacy ]
[ ... ]
```

การเลือก Faculty หมายถึง:

- Guild ของผู้เล่น
- Community Identity
- Faculty Ranking
- Faculty War
- Faculty Base
- Faculty Cosmetics
- Faculty Missions

การเลือก Faculty **ไม่จำกัดตัวละคร**

---

# 3. Faculty Rules

ต้องแยกสอง Concept นี้อย่างเด็ดขาด:

```text
PLAYER FACULTY
≠
CHARACTER FACULTY
```

ตัวอย่าง:

```text
Player

Faculty:
ICT


Team

Engineering
Medicine
ICT
Music
Science
Veterinary
```

ถูกต้องและต้องสามารถเล่นได้ตามปกติ

ห้ามระบบ Combat บังคับให้ผู้เล่นใช้ตัวละครจาก Faculty ของตัวเอง

---

# 4. Character System

ตัวละครหนึ่งตัวมีโครงสร้าง:

```text
Character

ID
Name
Faculty
Rarity
Role

HP
ATK
DEF

Move Speed
Attack Speed
Attack Range

Deploy Cost
Deploy Cooldown

Normal Attack
Passive
Skill

Level
Stars
```

---

# 5. Character Roles

ตัวละครแบ่ง Role หลัก:

## Tank

หน้าที่:

```text
รับ Damage
ยืนแนวหน้า
ป้องกันแนวหลัง
```

ค่าหลัก:

```text
High HP
High DEF
Low/Medium ATK
Short Range
```

---

## Fighter

ตัวละครสมดุล

```text
Medium HP
Medium/High ATK
Melee
```

---

## Ranged DPS

โจมตีจากแนวหลัง

```text
Low HP
High ATK
Long Range
```

---

## AoE

โจมตีหลายเป้าหมาย

เหมาะกับการแก้:

```text
Enemy Swarm
```

---

## Support

เพิ่มความสามารถทีม

ตัวอย่าง:

```text
ATK Buff
DEF Buff
Speed Buff
Cooldown Reduction
```

---

## Healer

รักษาตัวละครฝ่ายเรา

---

## Controller

ควบคุมศัตรู

ตัวอย่าง:

```text
Stun
Slow
Knockback
Silence
```

---

## Summoner

เรียก Unit เพิ่ม

ตัวอย่าง:

```text
Veterinary Character

↓ skill

🐕 🐕 🐕
```

---

# 6. Battle Team

ทีมหนึ่งประกอบด้วย:

```text
6 Characters
+
1 Ultimate
```

ตัวอย่าง:

```text
SLOT 1
Engineering Tank

SLOT 2
ICT Ranged

SLOT 3
Science AoE

SLOT 4
Medicine Healer

SLOT 5
Music Support

SLOT 6
Veterinary Summoner
```

ผู้เล่นสามารถสร้าง Team Preset หลายชุดได้ในอนาคต

---

# 7. Battle Map

Battle เป็นสนามแนวนอน

```text
PLAYER                                    ENEMY

BASE                                        BASE
 🏢                                          🏢
 │                                            │
 │                                            │
 ↓                                            ↓

[TANK] → → →                ← ← ← [ENEMY]

──────────────────────────────────────────────

PLAYER DEPLOY AREA
```

Camera แสดงสนามใน Side View

---

# 8. Battle Objective

เงื่อนไขชนะ:

```text
Enemy Base HP <= 0
```

เงื่อนไขแพ้:

```text
Player Base HP <= 0
```

Prototype ไม่จำเป็นต้องมี Time Limit

---

# 9. Battle Economy

เริ่ม Battle:

```text
Money = 100

Max Money = 500

Income = 10 / second
```

เงินเพิ่มอัตโนมัติ

```text
Every Second

Money += Income
```

แต่:

```text
Money <= Max Money
```

---

# 10. Deploy Character

Character Card แสดง:

```text
┌──────────────┐

   CHARACTER

     💻

Cost: 150

Cooldown: READY

└──────────────┘
```

เมื่อกด:

ตรวจสอบ

```text
Money >= Cost

AND

Cooldown == 0
```

ถ้าผ่าน:

```text
Money -= Cost

Spawn Character

Start Cooldown
```

---

# 11. Income Upgrade

ผู้เล่นสามารถใช้เงินเพื่อเพิ่ม Economy

ตัวอย่าง Prototype:

```text
LEVEL 1

Income
10/sec

Upgrade Cost
100
```

↓

```text
LEVEL 2

Income
15/sec

Upgrade Cost
200
```

↓

```text
LEVEL 3

Income
22/sec

Upgrade Cost
350
```

↓

```text
LEVEL 4

Income
30/sec
```

ผู้เล่นต้องตัดสินใจ:

```text
Deploy Army

VS

Upgrade Economy
```

---

# 12. Unit Movement

เมื่อ Character Spawn:

```text
STATE:

MOVING
```

ตัวละครเดินไปทาง Enemy Base

จนกระทั่งพบ Enemy ภายใน:

```text
Attack Range
```

จากนั้นเปลี่ยนเป็น:

```text
ATTACKING
```

---

# 13

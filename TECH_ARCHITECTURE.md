# War of Collegian — Technical Architecture

## 1. Project Goal

**War of Collegian** เป็นเกม 2D Side-Scrolling Strategy / Auto-Battle / Character Collection ที่มีระบบ Faculty เป็น Guild/Faction ของผู้เล่น

Architecture ต้องรองรับการขยายจาก Prototype ไปสู่เกมเต็มโดยไม่ต้อง Rewrite Core Battle ใหม่

หลักสำคัญ:

```text
Data-Driven
Modular
Expandable
Easy to Vibe Code
Web First
Low Cost
```

---

# 2. Technology Stack

Prototype ใช้:

```text
Language
TypeScript

Game Engine
Phaser 3

Build Tool
Vite

Package Manager
npm

Version Control
Git + GitHub
```

เป้าหมายแรก:

```text
Desktop Browser
```

จากนั้นค่อยรองรับ:

```text
Mobile Browser
PWA
```

---

# 3. Prototype Architecture

```text
┌───────────────────────────┐
│          UI Layer         │
│ Cards / Money / HP / HUD  │
└─────────────┬─────────────┘
              │
┌─────────────▼─────────────┐
│       Battle Scene        │
│                           │
│ Coordinates Game Systems  │
└─────────────┬─────────────┘
              │
 ┌────────────┼─────────────┐
 ↓            ↓             ↓
Units       Economy       Spawner
 ↓            ↓             ↓
Combat      Money        Enemy AI
 ↓
Targeting
              │
              ↓
┌───────────────────────────┐
│        Data Layer         │
│                           │
│ Characters                │
│ Enemies                   │
│ Stages                    │
│ Faculties                 │
│ Synergies                 │
└───────────────────────────┘
```

Game Logic ห้ามผูกกับ UI โดยตรง

ตัวอย่าง:

```text
CharacterCard
```

มีหน้าที่:

> แสดง Character และรับ Click

ไม่ควรเป็นตัวคำนวณ Damage หรือ Spawn Logic

---

# 4. Project Structure

```text
war-of-collegian/

├── public/
│   ├── assets/
│   │   ├── characters/
│   │   ├── enemies/
│   │   ├── backgrounds/
│   │   ├── buildings/
│   │   ├── effects/
│   │   ├── ui/
│   │   ├── icons/
│   │   ├── audio/
│   │   └── fonts/
│   │
│   └── favicon.ico
│
├── src/
│
│   ├── main.ts
│   │
│   ├── game/
│   │
│   │   ├── config/
│   │   │   └── gameConfig.ts
│   │   │
│   │   ├── scenes/
│   │   │   ├── BootScene.ts
│   │   │   ├── PreloadScene.ts
│   │   │   ├── MenuScene.ts
│   │   │   └── BattleScene.ts
│   │   │
│   │   ├── entities/
│   │   │   ├── Unit.ts
│   │   │   ├── Base.ts
│   │   │   ├── Projectile.ts
│   │   │   └── SummonedUnit.ts
│   │   │
│   │   ├── systems/
│   │   │   ├── CombatSystem.ts
│   │   │   ├── TargetSystem.ts
│   │   │   ├── SpawnSystem.ts
│   │   │   ├── EconomySystem.ts
│   │   │   ├── Cool

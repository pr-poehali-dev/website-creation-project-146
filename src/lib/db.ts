// QuestMaster — localStorage data layer
// Полноценная БД в браузере: users, sites, quests, levels, participants, messages

export type Role = "owner" | "admin" | "editor" | "member_1" | "member_2" | "member_3";

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
  avatar: string;
  status: "active" | "pending" | "blocked";
  createdAt: string;
  lastSeen: string;
}

export interface QuestLevel {
  id: string;
  questId: string;
  title: string;
  type: "text" | "image" | "video" | "audio";
  riddle: string;
  answer: string;
  hint: string;
  sortOrder: number;
}

export interface Quest {
  id: string;
  siteId: string;
  title: string;
  description: string;
  status: "active" | "draft";
  createdAt: string;
}

export interface Site {
  id: string;
  name: string;
  url: string;
  status: "active" | "draft";
  ownerId: string;
  createdAt: string;
}

export interface Participant {
  id: string;
  userId: string;
  questId: string;
  progress: number;
  completedLevels: number;
  hintsUsed: number;
  accessGranted: boolean;
  accessToken: string;
  createdAt: string;
}

export interface Message {
  id: string;
  fromUserId: string;
  toUserId: string;
  text: string;
  isRead: boolean;
  createdAt: string;
}

// ─── Storage helpers ──────────────────────────────────────────────────────────

function load<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(`qm_${key}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function save<T>(key: string, data: T[]): void {
  localStorage.setItem(`qm_${key}`, JSON.stringify(data));
}

function uid(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function hashPassword(p: string): string {
  // Simple hash for demo — in production use bcrypt via backend
  let h = 0;
  for (let i = 0; i < p.length; i++) h = ((h << 5) - h) + p.charCodeAt(i);
  return Math.abs(h).toString(36);
}

function initials(name: string): string {
  return name.split(" ").slice(0, 2).map(w => w[0]?.toUpperCase() || "").join("");
}

function token(userId: string, questId: string): string {
  return `${userId}-${questId}-${Math.random().toString(36).slice(2, 8)}`;
}

// ─── Seed data ────────────────────────────────────────────────────────────────

function seedIfEmpty() {
  const users = load<User>("users");
  if (users.length > 0) return;

  const ownerId = uid();
  const adminId = uid();
  const editorId = uid();
  const m1Id = uid();
  const m2Id = uid();

  const ownerUser: User = {
    id: ownerId, name: "Александр Королёв", email: "owner@questmaster.app",
    passwordHash: hashPassword("owner123"), role: "owner", avatar: "АК",
    status: "active", createdAt: "2026-01-01", lastSeen: "сейчас"
  };
  const adminUser: User = {
    id: adminId, name: "Мария Звёздная", email: "admin@questmaster.app",
    passwordHash: hashPassword("admin123"), role: "admin", avatar: "МЗ",
    status: "active", createdAt: "2026-01-05", lastSeen: "5 мин назад"
  };
  const editorUser: User = {
    id: editorId, name: "Дмитрий Путник", email: "editor@questmaster.app",
    passwordHash: hashPassword("editor123"), role: "editor", avatar: "ДП",
    status: "active", createdAt: "2026-01-10", lastSeen: "1 час назад"
  };
  const m1: User = {
    id: m1Id, name: "Елена Тайная", email: "elena@questmaster.app",
    passwordHash: hashPassword("elena123"), role: "member_1", avatar: "ЕТ",
    status: "active", createdAt: "2026-01-15", lastSeen: "вчера"
  };
  const m2: User = {
    id: m2Id, name: "Виктор Загадкин", email: "viktor@questmaster.app",
    passwordHash: hashPassword("viktor123"), role: "member_2", avatar: "ВЗ",
    status: "pending", createdAt: "2026-02-01", lastSeen: "2 дня назад"
  };

  save("users", [ownerUser, adminUser, editorUser, m1, m2]);

  const site1Id = uid();
  const site2Id = uid();
  save<Site>("sites", [
    { id: site1Id, name: "Городские Тайны", url: "gorteyny.questmaster.app", status: "active", ownerId, createdAt: "2026-01-10" },
    { id: site2Id, name: "Лесной Квест", url: "lesnoy.questmaster.app", status: "active", ownerId, createdAt: "2026-02-15" },
  ]);

  const q1Id = uid();
  const q2Id = uid();
  const q3Id = uid();
  save<Quest>("quests", [
    { id: q1Id, siteId: site1Id, title: "Путь детектива", description: "Раскройте тайны старого города", status: "active", createdAt: "2026-01-15" },
    { id: q2Id, siteId: site1Id, title: "Лабиринт времени", description: "Путешествие сквозь эпохи", status: "active", createdAt: "2026-02-01" },
    { id: q3Id, siteId: site2Id, title: "Тропа исследователя", description: "Откройте тайны природы", status: "draft", createdAt: "2026-02-20" },
  ]);

  const l1 = uid(); const l2 = uid(); const l3 = uid(); const l4 = uid();
  save<QuestLevel>("levels", [
    { id: l1, questId: q1Id, title: "Первый след", type: "text", riddle: "Что читают все, но никто не держит в руках?", answer: "газета", hint: "Это ежедневная публикация", sortOrder: 1 },
    { id: l2, questId: q1Id, title: "Загадка улицы", type: "image", riddle: "Найдите скрытое число на фотографии фасада", answer: "1847", hint: "Смотрите на верхний угол здания", sortOrder: 2 },
    { id: l3, questId: q1Id, title: "Шифр подвала", type: "audio", riddle: "Прослушайте запись и угадайте место", answer: "вокзал", hint: "Звуки транспорта", sortOrder: 3 },
    { id: l4, questId: q2Id, title: "Начало пути", type: "text", riddle: "В каком году основан Санкт-Петербург?", answer: "1703", hint: "Это век Петра Великого", sortOrder: 1 },
  ]);

  save<Participant>("participants", [
    { id: uid(), userId: m1Id, questId: q1Id, progress: 66, completedLevels: 2, hintsUsed: 1, accessGranted: true, accessToken: token(m1Id, q1Id), createdAt: "2026-01-20" },
    { id: uid(), userId: m2Id, questId: q1Id, progress: 33, completedLevels: 1, hintsUsed: 3, accessGranted: false, accessToken: token(m2Id, q1Id), createdAt: "2026-02-05" },
    { id: uid(), userId: adminId, questId: q1Id, progress: 100, completedLevels: 3, hintsUsed: 0, accessGranted: true, accessToken: token(adminId, q1Id), createdAt: "2026-01-16" },
  ]);

  save<Message>("messages", []);
}

// ─── DB API ───────────────────────────────────────────────────────────────────

export const db = {
  // --- Auth ---
  register(name: string, email: string, password: string): User | { error: string } {
    const users = load<User>("users");
    if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
      return { error: "Пользователь с таким email уже существует" };
    }
    const newUser: User = {
      id: uid(), name, email: email.toLowerCase(),
      passwordHash: hashPassword(password),
      role: "member_1", avatar: initials(name),
      status: "pending", createdAt: new Date().toISOString().split("T")[0],
      lastSeen: "только что"
    };
    save("users", [...users, newUser]);
    return newUser;
  },

  login(email: string, password: string): User | { error: string } {
    const users = load<User>("users");
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) return { error: "Пользователь не найден" };
    if (user.passwordHash !== hashPassword(password)) return { error: "Неверный пароль" };
    const updated = users.map(u => u.id === user.id ? { ...u, lastSeen: "только что" } : u);
    save("users", updated);
    return { ...user, lastSeen: "только что" };
  },

  updatePassword(userId: string, newPassword: string): void {
    const users = load<User>("users");
    save("users", users.map(u => u.id === userId ? { ...u, passwordHash: hashPassword(newPassword) } : u));
  },

  // --- Users ---
  getUsers(): User[] { return load<User>("users"); },

  updateUser(id: string, data: Partial<User>): void {
    const users = load<User>("users");
    save("users", users.map(u => u.id === id ? { ...u, ...data } : u));
  },

  acceptUser(id: string): void {
    this.updateUser(id, { status: "active" });
  },

  // --- Sites ---
  getSites(): Site[] { return load<Site>("sites"); },

  addSite(name: string, url: string, ownerId: string): Site {
    const sites = load<Site>("sites");
    const site: Site = { id: uid(), name, url: url || `${name.toLowerCase().replace(/\s+/g, "-")}.questmaster.app`, status: "draft", ownerId, createdAt: new Date().toISOString().split("T")[0] };
    save("sites", [...sites, site]);
    return site;
  },

  updateSite(id: string, data: Partial<Site>): void {
    save("sites", load<Site>("sites").map(s => s.id === id ? { ...s, ...data } : s));
  },

  removeSite(id: string): void {
    const quests = load<Quest>("quests").filter(q => q.siteId !== id);
    const questIds = quests.map(q => q.id);
    save("sites", load<Site>("sites").filter(s => s.id !== id));
    save("quests", quests);
    save("levels", load<QuestLevel>("levels").filter(l => questIds.includes(l.questId)));
  },

  // --- Quests ---
  getQuests(siteId?: string): Quest[] {
    const all = load<Quest>("quests");
    return siteId ? all.filter(q => q.siteId === siteId) : all;
  },

  addQuest(siteId: string, title: string, description: string): Quest {
    const q: Quest = { id: uid(), siteId, title, description, status: "draft", createdAt: new Date().toISOString().split("T")[0] };
    save("quests", [...load<Quest>("quests"), q]);
    return q;
  },

  updateQuest(id: string, data: Partial<Quest>): void {
    save("quests", load<Quest>("quests").map(q => q.id === id ? { ...q, ...data } : q));
  },

  removeQuest(id: string): void {
    save("quests", load<Quest>("quests").filter(q => q.id !== id));
    save("levels", load<QuestLevel>("levels").filter(l => l.questId !== id));
  },

  // --- Levels ---
  getLevels(questId?: string): QuestLevel[] {
    const all = load<QuestLevel>("levels");
    return questId ? all.filter(l => l.questId === questId).sort((a, b) => a.sortOrder - b.sortOrder) : all;
  },

  addLevel(questId: string, data: Omit<QuestLevel, "id" | "questId" | "sortOrder">): QuestLevel {
    const existing = this.getLevels(questId);
    const level: QuestLevel = { id: uid(), questId, sortOrder: existing.length + 1, ...data };
    save("levels", [...load<QuestLevel>("levels"), level]);
    return level;
  },

  updateLevel(id: string, data: Partial<QuestLevel>): void {
    save("levels", load<QuestLevel>("levels").map(l => l.id === id ? { ...l, ...data } : l));
  },

  removeLevel(id: string): void {
    save("levels", load<QuestLevel>("levels").filter(l => l.id !== id));
  },

  // --- Participants ---
  getParticipants(questId?: string): Participant[] {
    const all = load<Participant>("participants");
    return questId ? all.filter(p => p.questId === questId) : all;
  },

  getParticipantsByUser(userId: string): Participant[] {
    return load<Participant>("participants").filter(p => p.userId === userId);
  },

  addParticipant(userId: string, questId: string): Participant {
    const existing = load<Participant>("participants");
    const found = existing.find(p => p.userId === userId && p.questId === questId);
    if (found) return found;
    const p: Participant = { id: uid(), userId, questId, progress: 0, completedLevels: 0, hintsUsed: 0, accessGranted: false, accessToken: token(userId, questId), createdAt: new Date().toISOString().split("T")[0] };
    save("participants", [...existing, p]);
    return p;
  },

  grantAccess(userId: string, questId: string): void {
    const all = load<Participant>("participants");
    const found = all.find(p => p.userId === userId && p.questId === questId);
    if (found) {
      save("participants", all.map(p => p.id === found.id ? { ...p, accessGranted: true } : p));
    } else {
      const p: Participant = { id: uid(), userId, questId, progress: 0, completedLevels: 0, hintsUsed: 0, accessGranted: true, accessToken: token(userId, questId), createdAt: new Date().toISOString().split("T")[0] };
      save("participants", [...all, p]);
    }
  },

  updateProgress(userId: string, questId: string, completedLevels: number, hintsUsed: number, total: number): void {
    const all = load<Participant>("participants");
    save("participants", all.map(p =>
      p.userId === userId && p.questId === questId
        ? { ...p, completedLevels, hintsUsed, progress: total ? Math.round((completedLevels / total) * 100) : 0 }
        : p
    ));
  },

  // --- Messages ---
  getMessages(userId: string): Message[] {
    return load<Message>("messages").filter(m => m.fromUserId === userId || m.toUserId === userId);
  },

  sendMessage(fromUserId: string, toUserId: string, text: string): Message {
    const m: Message = { id: uid(), fromUserId, toUserId, text, isRead: false, createdAt: new Date().toLocaleString("ru") };
    save("messages", [...load<Message>("messages"), m]);
    return m;
  },

  getOwner(): User | undefined {
    return load<User>("users").find(u => u.role === "owner");
  },
};

// Bootstrap
seedIfEmpty();

export { hashPassword };

import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { db, type User, type Site, type Quest, type QuestLevel, type Participant, type Role } from "@/lib/db";

// ─── Constants ────────────────────────────────────────────────────────────────

type Section = "dashboard" | "sites" | "quest-editor" | "members" | "achievements" | "profile";

export const ROLE_LABELS: Record<Role, string> = {
  owner: "Владелец", admin: "Администратор", editor: "Редактор",
  member_1: "Участник I", member_2: "Участник II", member_3: "Участник III",
};

export const ROLE_COLORS: Record<Role, string> = {
  owner: "text-yellow-400 bg-yellow-400/10 border-yellow-400/30",
  admin: "text-blue-400 bg-blue-400/10 border-blue-400/30",
  editor: "text-purple-400 bg-purple-400/10 border-purple-400/30",
  member_1: "text-green-400 bg-green-400/10 border-green-400/30",
  member_2: "text-cyan-400 bg-cyan-400/10 border-cyan-400/30",
  member_3: "text-pink-400 bg-pink-400/10 border-pink-400/30",
};

// ─── UI Primitives ────────────────────────────────────────────────────────────

function GoldBtn({ children, onClick, className = "", icon, disabled }: {
  children: React.ReactNode; onClick?: () => void; className?: string;
  icon?: string; disabled?: boolean;
}) {
  return (
    <button onClick={onClick} disabled={disabled}
      className={`gold-btn px-5 py-2.5 rounded-lg font-golos text-sm flex items-center gap-2 cursor-pointer disabled:opacity-50 ${className}`}>
      {icon && <Icon name={icon as string} size={16} />}
      {children}
    </button>
  );
}

function Modal({ title, children, onClose, wide }: {
  title: string; children: React.ReactNode; onClose: () => void; wide?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" />
      <div className={`relative blue-card rounded-2xl p-6 w-full ${wide ? "max-w-2xl" : "max-w-md"} max-h-[90vh] overflow-y-auto animate-scale-in`}
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-cormorant text-xl text-white font-semibold">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors flex-shrink-0 ml-3">
            <Icon name="X" size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Input({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label?: string }) {
  return (
    <div>
      {label && <label className="text-sm text-gray-400 mb-1.5 block">{label}</label>}
      <input {...props}
        className={`w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors ${props.className ?? ""}`} />
    </div>
  );
}

function Textarea({ label, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string }) {
  return (
    <div>
      {label && <label className="text-sm text-gray-400 mb-1.5 block">{label}</label>}
      <textarea {...props} rows={props.rows ?? 3}
        className={`w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors resize-none ${props.className ?? ""}`} />
    </div>
  );
}

// ─── Invite Modal ─────────────────────────────────────────────────────────────

function InviteModal({ type, onClose }: { type: "telegram" | "vk" | "sms" | "email"; onClose: () => void }) {
  const [value, setValue] = useState("");
  const [sent, setSent] = useState(false);
  const inviteLink = `${window.location.origin}?join=true`;

  const cfg = {
    telegram: { title: "Пригласить через Telegram", placeholder: "@username", icon: "Send", label: "Telegram-адрес" },
    vk: { title: "Пригласить ВКонтакте", placeholder: "vk.com/username или id12345", icon: "Users", label: "Профиль ВКонтакте" },
    sms: { title: "Пригласить по SMS", placeholder: "+7 (___) ___-__-__", icon: "Smartphone", label: "Номер телефона" },
    email: { title: "Пригласить по Email", placeholder: "name@example.com", icon: "Mail", label: "Email адрес" },
  }[type];

  const handleSend = () => {
    if (!value.trim()) return;
    setSent(true);
    setTimeout(() => { setSent(false); onClose(); }, 1500);
  };

  return (
    <Modal title={cfg.title} onClose={onClose}>
      <div className="space-y-4">
        <Input label={cfg.label} value={value} onChange={e => setValue(e.target.value)} placeholder={cfg.placeholder} />
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
          <p className="text-xs text-gray-400 mb-1">Ссылка-приглашение:</p>
          <div className="flex items-center gap-2">
            <code className="text-blue-400 text-xs flex-1 truncate">{inviteLink}</code>
            <button onClick={() => navigator.clipboard.writeText(inviteLink)}
              className="text-gray-400 hover:text-blue-400 transition-colors">
              <Icon name="Copy" size={14} />
            </button>
          </div>
        </div>
        {sent
          ? <div className="text-center text-green-400 py-2 animate-fade-in">✓ Приглашение отправлено!</div>
          : <GoldBtn onClick={handleSend} icon={cfg.icon} className="w-full justify-center">Отправить приглашение</GoldBtn>}
      </div>
    </Modal>
  );
}

// ─── Auth Screen ──────────────────────────────────────────────────────────────

function AuthScreen({ onLogin }: { onLogin: (user: User) => void }) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handle = () => {
    setError("");
    if (!email || !password) { setError("Заполните все поля"); return; }
    if (mode === "register") {
      if (!name.trim()) { setError("Введите имя"); return; }
      const res = db.register(name.trim(), email, password);
      if ("error" in res) { setError(res.error); return; }
      onLogin(res);
    } else {
      const res = db.login(email, password);
      if ("error" in res) { setError(res.error); return; }
      onLogin(res);
    }
  };

  return (
    <div className="min-h-screen mystical-bg flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        {Array.from({ length: 40 }).map((_, i) => (
          <div key={i} className="absolute rounded-full bg-white"
            style={{ width: Math.random() * 2 + 0.5 + "px", height: Math.random() * 2 + 0.5 + "px",
              top: Math.random() * 100 + "%", left: Math.random() * 100 + "%",
              opacity: Math.random() * 0.5 + 0.1 }} />
        ))}
      </div>
      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-600 to-purple-700 mb-4 animate-float"
            style={{ boxShadow: "0 0 40px rgba(99,102,241,0.5)" }}>
            <Icon name="Compass" size={38} className="text-white" />
          </div>
          <h1 className="font-cormorant text-5xl text-white font-bold">QuestMaster</h1>
          <p className="text-gray-400 mt-1 font-cormorant text-lg italic">Платформа управления квестами</p>
        </div>
        <div className="quest-card rounded-2xl p-8">
          <div className="flex rounded-xl bg-white/5 p-1 mb-6">
            {(["login", "register"] as const).map(m => (
              <button key={m} onClick={() => { setMode(m); setError(""); }}
                className={`flex-1 py-2.5 rounded-lg text-sm transition-all font-medium ${mode === m ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white"}`}>
                {m === "login" ? "Вход" : "Регистрация"}
              </button>
            ))}
          </div>
          <div className="space-y-4">
            {mode === "register" && <Input label="Имя" value={name} onChange={e => setName(e.target.value)} placeholder="Ваше имя" />}
            <Input label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" />
            <Input label="Пароль" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••"
              onKeyDown={e => e.key === "Enter" && handle()} />
            {mode === "login" && (
              <div className="text-right">
                <button className="text-sm text-blue-400 hover:text-blue-300 transition-colors">
                  Забыли пароль? Восстановить через SMS
                </button>
              </div>
            )}
            {error && <p className="text-red-400 text-sm bg-red-500/10 rounded-lg px-3 py-2">{error}</p>}
            <GoldBtn onClick={handle} className="w-full justify-center py-3 font-cormorant text-lg"
              icon={mode === "login" ? "LogIn" : "UserPlus"}>
              {mode === "login" ? "Войти в систему" : "Создать аккаунт"}
            </GoldBtn>
          </div>
          <div className="mt-4 pt-4 border-t border-white/5 text-center">
            <p className="text-xs text-gray-600">Демо входа: <span className="text-gray-400">owner@questmaster.app / owner123</span></p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

function DashboardSection({ currentUser, sites, users, onAcceptSite, onAcceptUser, refresh }:
  { currentUser: User; sites: Site[]; users: User[]; onAcceptSite: () => void; onAcceptUser: (id: string) => void; refresh: () => void }) {
  const pending = users.filter(u => u.status === "pending");
  const allQuests = db.getQuests();

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-cormorant text-4xl text-white font-bold">Панель управления</h1>
          <p className="text-gray-400 mt-1">Добро пожаловать, {currentUser.name.split(" ")[0]}!</p>
        </div>
        {(currentUser.role === "owner" || currentUser.role === "admin") && (
          <GoldBtn onClick={onAcceptSite} icon="Plus">Принять дополнение</GoldBtn>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Сайтов", value: sites.length, icon: "Globe", color: "text-blue-400" },
          { label: "Квестов", value: allQuests.length, icon: "Map", color: "text-purple-400" },
          { label: "Участников", value: users.length, icon: "Users", color: "text-green-400" },
          { label: "Ожидают", value: pending.length, icon: "Clock", color: "text-yellow-400" },
        ].map(stat => (
          <div key={stat.label} className="blue-card rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm">{stat.label}</span>
              <Icon name={stat.icon as string} size={18} className={stat.color} />
            </div>
            <div className={`font-cormorant text-3xl font-bold ${stat.color}`}>{stat.value}</div>
          </div>
        ))}
      </div>

      <div>
        <h2 className="font-cormorant text-2xl text-white font-semibold mb-4">Активные квесты (пути)</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {sites.map((site, idx) => {
            const quests = db.getQuests(site.id);
            return (
              <div key={site.id} className="quest-card rounded-xl p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-yellow-400/60 font-cormorant text-sm">ПУТЬ {idx + 1}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${site.status === "active" ? "bg-green-500/20 text-green-400" : "bg-gray-500/20 text-gray-400"}`}>
                        {site.status === "active" ? "Активен" : "Черновик"}
                      </span>
                    </div>
                    <h3 className="font-cormorant text-xl text-white font-semibold">{site.name}</h3>
                    <p className="text-gray-400 text-sm">{site.url}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-cormorant text-blue-400 font-bold">{quests.length}</div>
                    <div className="text-xs text-gray-500">квестов</div>
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {quests.map(q => (
                    <span key={q.id} className="text-xs px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300">{q.title}</span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {pending.length > 0 && (
        <div>
          <h2 className="font-cormorant text-2xl text-white font-semibold mb-4">Запросы на участие</h2>
          <div className="space-y-2">
            {pending.map(user => (
              <div key={user.id} className="blue-card rounded-xl p-4 flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white text-xs font-bold">{user.avatar}</div>
                  <div>
                    <div className="text-white font-medium">{user.name}</div>
                    <div className="text-gray-400 text-sm">{user.email}</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { onAcceptUser(user.id); refresh(); }}
                    className="px-4 py-1.5 rounded-lg bg-green-500/20 text-green-400 border border-green-500/30 text-sm hover:bg-green-500/30 transition-colors flex items-center gap-1.5">
                    <Icon name="Check" size={14} />Принять
                  </button>
                  <button className="px-4 py-1.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 text-sm hover:bg-red-500/20 transition-colors flex items-center gap-1.5">
                    <Icon name="X" size={14} />Отклонить
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Sites Section ────────────────────────────────────────────────────────────

function SitesSection({ sites, onAddSite, refresh }: { sites: Site[]; onAddSite: () => void; refresh: () => void }) {
  const [copied, setCopied] = useState(false);
  const [editSite, setEditSite] = useState<Site | null>(null);
  const [editName, setEditName] = useState("");
  const [editUrl, setEditUrl] = useState("");
  const [editStatus, setEditStatus] = useState<"active" | "draft">("active");

  const integrationData = `{
  "platform": "QuestMaster",
  "version": "1.0",
  "apiEndpoint": "https://api.questmaster.app",
  "projectId": "qm_proj_7f3k9d2p",
  "authToken": "REPLACE_WITH_YOUR_TOKEN",
  "schema": {
    "quests": "/quests",
    "levels": "/levels",
    "participants": "/participants",
    "achievements": "/achievements"
  },
  "ui": {
    "answerField": true,
    "hintsEnabled": true,
    "goldButtonOnSuccess": true
  }
}`;

  const openEdit = (site: Site) => {
    setEditSite(site);
    setEditName(site.name);
    setEditUrl(site.url);
    setEditStatus(site.status);
  };

  const saveEdit = () => {
    if (!editSite) return;
    db.updateSite(editSite.id, { name: editName, url: editUrl, status: editStatus });
    setEditSite(null);
    refresh();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {editSite && (
        <Modal title={`Настройки: ${editSite.name}`} onClose={() => setEditSite(null)}>
          <div className="space-y-4">
            <Input label="Название сайта" value={editName} onChange={e => setEditName(e.target.value)} />
            <Input label="URL сайта" value={editUrl} onChange={e => setEditUrl(e.target.value)} />
            <div>
              <label className="text-sm text-gray-400 mb-1.5 block">Статус</label>
              <div className="flex gap-2">
                {(["active", "draft"] as const).map(s => (
                  <button key={s} onClick={() => setEditStatus(s)}
                    className={`flex-1 py-2 rounded-lg text-sm border transition-all ${editStatus === s ? "bg-blue-600/30 border-blue-500 text-white" : "bg-white/5 border-white/10 text-gray-400"}`}>
                    {s === "active" ? "Активен" : "Черновик"}
                  </button>
                ))}
              </div>
            </div>
            <GoldBtn onClick={saveEdit} icon="Save" className="w-full justify-center">Сохранить изменения</GoldBtn>
          </div>
        </Modal>
      )}

      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-cormorant text-4xl text-white font-bold">Управление сайтами</h1>
          <p className="text-gray-400 mt-1">Добавляйте и настраивайте сайты-квесты</p>
        </div>
        <GoldBtn onClick={onAddSite} icon="Plus">Добавить сайт</GoldBtn>
      </div>

      <div className="purple-card rounded-xl p-5">
        <div className="flex items-start justify-between mb-3 gap-3 flex-wrap">
          <div>
            <h3 className="font-cormorant text-xl text-white font-semibold flex items-center gap-2">
              <Icon name="Link" size={18} className="text-purple-400" />
              Данные интеграции для нового сайта
            </h3>
            <p className="text-gray-400 text-sm mt-1">Скопируйте и вставьте в запрос к ИИ-генератору</p>
          </div>
          <button onClick={() => { navigator.clipboard.writeText(`Создай сайт квеста с интеграцией в платформу QuestMaster. Данные подключения:\n\n${integrationData}`); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all text-sm flex-shrink-0 ${copied ? "bg-green-500/20 border-green-500/40 text-green-400" : "bg-purple-500/20 border-purple-500/40 text-purple-300 hover:bg-purple-500/30"}`}>
            <Icon name={copied ? "Check" : "Copy"} size={15} />
            {copied ? "Скопировано!" : "Скопировать данные интеграции"}
          </button>
        </div>
        <pre className="bg-black/30 rounded-lg p-4 text-xs text-gray-300 overflow-auto max-h-44 border border-white/5">{integrationData}</pre>
      </div>

      <div className="space-y-4">
        {sites.map(site => {
          const quests = db.getQuests(site.id);
          const levels = quests.flatMap(q => db.getLevels(q.id));
          return (
            <div key={site.id} className="quest-card rounded-xl p-5">
              <div className="flex items-start justify-between mb-4 gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-cormorant text-2xl text-white font-semibold">{site.name}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${site.status === "active" ? "bg-green-500/20 text-green-400" : "bg-gray-500/20 text-gray-400"}`}>
                      {site.status === "active" ? "Активен" : "Черновик"}
                    </span>
                  </div>
                  <p className="text-blue-400 text-sm">{site.url}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openEdit(site)}
                    className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 transition-colors" title="Настройки">
                    <Icon name="Settings" size={16} />
                  </button>
                  <button onClick={() => { if (confirm(`Удалить сайт «${site.name}»? Все квесты и уровни будут удалены.`)) { db.removeSite(site.id); refresh(); } }}
                    className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-colors" title="Удалить">
                    <Icon name="Trash2" size={16} />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 mb-4">
                {[{ label: "Квестов", value: quests.length }, { label: "Уровней", value: levels.length }, { label: "Участников", value: db.getParticipants().filter(p => quests.find(q => q.id === p.questId)).length }].map(s => (
                  <div key={s.label} className="bg-white/5 rounded-lg p-3 text-center">
                    <div className="text-xl font-cormorant text-white font-bold">{s.value}</div>
                    <div className="text-xs text-gray-400">{s.label}</div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 flex-wrap">
                {quests.map(q => (
                  <span key={q.id} className="text-xs px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300">{q.title}</span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Quest Editor ─────────────────────────────────────────────────────────────

function QuestEditorSection({ sites, refresh }: { sites: Site[]; refresh: () => void }) {
  const [selectedSiteId, setSelectedSiteId] = useState<string>(sites[0]?.id ?? "");
  const [selectedQuestId, setSelectedQuestId] = useState<string>("");
  const [showAddQuest, setShowAddQuest] = useState(false);
  const [showAddLevel, setShowAddLevel] = useState(false);
  const [editLevel, setEditLevel] = useState<QuestLevel | null>(null);
  const [editQuest, setEditQuest] = useState<Quest | null>(null);

  const [qTitle, setQTitle] = useState("");
  const [qDesc, setQDesc] = useState("");

  const [lvlTitle, setLvlTitle] = useState("");
  const [lvlType, setLvlType] = useState<QuestLevel["type"]>("text");
  const [lvlRiddle, setLvlRiddle] = useState("");
  const [lvlAnswer, setLvlAnswer] = useState("");
  const [lvlHint, setLvlHint] = useState("");

  const selectedSite = sites.find(s => s.id === selectedSiteId) ?? sites[0];
  const quests = selectedSite ? db.getQuests(selectedSite.id) : [];
  const selectedQuest = quests.find(q => q.id === selectedQuestId) ?? quests[0];
  const levels = selectedQuest ? db.getLevels(selectedQuest.id) : [];

  const resetLvl = () => { setLvlTitle(""); setLvlType("text"); setLvlRiddle(""); setLvlAnswer(""); setLvlHint(""); };

  const openEditLevel = (l: QuestLevel) => {
    setEditLevel(l);
    setLvlTitle(l.title); setLvlType(l.type); setLvlRiddle(l.riddle); setLvlAnswer(l.answer); setLvlHint(l.hint);
  };

  const saveLevel = () => {
    if (!selectedQuest || !lvlTitle || !lvlRiddle || !lvlAnswer) return;
    if (editLevel) {
      db.updateLevel(editLevel.id, { title: lvlTitle, type: lvlType, riddle: lvlRiddle, answer: lvlAnswer, hint: lvlHint });
      setEditLevel(null);
    } else {
      db.addLevel(selectedQuest.id, { title: lvlTitle, type: lvlType, riddle: lvlRiddle, answer: lvlAnswer, hint: lvlHint });
      setShowAddLevel(false);
    }
    resetLvl();
    refresh();
  };

  const saveQuest = () => {
    if (!selectedSite || !qTitle) return;
    if (editQuest) {
      db.updateQuest(editQuest.id, { title: qTitle, description: qDesc });
      setEditQuest(null);
    } else {
      const q = db.addQuest(selectedSite.id, qTitle, qDesc);
      setSelectedQuestId(q.id);
      setShowAddQuest(false);
    }
    setQTitle(""); setQDesc("");
    refresh();
  };

  const LevelForm = () => (
    <div className="space-y-4">
      <Input label="Название уровня" value={lvlTitle} onChange={e => setLvlTitle(e.target.value)} placeholder="Например: Тайна старого дома" />
      <div>
        <label className="text-sm text-gray-400 mb-1.5 block">Тип загадки</label>
        <div className="grid grid-cols-4 gap-2">
          {(["text", "image", "video", "audio"] as const).map(t => (
            <button key={t} onClick={() => setLvlType(t)}
              className={`py-2 px-3 rounded-lg text-xs flex flex-col items-center gap-1 transition-all border ${lvlType === t ? "bg-purple-500/20 border-purple-500/50 text-purple-300" : "bg-white/5 border-white/10 text-gray-400 hover:border-white/20"}`}>
              <Icon name={t === "text" ? "FileText" : t === "image" ? "Image" : t === "audio" ? "Music" : "Video"} size={16} />
              {t === "text" ? "Текст" : t === "image" ? "Картинка" : t === "audio" ? "Аудио" : "Видео"}
            </button>
          ))}
        </div>
      </div>
      <Textarea label="Загадка" value={lvlRiddle} onChange={e => setLvlRiddle(e.target.value)} placeholder="Текст загадки..." />
      <div className="grid grid-cols-2 gap-3">
        <Input label="Правильный ответ (одно слово)" value={lvlAnswer} onChange={e => setLvlAnswer(e.target.value)} placeholder="ответ..." />
        <Input label="Подсказка" value={lvlHint} onChange={e => setLvlHint(e.target.value)} placeholder="Подсказка..." />
      </div>
      <GoldBtn onClick={saveLevel} icon="Save" className="w-full justify-center">Сохранить уровень</GoldBtn>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {(showAddLevel || editLevel) && (
        <Modal title={editLevel ? "Редактировать уровень" : "Новый уровень"} onClose={() => { setShowAddLevel(false); setEditLevel(null); resetLvl(); }}>
          <LevelForm />
        </Modal>
      )}
      {(showAddQuest || editQuest) && (
        <Modal title={editQuest ? "Редактировать квест" : "Новый квест (путь)"} onClose={() => { setShowAddQuest(false); setEditQuest(null); }}>
          <div className="space-y-4">
            <Input label="Название квеста" value={qTitle} onChange={e => setQTitle(e.target.value)} placeholder="Путь детектива..." />
            <Textarea label="Описание" value={qDesc} onChange={e => setQDesc(e.target.value)} placeholder="Краткое описание квеста..." />
            <GoldBtn onClick={saveQuest} icon="Save" className="w-full justify-center">Сохранить</GoldBtn>
          </div>
        </Modal>
      )}

      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-cormorant text-4xl text-white font-bold">Редактор квестов</h1>
          <p className="text-gray-400 mt-1">Создавайте пути, уровни и загадки</p>
        </div>
        <GoldBtn onClick={() => { setQTitle(""); setQDesc(""); setShowAddQuest(true); }} icon="Plus">Новый квест</GoldBtn>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="blue-card rounded-xl p-4">
          <h3 className="text-gray-400 text-xs uppercase tracking-widest mb-3">Сайт</h3>
          <div className="space-y-2">
            {sites.map(site => (
              <button key={site.id} onClick={() => { setSelectedSiteId(site.id); setSelectedQuestId(""); }}
                className={`w-full text-left px-3 py-2.5 rounded-lg transition-all text-sm ${selectedSiteId === site.id ? "bg-blue-500/20 border border-blue-500/40 text-white" : "text-gray-400 hover:bg-white/5 hover:text-white"}`}>
                <div className="font-medium">{site.name}</div>
                <div className="text-xs opacity-60">{db.getQuests(site.id).length} квестов</div>
              </button>
            ))}
          </div>
        </div>

        <div className="blue-card rounded-xl p-4">
          <h3 className="text-gray-400 text-xs uppercase tracking-widest mb-3">Квест (путь)</h3>
          <div className="space-y-2 mb-3">
            {quests.map(quest => (
              <div key={quest.id} className={`flex items-center gap-1 rounded-lg transition-all ${selectedQuest?.id === quest.id ? "bg-purple-500/20 border border-purple-500/40" : "hover:bg-white/5"}`}>
                <button onClick={() => setSelectedQuestId(quest.id)}
                  className="flex-1 text-left px-3 py-2.5 text-sm">
                  <div className={`font-medium ${selectedQuest?.id === quest.id ? "text-white" : "text-gray-400"}`}>{quest.title}</div>
                  <div className="text-xs opacity-60">{db.getLevels(quest.id).length} уровней</div>
                </button>
                <div className="flex gap-1 pr-2">
                  <button onClick={() => { setEditQuest(quest); setQTitle(quest.title); setQDesc(quest.description); }}
                    className="p-1.5 rounded text-gray-500 hover:text-blue-400 transition-colors" title="Редактировать">
                    <Icon name="Edit2" size={13} />
                  </button>
                  <button onClick={() => { if (confirm(`Удалить квест «${quest.title}»?`)) { db.removeQuest(quest.id); setSelectedQuestId(""); refresh(); } }}
                    className="p-1.5 rounded text-gray-500 hover:text-red-400 transition-colors" title="Удалить">
                    <Icon name="Trash2" size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <button onClick={() => { setQTitle(""); setQDesc(""); setShowAddQuest(true); }}
            className="w-full text-xs py-2 rounded-lg border border-dashed border-white/10 text-gray-500 hover:border-blue-500/40 hover:text-blue-400 transition-colors flex items-center justify-center gap-1.5">
            <Icon name="Plus" size={13} />Новый путь
          </button>
        </div>

        <div className="blue-card rounded-xl p-4">
          <h3 className="text-gray-400 text-xs uppercase tracking-widest mb-3">Уровни</h3>
          {selectedQuest ? (
            <div className="space-y-2">
              {levels.map((level, idx) => (
                <div key={level.id} className="bg-white/5 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-white text-sm font-medium">{idx + 1}. {level.title}</span>
                    <div className="flex gap-1">
                      <button onClick={() => openEditLevel(level)} className="p-1 rounded text-gray-500 hover:text-blue-400 transition-colors">
                        <Icon name="Edit2" size={12} />
                      </button>
                      <button onClick={() => { if (confirm("Удалить уровень?")) { db.removeLevel(level.id); refresh(); } }} className="p-1 rounded text-gray-500 hover:text-red-400 transition-colors">
                        <Icon name="Trash2" size={12} />
                      </button>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 truncate">{level.riddle}</div>
                </div>
              ))}
              <button onClick={() => { resetLvl(); setShowAddLevel(true); }}
                className="w-full text-xs py-2 rounded-lg border border-dashed border-white/10 text-gray-500 hover:border-purple-500/40 hover:text-purple-400 transition-colors flex items-center justify-center gap-1.5">
                <Icon name="Plus" size={13} />Добавить уровень
              </button>
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8 text-sm">Выберите квест</div>
          )}
        </div>
      </div>

      {selectedQuest && levels.length > 0 && (
        <div>
          <h2 className="font-cormorant text-2xl text-white font-semibold mb-4">Уровни: «{selectedQuest.title}»</h2>
          <div className="space-y-3">
            {levels.map((level, idx) => (
              <div key={level.id} className="quest-card rounded-xl p-5">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center text-white font-cormorant text-lg font-bold flex-shrink-0">{idx + 1}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <h4 className="text-white font-semibold">{level.title}</h4>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center gap-1">
                        <Icon name={level.type === "text" ? "FileText" : level.type === "image" ? "Image" : level.type === "audio" ? "Music" : "Video"} size={11} />
                        {level.type === "text" ? "Текст" : level.type === "image" ? "Картинка" : level.type === "audio" ? "Аудио" : "Видео"}
                      </span>
                    </div>
                    <p className="text-gray-300 text-sm mb-2">🔮 {level.riddle}</p>
                    <div className="flex gap-4 text-xs text-gray-500 flex-wrap">
                      <span className="flex items-center gap-1"><Icon name="Key" size={11} />Ответ: <span className="text-green-400 ml-1">{level.answer}</span></span>
                      <span className="flex items-center gap-1"><Icon name="Lightbulb" size={11} />Подсказка: <span className="text-yellow-400/70 ml-1">{level.hint}</span></span>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button onClick={() => openEditLevel(level)} className="p-2 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors">
                      <Icon name="Edit2" size={14} />
                    </button>
                    <button onClick={() => { if (confirm("Удалить уровень?")) { db.removeLevel(level.id); refresh(); } }} className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors">
                      <Icon name="Trash2" size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Members ──────────────────────────────────────────────────────────────────

function MembersSection({ users, currentUser, refresh }: { users: User[]; currentUser: User; refresh: () => void }) {
  const [inviteType, setInviteType] = useState<"telegram" | "vk" | "sms" | "email" | null>(null);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState<Role>("member_1");

  const openEdit = (u: User) => { setEditUser(u); setEditName(u.name); setEditRole(u.role); };
  const saveEdit = () => {
    if (!editUser) return;
    db.updateUser(editUser.id, { name: editName, role: editRole });
    setEditUser(null);
    refresh();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {inviteType && <InviteModal type={inviteType} onClose={() => setInviteType(null)} />}
      {editUser && (
        <Modal title={`Редактировать: ${editUser.name}`} onClose={() => setEditUser(null)}>
          <div className="space-y-4">
            <Input label="Имя участника" value={editName} onChange={e => setEditName(e.target.value)} />
            <div>
              <label className="text-sm text-gray-400 mb-1.5 block">Роль</label>
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(ROLE_LABELS) as Role[]).filter(r => r !== "owner").map(r => (
                  <button key={r} onClick={() => setEditRole(r)}
                    className={`py-2 px-3 rounded-lg text-xs border transition-all text-left ${editRole === r ? "border-blue-500 bg-blue-500/20 text-white" : "border-white/10 bg-white/5 text-gray-400"}`}>
                    {ROLE_LABELS[r]}
                  </button>
                ))}
              </div>
            </div>
            <GoldBtn onClick={saveEdit} icon="Save" className="w-full justify-center">Сохранить</GoldBtn>
          </div>
        </Modal>
      )}

      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-cormorant text-4xl text-white font-bold">Участники</h1>
          <p className="text-gray-400 mt-1">Управление ролями и доступом</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <GoldBtn icon="Mail" onClick={() => setInviteType("email")}>По почте</GoldBtn>
          <button onClick={() => setInviteType("telegram")} className="px-4 py-2.5 rounded-lg bg-blue-500/20 border border-blue-500/40 text-blue-300 hover:bg-blue-500/30 transition-all text-sm flex items-center gap-2">
            <Icon name="Send" size={15} />Telegram
          </button>
          <button onClick={() => setInviteType("vk")} className="px-4 py-2.5 rounded-lg bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 hover:bg-indigo-500/30 transition-all text-sm flex items-center gap-2">
            <Icon name="Users" size={15} />ВКонтакте
          </button>
          <button onClick={() => setInviteType("sms")} className="px-4 py-2.5 rounded-lg bg-green-500/20 border border-green-500/40 text-green-300 hover:bg-green-500/30 transition-all text-sm flex items-center gap-2">
            <Icon name="Smartphone" size={15} />SMS
          </button>
        </div>
      </div>

      <div className="blue-card rounded-xl p-4">
        <h3 className="text-gray-400 text-xs uppercase tracking-widest mb-3">Иерархия ролей</h3>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(ROLE_LABELS) as Role[]).map(role => (
            <div key={role} className={`px-3 py-1.5 rounded-lg border text-xs font-medium ${ROLE_COLORS[role]}`}>{ROLE_LABELS[role]}</div>
          ))}
        </div>
      </div>

      <div className="blue-card rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="border-b border-white/5">
                {["Участник", "Роль", "Статус", "Зарегистрирован", "Действия"].map(h => (
                  <th key={h} className="text-left text-xs text-gray-500 uppercase tracking-widest px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id} className="border-b border-white/5 hover:bg-white/[0.03] transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">{user.avatar}</div>
                      <div>
                        <div className="text-white text-sm font-medium">{user.name}</div>
                        <div className="text-gray-500 text-xs">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2.5 py-1 rounded-full border ${ROLE_COLORS[user.role]}`}>{ROLE_LABELS[user.role]}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${user.status === "active" ? "bg-green-500/20 text-green-400" : user.status === "pending" ? "bg-yellow-500/20 text-yellow-400" : "bg-red-500/20 text-red-400"}`}>
                      {user.status === "active" ? "Активен" : user.status === "pending" ? "Ожидает" : "Заблокирован"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-sm">{user.createdAt}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1.5">
                      {user.status === "pending" && (
                        <button onClick={() => { db.acceptUser(user.id); refresh(); }}
                          className="p-1.5 rounded bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors" title="Принять">
                          <Icon name="Check" size={13} />
                        </button>
                      )}
                      {user.id !== currentUser.id && (
                        <button onClick={() => openEdit(user)}
                          className="p-1.5 rounded bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white transition-colors" title="Редактировать">
                          <Icon name="Edit2" size={13} />
                        </button>
                      )}
                      <button onClick={() => { db.updateUser(user.id, { status: user.status === "blocked" ? "active" : "blocked" }); refresh(); }}
                        className={`p-1.5 rounded transition-colors ${user.status === "blocked" ? "bg-green-500/10 text-green-400 hover:bg-green-500/20" : "bg-red-500/10 text-red-400 hover:bg-red-500/20"}`}
                        title={user.status === "blocked" ? "Разблокировать" : "Заблокировать"}>
                        <Icon name={user.status === "blocked" ? "Unlock" : "Lock"} size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Achievements ─────────────────────────────────────────────────────────────

function AchievementsSection({ users }: { users: User[] }) {
  const participants = db.getParticipants();
  const quests = db.getQuests();

  const userStats = users.map(u => {
    const parts = participants.filter(p => p.userId === u.id);
    const totalProgress = parts.length > 0 ? Math.round(parts.reduce((s, p) => s + p.progress, 0) / parts.length) : 0;
    const totalCompleted = parts.reduce((s, p) => s + p.completedLevels, 0);
    const totalHints = parts.reduce((s, p) => s + p.hintsUsed, 0);
    return { user: u, progress: totalProgress, completed: totalCompleted, hints: totalHints };
  }).sort((a, b) => b.progress - a.progress);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-cormorant text-4xl text-white font-bold">Таблица достижений</h1>
        <p className="text-gray-400 mt-1">{quests.length} квестов · {participants.length} прохождений</p>
      </div>

      <div className="quest-card rounded-2xl overflow-hidden">
        {userStats.length >= 3 && (
          <div className="p-6 grid grid-cols-3 gap-4 border-b border-white/5">
            {userStats.slice(0, 3).map(({ user, progress }, idx) => (
              <div key={user.id} className="text-center">
                <div className="relative inline-block mb-2">
                  <div className={`w-14 h-14 rounded-full bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center text-white text-lg font-bold mx-auto ${idx === 0 ? "ring-2 ring-yellow-400 ring-offset-2 ring-offset-transparent" : ""}`}>
                    {user.avatar}
                  </div>
                  <div className={`absolute -top-2 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${idx === 0 ? "bg-yellow-400 text-black" : idx === 1 ? "bg-gray-300 text-black" : "bg-orange-700 text-white"}`}>{idx + 1}</div>
                </div>
                <div className="text-white text-sm font-medium">{user.name.split(" ")[0]}</div>
                <div className={`font-cormorant text-2xl font-bold ${idx === 0 ? "text-yellow-400" : idx === 1 ? "text-gray-300" : "text-orange-400"}`}>{progress}%</div>
              </div>
            ))}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="border-b border-white/5">
                {["#", "Участник", "Роль", "Прогресс", "Уровней пройдено", "Подсказок", "Активность"].map(h => (
                  <th key={h} className="text-left text-xs text-gray-500 uppercase tracking-widest px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {userStats.map(({ user, progress, completed, hints }, idx) => (
                <tr key={user.id} className={`border-b border-white/5 transition-colors ${idx === 0 ? "bg-yellow-400/5" : "hover:bg-white/[0.03]"}`}>
                  <td className="px-4 py-3">
                    <span className={`font-cormorant text-lg font-bold ${idx === 0 ? "text-yellow-400" : idx === 1 ? "text-gray-300" : idx === 2 ? "text-orange-400" : "text-gray-600"}`}>{idx + 1}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">{user.avatar}</div>
                      <div className="text-white text-sm">{user.name}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${ROLE_COLORS[user.role]}`}>{ROLE_LABELS[user.role]}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3 min-w-28">
                      <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${idx === 0 ? "bg-gradient-to-r from-yellow-400 to-orange-400" : "bg-gradient-to-r from-blue-500 to-purple-500"}`} style={{ width: `${progress}%` }} />
                      </div>
                      <span className="text-sm text-white font-medium w-10 text-right">{progress}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center"><span className="font-cormorant text-xl text-white font-bold">{completed}</span></td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-sm ${hints > 5 ? "text-red-400" : hints > 0 ? "text-yellow-400" : "text-green-400"}`}>{hints}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-sm">{user.lastSeen}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Profile / Quest Player ───────────────────────────────────────────────────

function ProfileSection({ currentUser, refresh }: { currentUser: User; refresh: () => void }) {
  const [activeQuestId, setActiveQuestId] = useState<string | null>(null);
  const [currentLevelIdx, setCurrentLevelIdx] = useState(0);
  const [answerInput, setAnswerInput] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [hintUsed, setHintUsed] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [wrongAnswer, setWrongAnswer] = useState(false);
  const [message, setMessage] = useState("");
  const [messageSent, setMessageSent] = useState(false);
  const [messages, setMessages] = useState(db.getMessages(currentUser.id));
  const [changePass, setChangePass] = useState(false);
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [passMsg, setPassMsg] = useState("");

  const participants = db.getParticipantsByUser(currentUser.id);
  const allQuests = db.getQuests();
  const accessibleQuests = allQuests.filter(q => {
    const p = participants.find(pt => pt.questId === q.id);
    return p?.accessGranted;
  });

  const activeQuest = accessibleQuests.find(q => q.id === activeQuestId);
  const levels = activeQuest ? db.getLevels(activeQuest.id) : [];
  const currentLevel = levels[currentLevelIdx];
  const participant = activeQuest ? participants.find(p => p.questId === activeQuest.id) : null;

  const handleAnswer = () => {
    if (!currentLevel) return;
    if (answerInput.toLowerCase().trim() === currentLevel.answer.toLowerCase().trim()) {
      setShowSuccess(true);
      const hintsCount = (participant?.hintsUsed ?? 0) + (hintUsed ? 1 : 0);
      db.updateProgress(currentUser.id, activeQuest!.id, currentLevelIdx + 1, hintsCount, levels.length);
      refresh();
    } else {
      setWrongAnswer(true);
      setTimeout(() => setWrongAnswer(false), 1200);
    }
  };

  const nextLevel = () => {
    if (currentLevelIdx + 1 < levels.length) {
      setCurrentLevelIdx(i => i + 1);
      setShowSuccess(false);
      setAnswerInput("");
      setHintUsed(false);
      setShowHint(false);
    }
  };

  const sendMessage = () => {
    if (!message.trim()) return;
    const owner = db.getOwner();
    if (!owner) return;
    db.sendMessage(currentUser.id, owner.id, message);
    setMessageSent(true);
    setMessages(db.getMessages(currentUser.id));
    setTimeout(() => { setMessageSent(false); setMessage(""); }, 2000);
  };

  const savePassword = () => {
    if (newPass.length < 6) { setPassMsg("Пароль должен быть не менее 6 символов"); return; }
    if (newPass !== confirmPass) { setPassMsg("Пароли не совпадают"); return; }
    db.updatePassword(currentUser.id, newPass);
    setPassMsg("✓ Пароль успешно изменён");
    setNewPass(""); setConfirmPass("");
    setTimeout(() => { setPassMsg(""); setChangePass(false); }, 2000);
  };

  const getSiteForQuest = (quest: Quest) => db.getSites().find(s => s.id === quest.siteId);

  return (
    <div className="space-y-6 animate-fade-in">
      {changePass && (
        <Modal title="Изменить пароль" onClose={() => setChangePass(false)}>
          <div className="space-y-4">
            <Input label="Новый пароль" type="password" value={newPass} onChange={e => setNewPass(e.target.value)} placeholder="Минимум 6 символов" />
            <Input label="Подтвердить пароль" type="password" value={confirmPass} onChange={e => setConfirmPass(e.target.value)} placeholder="Повторите пароль" />
            {passMsg && <p className={`text-sm ${passMsg.startsWith("✓") ? "text-green-400" : "text-red-400"}`}>{passMsg}</p>}
            <GoldBtn onClick={savePassword} icon="Lock" className="w-full justify-center">Сохранить пароль</GoldBtn>
            <p className="text-xs text-gray-500 text-center">Подтверждение через SMS будет добавлено в следующей версии</p>
          </div>
        </Modal>
      )}

      <div>
        <h1 className="font-cormorant text-4xl text-white font-bold">Личный кабинет</h1>
        <p className="text-gray-400 mt-1">Ваш путь в мире квестов</p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {/* Profile card */}
        <div className="purple-card rounded-2xl p-6 flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-700 flex items-center justify-center text-white text-2xl font-bold mb-3 ring-4 ring-purple-500/30">
            {currentUser.avatar}
          </div>
          <h3 className="font-cormorant text-xl text-white font-semibold">{currentUser.name}</h3>
          <p className="text-gray-400 text-sm mb-2">{currentUser.email}</p>
          <span className={`text-sm px-3 py-1 rounded-full border mb-4 ${ROLE_COLORS[currentUser.role]}`}>{ROLE_LABELS[currentUser.role]}</span>

          <div className="w-full space-y-2 text-sm mb-4">
            {[
              { label: "Доступных квестов", value: accessibleQuests.length, color: "text-blue-400" },
              { label: "Пройдено уровней", value: participants.reduce((s, p) => s + p.completedLevels, 0), color: "text-green-400" },
              { label: "Подсказок использовано", value: participants.reduce((s, p) => s + p.hintsUsed, 0), color: "text-yellow-400" },
            ].map(s => (
              <div key={s.label} className="flex justify-between bg-white/5 rounded-lg px-3 py-2">
                <span className="text-gray-400">{s.label}</span>
                <span className={`font-medium ${s.color}`}>{s.value}</span>
              </div>
            ))}
          </div>

          <button onClick={() => setChangePass(true)}
            className="w-full mb-3 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 transition-colors text-sm flex items-center justify-center gap-2">
            <Icon name="Lock" size={15} />Изменить пароль
          </button>

          <a href="https://yoomoney.ru/to/410017253212598/0" target="_blank" rel="noopener noreferrer"
            className="gold-btn w-full py-3 rounded-xl flex items-center justify-center gap-2 font-cormorant text-lg">
            <Icon name="CreditCard" size={18} />Оплата
          </a>
        </div>

        {/* Right column */}
        <div className="md:col-span-2 space-y-4">
          {/* Quest access buttons */}
          <div className="blue-card rounded-xl p-4">
            <h3 className="text-gray-400 text-xs uppercase tracking-widest mb-3 flex items-center gap-2">
              <Icon name="Map" size={14} />Доступные квесты
            </h3>
            {accessibleQuests.length === 0 ? (
              <div className="text-center py-6 text-gray-500 text-sm">
                <Icon name="Lock" size={24} className="mx-auto mb-2 opacity-40" />
                Ожидайте, когда владелец откроет доступ к квестам
              </div>
            ) : (
              <div className="space-y-2">
                {accessibleQuests.map(quest => {
                  const site = getSiteForQuest(quest);
                  const p = participants.find(pt => pt.questId === quest.id);
                  return (
                    <button key={quest.id} onClick={() => { setActiveQuestId(quest.id); setCurrentLevelIdx(p?.completedLevels ?? 0); setShowSuccess(false); setAnswerInput(""); setHintUsed(false); setShowHint(false); }}
                      className={`w-full text-left rounded-xl p-4 transition-all border ${activeQuestId === quest.id ? "bg-blue-600/20 border-blue-500/50" : "bg-white/5 border-white/10 hover:border-blue-500/30 hover:bg-blue-500/10"}`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-xs text-gray-500 mb-0.5">{site?.name}</div>
                          <div className="text-white font-cormorant text-lg font-semibold">Начать путь: {quest.title}</div>
                        </div>
                        <div className="text-right flex-shrink-0 ml-3">
                          <div className="text-blue-400 font-cormorant text-xl font-bold">{p?.progress ?? 0}%</div>
                          <div className="text-xs text-gray-500">{p?.completedLevels ?? 0}/{db.getLevels(quest.id).length} уровней</div>
                        </div>
                      </div>
                      {(p?.progress ?? 0) > 0 && (
                        <div className="mt-2 h-1 bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full" style={{ width: `${p?.progress ?? 0}%` }} />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quest player */}
          {activeQuest && currentLevel && (
            <div className="quest-card rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-cormorant text-xl text-white font-semibold">{activeQuest.title}</h3>
                <span className="text-xs text-gray-500 bg-white/5 px-3 py-1 rounded-full">
                  Уровень {currentLevelIdx + 1} / {levels.length}
                </span>
              </div>

              <div className="bg-blue-500/5 border border-blue-500/15 rounded-xl p-4 mb-4">
                <div className="flex items-center gap-2 mb-2 text-purple-400 text-sm">
                  <Icon name={currentLevel.type === "text" ? "Scroll" : currentLevel.type === "image" ? "Image" : currentLevel.type === "audio" ? "Music" : "Video"} size={15} />
                  <span className="capitalize">{currentLevel.title}</span>
                </div>
                <p className="text-white font-cormorant text-lg leading-relaxed">{currentLevel.riddle}</p>
              </div>

              {showHint && (
                <div className="bg-yellow-400/5 border border-yellow-400/20 rounded-lg p-3 mb-4 animate-fade-in">
                  <div className="flex items-center gap-2 text-yellow-400 text-xs mb-1">
                    <Icon name="Lightbulb" size={13} />Подсказка (−10% к результату)
                  </div>
                  <p className="text-yellow-200/70 text-sm">{currentLevel.hint}</p>
                </div>
              )}

              {!showSuccess ? (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <input type="text" value={answerInput} onChange={e => setAnswerInput(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && handleAnswer()}
                      placeholder="Введите ответ одним словом..."
                      className={`flex-1 bg-white/5 border rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none transition-colors ${wrongAnswer ? "border-red-500/60 bg-red-500/5" : "border-white/10 focus:border-blue-500"}`} />
                    <GoldBtn onClick={handleAnswer} icon="ArrowRight">Ответить</GoldBtn>
                  </div>
                  {wrongAnswer && <p className="text-red-400 text-xs animate-fade-in">✗ Неверный ответ, попробуйте ещё раз</p>}
                  {!hintUsed && (
                    <button onClick={() => { setHintUsed(true); setShowHint(true); }}
                      className="text-sm text-gray-500 hover:text-yellow-400 transition-colors flex items-center gap-1.5">
                      <Icon name="Lightbulb" size={14} />Использовать подсказку (−10% к результату)
                    </button>
                  )}
                </div>
              ) : (
                <div className="text-center py-6 animate-fade-in">
                  <button className="gold-btn animate-pulse-gold px-10 py-5 rounded-2xl font-cormorant text-2xl tracking-widest">
                    ⚜ ПРОХОД ОТКРЫТ ⚜
                  </button>
                  {currentLevelIdx + 1 < levels.length ? (
                    <button onClick={nextLevel}
                      className="mt-4 px-6 py-2.5 rounded-lg bg-blue-600/30 border border-blue-500/40 text-blue-300 hover:bg-blue-600/40 transition-colors text-sm flex items-center gap-2 mx-auto">
                      <Icon name="ChevronRight" size={16} />Следующий уровень
                    </button>
                  ) : (
                    <p className="text-green-400 mt-3 text-sm">🏆 Квест полностью пройден! Поздравляем!</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Messages */}
          <div className="blue-card rounded-xl p-4">
            <h3 className="text-gray-400 text-xs uppercase tracking-widest mb-3 flex items-center gap-2">
              <Icon name="MessageSquare" size={14} />Сообщить администратору
            </h3>
            {messages.length > 0 && (
              <div className="space-y-2 mb-3 max-h-32 overflow-y-auto">
                {messages.map(m => (
                  <div key={m.id} className={`text-xs p-2 rounded-lg ${m.fromUserId === currentUser.id ? "bg-blue-500/10 text-blue-300 ml-4" : "bg-white/5 text-gray-300 mr-4"}`}>
                    <div className="opacity-60 mb-0.5">{m.fromUserId === currentUser.id ? "Вы" : "Администратор"} · {m.createdAt}</div>
                    {m.text}
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <input type="text" value={message} onChange={e => setMessage(e.target.value)} onKeyDown={e => e.key === "Enter" && sendMessage()}
                placeholder="Ваше сообщение..."
                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors text-sm" />
              {messageSent
                ? <div className="px-4 py-2.5 text-green-400 text-sm flex items-center gap-1.5 flex-shrink-0"><Icon name="Check" size={15} />Отправлено</div>
                : <button onClick={sendMessage} className="px-4 py-2.5 rounded-lg bg-blue-500/20 border border-blue-500/30 text-blue-300 hover:bg-blue-500/30 transition-colors text-sm flex items-center gap-2 flex-shrink-0">
                    <Icon name="Send" size={15} />Отправить
                  </button>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function Index() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [section, setSection] = useState<Section>("dashboard");
  const [sites, setSites] = useState<Site[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [newSiteName, setNewSiteName] = useState("");
  const [newSiteUrl, setNewSiteUrl] = useState("");
  const [tick, setTick] = useState(0);

  const refresh = useCallback(() => {
    setSites(db.getSites());
    setUsers(db.getUsers());
    setTick(t => t + 1);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    refresh();
    setSection("dashboard");
  };

  const handleAcceptSite = () => {
    if (!newSiteName.trim() || !currentUser) return;
    db.addSite(newSiteName.trim(), newSiteUrl.trim(), currentUser.id);
    setShowAcceptModal(false);
    setNewSiteName(""); setNewSiteUrl("");
    refresh();
    setSection("sites");
  };

  const isManager = currentUser && (currentUser.role === "owner" || currentUser.role === "admin" || currentUser.role === "editor");

  const navItems: { key: Section; label: string; icon: string; managerOnly?: boolean }[] = [
    { key: "dashboard", label: "Панель управления", icon: "LayoutDashboard" },
    { key: "sites", label: "Управление сайтами", icon: "Globe", managerOnly: true },
    { key: "quest-editor", label: "Редактор квестов", icon: "Map", managerOnly: true },
    { key: "members", label: "Участники", icon: "Users", managerOnly: true },
    { key: "achievements", label: "Достижения", icon: "Trophy" },
    { key: "profile", label: "Личный кабинет", icon: "User" },
  ];

  if (!currentUser) return <AuthScreen onLogin={handleLogin} />;

  return (
    <div className="min-h-screen flex">
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {Array.from({ length: 25 }).map((_, i) => (
          <div key={i} className="absolute rounded-full bg-white/20"
            style={{ width: Math.random() * 2 + 0.5 + "px", height: Math.random() * 2 + 0.5 + "px",
              top: Math.random() * 100 + "%", left: Math.random() * 100 + "%" }} />
        ))}
      </div>

      {/* Sidebar */}
      <aside className="fixed top-0 left-0 h-full w-64 z-20 flex flex-col border-r border-white/5"
        style={{ background: "rgba(8,12,35,0.98)", backdropFilter: "blur(20px)" }}>
        <div className="p-5 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center flex-shrink-0"
              style={{ boxShadow: "0 0 20px rgba(99,102,241,0.4)" }}>
              <Icon name="Compass" size={22} className="text-white" />
            </div>
            <div>
              <div className="font-cormorant text-lg text-white font-bold leading-tight">QuestMaster</div>
              <div className="text-xs text-gray-500 leading-tight">Платформа квестов</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {navItems.filter(item => !item.managerOnly || isManager).map(item => (
            <button key={item.key} onClick={() => setSection(item.key)}
              className={`nav-item w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${section === item.key ? "active text-white" : "text-gray-400 hover:text-white"}`}>
              <Icon name={item.icon as string} size={16} className={section === item.key ? "text-yellow-400" : "text-gray-500"} />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-white/5">
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {currentUser.avatar}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-white text-sm font-medium truncate">{currentUser.name.split(" ")[0]}</div>
              <div className={`text-xs truncate ${ROLE_COLORS[currentUser.role].split(" ")[0]}`}>{ROLE_LABELS[currentUser.role]}</div>
            </div>
            <button onClick={() => setCurrentUser(null)} className="text-gray-500 hover:text-red-400 transition-colors flex-shrink-0" title="Выйти">
              <Icon name="LogOut" size={15} />
            </button>
          </div>
        </div>
      </aside>

      {/* Content */}
      <main className="relative z-10 flex-1 ml-64 overflow-auto min-h-screen">
        <div className="p-6 md:p-8 max-w-5xl" key={tick}>
          {section === "dashboard" && currentUser && (
            <DashboardSection currentUser={currentUser} sites={sites} users={users}
              onAcceptSite={() => setShowAcceptModal(true)}
              onAcceptUser={id => db.acceptUser(id)}
              refresh={refresh} />
          )}
          {section === "sites" && <SitesSection sites={sites} onAddSite={() => setShowAcceptModal(true)} refresh={refresh} />}
          {section === "quest-editor" && <QuestEditorSection sites={sites} refresh={refresh} />}
          {section === "members" && currentUser && <MembersSection users={users} currentUser={currentUser} refresh={refresh} />}
          {section === "achievements" && <AchievementsSection users={users} />}
          {section === "profile" && currentUser && <ProfileSection currentUser={currentUser} refresh={refresh} />}
        </div>
      </main>

      {/* Accept Modal */}
      {showAcceptModal && (
        <Modal title="✦ Принять дополнение — новый сайт" onClose={() => setShowAcceptModal(false)}>
          <div className="space-y-4">
            <p className="text-gray-400 text-sm leading-relaxed">
              Новый сайт появится на главной как новый квест (путь) с полным доступом управления.
            </p>
            <Input label="Название сайта" value={newSiteName} onChange={e => setNewSiteName(e.target.value)}
              placeholder="Таинственный замок" autoFocus
              onKeyDown={e => e.key === "Enter" && handleAcceptSite()} />
            <Input label="URL (необязательно)" value={newSiteUrl} onChange={e => setNewSiteUrl(e.target.value)}
              placeholder="zamok.questmaster.app" />
            <GoldBtn onClick={handleAcceptSite} icon="Plus" className="w-full justify-center py-3 font-cormorant text-base"
              disabled={!newSiteName.trim()}>
              Добавить сайт в платформу
            </GoldBtn>
          </div>
        </Modal>
      )}
    </div>
  );
}

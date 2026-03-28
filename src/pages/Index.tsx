import { useState } from "react";
import Icon from "@/components/ui/icon";

// ─── Types ───────────────────────────────────────────────────────────────────

type Role = "owner" | "admin" | "editor" | "member_1" | "member_2" | "member_3";
type Section =
  | "dashboard"
  | "sites"
  | "quest-editor"
  | "members"
  | "achievements"
  | "profile";

interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  avatar: string;
  accessLink: string;
  progress: number;
  completedQuests: number;
  hints: number;
  status: "active" | "pending" | "blocked";
  lastSeen: string;
}

interface QuestLevel {
  id: number;
  title: string;
  type: "text" | "image" | "video" | "audio";
  riddle: string;
  answer: string;
  hint: string;
  order: number;
}

interface Quest {
  id: number;
  title: string;
  description: string;
  levels: QuestLevel[];
  participants: number;
  status: "active" | "draft";
  createdAt: string;
}

interface Site {
  id: number;
  name: string;
  url: string;
  quests: Quest[];
  participants: number;
  status: "active" | "draft";
  createdAt: string;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_USERS: User[] = [
  {
    id: 1, name: "Александр Королёв", email: "korolev@example.com",
    role: "owner", avatar: "АК", accessLink: "https://questmaster.app/q/ak-7f3k",
    progress: 100, completedQuests: 5, hints: 0, status: "active", lastSeen: "сейчас"
  },
  {
    id: 2, name: "Мария Звёздная", email: "maria@example.com",
    role: "admin", avatar: "МЗ", accessLink: "https://questmaster.app/q/mz-9d2p",
    progress: 78, completedQuests: 3, hints: 2, status: "active", lastSeen: "5 мин назад"
  },
  {
    id: 3, name: "Дмитрий Путник", email: "dmitry@example.com",
    role: "editor", avatar: "ДП", accessLink: "https://questmaster.app/q/dp-4r1q",
    progress: 54, completedQuests: 2, hints: 5, status: "active", lastSeen: "1 час назад"
  },
  {
    id: 4, name: "Елена Тайная", email: "elena@example.com",
    role: "member_1", avatar: "ЕТ", accessLink: "https://questmaster.app/q/et-8m5n",
    progress: 32, completedQuests: 1, hints: 8, status: "active", lastSeen: "вчера"
  },
  {
    id: 5, name: "Виктор Загадкин", email: "viktor@example.com",
    role: "member_2", avatar: "ВЗ", accessLink: "https://questmaster.app/q/vz-2l7j",
    progress: 15, completedQuests: 0, hints: 3, status: "pending", lastSeen: "2 дня назад"
  },
  {
    id: 6, name: "Ольга Светлова", email: "olga@example.com",
    role: "member_3", avatar: "ОС", accessLink: "https://questmaster.app/q/os-6h9k",
    progress: 0, completedQuests: 0, hints: 0, status: "pending", lastSeen: "только что"
  },
];

const MOCK_SITES: Site[] = [
  {
    id: 1, name: "Городские Тайны", url: "gorteyny.questmaster.app",
    participants: 12, status: "active", createdAt: "2026-01-10",
    quests: [
      {
        id: 1, title: "Путь детектива", description: "Раскройте тайны старого города",
        participants: 8, status: "active", createdAt: "2026-01-15",
        levels: [
          { id: 1, title: "Первый след", type: "text", riddle: "Что читают все, но никто не держит в руках?", answer: "газета", hint: "Это ежедневная публикация", order: 1 },
          { id: 2, title: "Загадка улицы", type: "image", riddle: "Найдите скрытое число на фотографии фасада", answer: "1847", hint: "Смотрите на верхний угол здания", order: 2 },
          { id: 3, title: "Шифр подвала", type: "audio", riddle: "Прослушайте и угадайте место", answer: "вокзал", hint: "Звуки транспорта", order: 3 },
        ]
      },
      {
        id: 2, title: "Лабиринт времени", description: "Путешествие сквозь эпохи",
        participants: 4, status: "active", createdAt: "2026-02-01",
        levels: [
          { id: 4, title: "Начало пути", type: "text", riddle: "В каком году основан город?", answer: "1703", hint: "Это век Петра Великого", order: 1 },
        ]
      }
    ]
  },
  {
    id: 2, name: "Лесной Квест", url: "lesnoy.questmaster.app",
    participants: 6, status: "active", createdAt: "2026-02-15",
    quests: [
      {
        id: 3, title: "Тропа исследователя", description: "Откройте тайны природы",
        participants: 6, status: "draft", createdAt: "2026-02-20",
        levels: []
      }
    ]
  }
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ROLE_LABELS: Record<Role, string> = {
  owner: "Владелец",
  admin: "Администратор",
  editor: "Редактор",
  member_1: "Участник I",
  member_2: "Участник II",
  member_3: "Участник III",
};

const ROLE_COLORS: Record<Role, string> = {
  owner: "text-yellow-400 bg-yellow-400/10 border-yellow-400/30",
  admin: "text-blue-400 bg-blue-400/10 border-blue-400/30",
  editor: "text-purple-400 bg-purple-400/10 border-purple-400/30",
  member_1: "text-green-400 bg-green-400/10 border-green-400/30",
  member_2: "text-cyan-400 bg-cyan-400/10 border-cyan-400/30",
  member_3: "text-pink-400 bg-pink-400/10 border-pink-400/30",
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function GoldButton({ children, onClick, className = "", icon }: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  icon?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`gold-btn px-5 py-2.5 rounded-lg font-golos text-sm flex items-center gap-2 cursor-pointer ${className}`}
    >
      {icon && <Icon name={icon as string} size={16} />}
      {children}
    </button>
  );
}

function Modal({ title, children, onClose }: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative blue-card rounded-2xl p-6 w-full max-w-md mx-4 animate-scale-in"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-cormorant text-xl text-white font-semibold">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <Icon name="X" size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function InviteModal({ type, onClose }: {
  type: "telegram" | "vk" | "sms";
  onClose: () => void;
}) {
  const [value, setValue] = useState("");
  const [sent, setSent] = useState(false);

  const config = {
    telegram: { title: "Пригласить в Telegram", placeholder: "@username или +79XXXXXXXXX", icon: "Send", label: "Telegram-адрес" },
    vk: { title: "Пригласить ВКонтакте", placeholder: "vk.com/username или id12345", icon: "Users", label: "Профиль ВКонтакте" },
    sms: { title: "Пригласить по SMS", placeholder: "+7 (___) ___-__-__", icon: "Smartphone", label: "Номер телефона" },
  }[type];

  const inviteLink = "https://questmaster.app/join/7f3k-abc";

  const handleSend = () => {
    if (!value.trim()) return;
    setSent(true);
    setTimeout(() => { setSent(false); onClose(); }, 1500);
  };

  return (
    <Modal title={config.title} onClose={onClose}>
      <div className="space-y-4">
        <div>
          <label className="text-sm text-gray-400 mb-1.5 block">{config.label}</label>
          <input
            type="text"
            value={value}
            onChange={e => setValue(e.target.value)}
            placeholder={config.placeholder}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
          <p className="text-xs text-gray-400 mb-1">Ссылка приглашения:</p>
          <div className="flex items-center gap-2">
            <code className="text-blue-400 text-xs flex-1 truncate">{inviteLink}</code>
            <button
              onClick={() => navigator.clipboard.writeText(inviteLink)}
              className="text-gray-400 hover:text-blue-400 transition-colors flex-shrink-0"
            >
              <Icon name="Copy" size={14} />
            </button>
          </div>
        </div>
        {sent
          ? <div className="text-center text-green-400 py-2 animate-fade-in">✓ Приглашение отправлено!</div>
          : <GoldButton onClick={handleSend} icon={config.icon} className="w-full justify-center">
              Отправить приглашение
            </GoldButton>
        }
      </div>
    </Modal>
  );
}

// ─── Sections ─────────────────────────────────────────────────────────────────

function DashboardSection({ sites, users, onAcceptSite }: {
  sites: Site[];
  users: User[];
  onAcceptSite: () => void;
}) {
  const pendingUsers = users.filter(u => u.status === "pending");
  const totalQuests = sites.reduce((s, site) => s + site.quests.length, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-cormorant text-4xl text-white font-bold">Панель управления</h1>
          <p className="text-gray-400 mt-1">Добро пожаловать в QuestMaster</p>
        </div>
        <GoldButton onClick={onAcceptSite} icon="Plus">
          Принять дополнение
        </GoldButton>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Сайтов", value: sites.length, icon: "Globe", color: "text-blue-400" },
          { label: "Квестов", value: totalQuests, icon: "Map", color: "text-purple-400" },
          { label: "Участников", value: users.length, icon: "Users", color: "text-green-400" },
          { label: "Ожидают", value: pendingUsers.length, icon: "Clock", color: "text-yellow-400" },
        ].map((stat) => (
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
          {sites.map((site, idx) => (
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
                  <p className="text-gray-400 text-sm mt-0.5">{site.url}</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-cormorant text-blue-400 font-bold">{site.quests.length}</div>
                  <div className="text-xs text-gray-500">квестов</div>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm text-gray-400">
                <div className="flex items-center gap-1.5">
                  <Icon name="Users" size={14} />
                  {site.participants} участников
                </div>
                <div className="flex items-center gap-1.5">
                  <Icon name="Calendar" size={14} />
                  {site.createdAt}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {pendingUsers.length > 0 && (
        <div>
          <h2 className="font-cormorant text-2xl text-white font-semibold mb-4">Запросы на участие</h2>
          <div className="space-y-2">
            {pendingUsers.map(user => (
              <div key={user.id} className="blue-card rounded-xl p-4 flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                    {user.avatar}
                  </div>
                  <div>
                    <div className="text-white font-medium">{user.name}</div>
                    <div className="text-gray-400 text-sm">{user.email}</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="px-4 py-1.5 rounded-lg bg-green-500/20 text-green-400 border border-green-500/30 text-sm hover:bg-green-500/30 transition-colors flex items-center gap-1.5">
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

function SitesSection({ sites, onAddSite }: {
  sites: Site[];
  onAddSite: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const integrationData = `{
  "platform": "QuestMaster",
  "version": "1.0",
  "apiEndpoint": "https://api.questmaster.app",
  "projectId": "qm_proj_7f3k9d2p",
  "authToken": "REPLACE_WITH_YOUR_TOKEN",
  "webhookUrl": "https://questmaster.app/webhook/sites",
  "schema": {
    "quests": { "endpoint": "/quests", "methods": ["GET","POST","PUT"] },
    "levels": { "endpoint": "/levels", "methods": ["GET","POST","PUT","DELETE"] },
    "participants": { "endpoint": "/participants", "methods": ["GET","POST"] },
    "achievements": { "endpoint": "/achievements", "methods": ["GET"] }
  },
  "ui": {
    "answerField": true,
    "hintsEnabled": true,
    "goldButtonOnSuccess": true
  }
}`;

  const handleCopyIntegration = () => {
    navigator.clipboard.writeText(
      `Создай сайт квеста с интеграцией в платформу QuestMaster. Используй следующие данные подключения:\n\n${integrationData}\n\nСайт должен поддерживать: регистрацию участников, прохождение квестов с вводом ответов, отображение подсказок, анимацию "Проход открыт" после верного ответа, личный кабинет с прогрессом и кнопкой оплаты ЮМани.`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-cormorant text-4xl text-white font-bold">Управление сайтами</h1>
          <p className="text-gray-400 mt-1">Добавляйте и настраивайте сайты-квесты</p>
        </div>
        <GoldButton onClick={onAddSite} icon="Plus">Добавить сайт</GoldButton>
      </div>

      <div className="purple-card rounded-xl p-5">
        <div className="flex items-start justify-between mb-3 gap-3 flex-wrap">
          <div>
            <h3 className="font-cormorant text-xl text-white font-semibold flex items-center gap-2">
              <Icon name="Link" size={20} className="text-purple-400" />
              Данные интеграции для нового сайта
            </h3>
            <p className="text-gray-400 text-sm mt-1">
              Скопируйте и вставьте в запрос к ИИ-генератору — он создаст готовый сайт
            </p>
          </div>
          <button
            onClick={handleCopyIntegration}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all text-sm flex-shrink-0 ${
              copied
                ? "bg-green-500/20 border-green-500/40 text-green-400"
                : "bg-purple-500/20 border-purple-500/40 text-purple-300 hover:bg-purple-500/30"
            }`}
          >
            <Icon name={copied ? "Check" : "Copy"} size={15} />
            {copied ? "Скопировано!" : "Скопировать данные интеграции"}
          </button>
        </div>
        <pre className="bg-black/30 rounded-lg p-4 text-xs text-gray-300 overflow-auto max-h-48 border border-white/5">
          {integrationData}
        </pre>
      </div>

      <div className="space-y-4">
        {sites.map((site) => (
          <div key={site.id} className="quest-card rounded-xl p-5">
            <div className="flex items-start justify-between mb-4 gap-3">
              <div>
                <h3 className="font-cormorant text-2xl text-white font-semibold">{site.name}</h3>
                <p className="text-blue-400 text-sm flex items-center gap-1 mt-0.5">
                  <Icon name="ExternalLink" size={12} />
                  {site.url}
                </p>
              </div>
              <div className="flex gap-2">
                <button className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 transition-colors">
                  <Icon name="Settings" size={16} />
                </button>
                <button className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-colors">
                  <Icon name="Trash2" size={16} />
                </button>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 mb-4">
              {[
                { label: "Квестов", value: site.quests.length },
                { label: "Участников", value: site.participants },
                { label: "Уровней", value: site.quests.reduce((s, q) => s + q.levels.length, 0) },
              ].map(s => (
                <div key={s.label} className="bg-white/5 rounded-lg p-3 text-center">
                  <div className="text-xl font-cormorant text-white font-bold">{s.value}</div>
                  <div className="text-xs text-gray-400">{s.label}</div>
                </div>
              ))}
            </div>
            <div className="flex gap-2 flex-wrap">
              {site.quests.map(q => (
                <span key={q.id} className="text-xs px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300">
                  {q.title}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function QuestEditorSection({ sites }: { sites: Site[] }) {
  const [selectedSite, setSelectedSite] = useState<Site>(sites[0]);
  const [selectedQuest, setSelectedQuest] = useState<Quest | null>(sites[0]?.quests[0] || null);
  const [showAddLevel, setShowAddLevel] = useState(false);
  const [newLevel, setNewLevel] = useState({ title: "", type: "text" as QuestLevel["type"], riddle: "", answer: "", hint: "" });

  return (
    <div className="space-y-6 animate-fade-in">
      {showAddLevel && (
        <Modal title="Добавить уровень" onClose={() => setShowAddLevel(false)}>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-400 mb-1.5 block">Название уровня</label>
              <input
                type="text"
                value={newLevel.title}
                onChange={e => setNewLevel({...newLevel, title: e.target.value})}
                placeholder="Например: Тайна старого дома"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-1.5 block">Тип загадки</label>
              <div className="grid grid-cols-4 gap-2">
                {(["text","image","video","audio"] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => setNewLevel({...newLevel, type: t})}
                    className={`py-2 px-3 rounded-lg text-xs flex flex-col items-center gap-1 transition-all border ${
                      newLevel.type === t
                        ? "bg-purple-500/20 border-purple-500/50 text-purple-300"
                        : "bg-white/5 border-white/10 text-gray-400 hover:border-white/20"
                    }`}
                  >
                    <Icon name={t === "text" ? "FileText" : t === "image" ? "Image" : t === "audio" ? "Music" : "Video"} size={16} />
                    {t === "text" ? "Текст" : t === "image" ? "Картинка" : t === "audio" ? "Аудио" : "Видео"}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-1.5 block">Загадка</label>
              <textarea
                value={newLevel.riddle}
                onChange={e => setNewLevel({...newLevel, riddle: e.target.value})}
                placeholder="Текст загадки или описание..."
                rows={3}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors resize-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-gray-400 mb-1.5 block">Правильный ответ</label>
                <input
                  type="text"
                  value={newLevel.answer}
                  onChange={e => setNewLevel({...newLevel, answer: e.target.value})}
                  placeholder="Одно слово..."
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-green-500 transition-colors"
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1.5 block">Подсказка</label>
                <input
                  type="text"
                  value={newLevel.hint}
                  onChange={e => setNewLevel({...newLevel, hint: e.target.value})}
                  placeholder="Небольшая подсказка..."
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500 transition-colors"
                />
              </div>
            </div>
            <GoldButton onClick={() => setShowAddLevel(false)} icon="Save" className="w-full justify-center">
              Сохранить уровень
            </GoldButton>
          </div>
        </Modal>
      )}

      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-cormorant text-4xl text-white font-bold">Редактор квестов</h1>
          <p className="text-gray-400 mt-1">Создавайте пути, уровни и загадки</p>
        </div>
        <GoldButton icon="Plus">Новый квест</GoldButton>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="blue-card rounded-xl p-4">
          <h3 className="text-gray-400 text-xs uppercase tracking-widest mb-3">Сайт</h3>
          <div className="space-y-2">
            {sites.map(site => (
              <button
                key={site.id}
                onClick={() => { setSelectedSite(site); setSelectedQuest(site.quests[0] || null); }}
                className={`w-full text-left px-3 py-2.5 rounded-lg transition-all text-sm ${
                  selectedSite.id === site.id
                    ? "bg-blue-500/20 border border-blue-500/40 text-white"
                    : "text-gray-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                <div className="font-medium">{site.name}</div>
                <div className="text-xs opacity-60">{site.quests.length} квестов</div>
              </button>
            ))}
          </div>
        </div>

        <div className="blue-card rounded-xl p-4">
          <h3 className="text-gray-400 text-xs uppercase tracking-widest mb-3">Квест (путь)</h3>
          <div className="space-y-2 mb-3">
            {selectedSite.quests.map(quest => (
              <button
                key={quest.id}
                onClick={() => setSelectedQuest(quest)}
                className={`w-full text-left px-3 py-2.5 rounded-lg transition-all text-sm ${
                  selectedQuest?.id === quest.id
                    ? "bg-purple-500/20 border border-purple-500/40 text-white"
                    : "text-gray-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                <div className="font-medium">{quest.title}</div>
                <div className="text-xs opacity-60">{quest.levels.length} уровней</div>
              </button>
            ))}
          </div>
          <button className="w-full text-xs py-2 rounded-lg border border-dashed border-white/10 text-gray-500 hover:border-blue-500/40 hover:text-blue-400 transition-colors flex items-center justify-center gap-1.5">
            <Icon name="Plus" size={13} />Новый путь
          </button>
        </div>

        <div className="blue-card rounded-xl p-4">
          <h3 className="text-gray-400 text-xs uppercase tracking-widest mb-3">Уровни</h3>
          {selectedQuest ? (
            <div className="space-y-2">
              {selectedQuest.levels.map(level => (
                <div key={level.id} className="bg-white/5 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-white text-sm font-medium">{level.title}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
                      {level.type === "text" ? "Текст" : level.type === "image" ? "Картинка" : level.type === "audio" ? "Аудио" : "Видео"}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 truncate">{level.riddle}</div>
                </div>
              ))}
              <button
                onClick={() => setShowAddLevel(true)}
                className="w-full text-xs py-2 rounded-lg border border-dashed border-white/10 text-gray-500 hover:border-purple-500/40 hover:text-purple-400 transition-colors flex items-center justify-center gap-1.5"
              >
                <Icon name="Plus" size={13} />Добавить уровень
              </button>
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8 text-sm">Выберите квест</div>
          )}
        </div>
      </div>

      {selectedQuest && selectedQuest.levels.length > 0 && (
        <div>
          <h2 className="font-cormorant text-2xl text-white font-semibold mb-4">
            Уровни квеста «{selectedQuest.title}»
          </h2>
          <div className="space-y-3">
            {selectedQuest.levels.map((level, idx) => (
              <div key={level.id} className="quest-card rounded-xl p-5">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center text-white font-cormorant text-lg font-bold flex-shrink-0">
                    {idx + 1}
                  </div>
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
                      <span className="flex items-center gap-1">
                        <Icon name="Key" size={11} />Ответ: <span className="text-green-400 ml-1">{level.answer}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Icon name="Lightbulb" size={11} />Подсказка: <span className="text-yellow-400/70 ml-1">{level.hint}</span>
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button className="p-2 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors">
                      <Icon name="Edit2" size={14} />
                    </button>
                    <button className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors">
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

function MembersSection({ users }: { users: User[] }) {
  const [inviteModal, setInviteModal] = useState<"telegram" | "vk" | "sms" | null>(null);

  return (
    <div className="space-y-6 animate-fade-in">
      {inviteModal && (
        <InviteModal type={inviteModal} onClose={() => setInviteModal(null)} />
      )}

      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-cormorant text-4xl text-white font-bold">Участники</h1>
          <p className="text-gray-400 mt-1">Управление ролями и доступом</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <GoldButton icon="Mail">По почте</GoldButton>
          <button
            onClick={() => setInviteModal("telegram")}
            className="px-4 py-2.5 rounded-lg bg-blue-500/20 border border-blue-500/40 text-blue-300 hover:bg-blue-500/30 transition-all text-sm flex items-center gap-2"
          >
            <Icon name="Send" size={15} />Telegram
          </button>
          <button
            onClick={() => setInviteModal("vk")}
            className="px-4 py-2.5 rounded-lg bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 hover:bg-indigo-500/30 transition-all text-sm flex items-center gap-2"
          >
            <Icon name="Users" size={15} />ВКонтакте
          </button>
          <button
            onClick={() => setInviteModal("sms")}
            className="px-4 py-2.5 rounded-lg bg-green-500/20 border border-green-500/40 text-green-300 hover:bg-green-500/30 transition-all text-sm flex items-center gap-2"
          >
            <Icon name="Smartphone" size={15} />SMS
          </button>
        </div>
      </div>

      <div className="blue-card rounded-xl p-4">
        <h3 className="text-gray-400 text-xs uppercase tracking-widest mb-3">Иерархия ролей</h3>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(ROLE_LABELS) as Role[]).map(role => (
            <div key={role} className={`px-3 py-1.5 rounded-lg border text-xs font-medium ${ROLE_COLORS[role]}`}>
              {ROLE_LABELS[role]}
            </div>
          ))}
        </div>
      </div>

      <div className="blue-card rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="border-b border-white/5">
                {["Участник", "Роль", "Прогресс", "Квестов", "Подсказок", "Статус", "Действия"].map(h => (
                  <th key={h} className="text-left text-xs text-gray-500 uppercase tracking-widest px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id} className="border-b border-white/5 hover:bg-white/[0.03] transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {user.avatar}
                      </div>
                      <div>
                        <div className="text-white text-sm font-medium">{user.name}</div>
                        <div className="text-gray-500 text-xs">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2.5 py-1 rounded-full border ${ROLE_COLORS[user.role]}`}>
                      {ROLE_LABELS[user.role]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 min-w-24">
                      <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                          style={{ width: `${user.progress}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-400 w-8 text-right">{user.progress}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center text-white text-sm">{user.completedQuests}</td>
                  <td className="px-4 py-3 text-center text-yellow-400/70 text-sm">{user.hints}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      user.status === "active" ? "bg-green-500/20 text-green-400" :
                      user.status === "pending" ? "bg-yellow-500/20 text-yellow-400" :
                      "bg-red-500/20 text-red-400"
                    }`}>
                      {user.status === "active" ? "Активен" : user.status === "pending" ? "Ожидает" : "Заблокирован"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1.5">
                      {user.status === "pending" && (
                        <button className="p-1.5 rounded bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors" title="Принять">
                          <Icon name="Check" size={13} />
                        </button>
                      )}
                      <button className="p-1.5 rounded bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors" title="Доступ к квестам">
                        <Icon name="Key" size={13} />
                      </button>
                      <button className="p-1.5 rounded bg-white/5 text-gray-400 hover:bg-white/10 transition-colors" title="Редактировать">
                        <Icon name="Edit2" size={13} />
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

function AchievementsSection({ users }: { users: User[] }) {
  const sorted = [...users].sort((a, b) => b.progress - a.progress);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-cormorant text-4xl text-white font-bold">Таблица достижений</h1>
        <p className="text-gray-400 mt-1">Прогресс участников в реальном времени</p>
      </div>

      <div className="quest-card rounded-2xl overflow-hidden">
        <div className="p-6 grid grid-cols-3 gap-4 border-b border-white/5">
          {sorted.slice(0, 3).map((user, idx) => (
            <div key={user.id} className="text-center">
              <div className="relative inline-block mb-2">
                <div className={`w-14 h-14 rounded-full bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center text-white text-lg font-bold mx-auto ${idx === 0 ? "ring-2 ring-yellow-400 ring-offset-2 ring-offset-transparent" : ""}`}>
                  {user.avatar}
                </div>
                <div className={`absolute -top-2 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  idx === 0 ? "bg-yellow-400 text-black" :
                  idx === 1 ? "bg-gray-300 text-black" :
                  "bg-orange-700 text-white"
                }`}>{idx + 1}</div>
              </div>
              <div className="text-white text-sm font-medium">{user.name.split(" ")[0]}</div>
              <div className={`font-cormorant text-2xl font-bold ${
                idx === 0 ? "text-yellow-400" : idx === 1 ? "text-gray-300" : "text-orange-400"
              }`}>{user.progress}%</div>
            </div>
          ))}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="border-b border-white/5">
                {["#", "Участник", "Роль", "Прогресс", "Квестов", "Подсказок", "Активность"].map(h => (
                  <th key={h} className="text-left text-xs text-gray-500 uppercase tracking-widest px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((user, idx) => (
                <tr key={user.id} className={`border-b border-white/5 transition-colors ${idx === 0 ? "bg-yellow-400/5" : "hover:bg-white/[0.03]"}`}>
                  <td className="px-4 py-3">
                    <span className={`font-cormorant text-lg font-bold ${
                      idx === 0 ? "text-yellow-400" : idx === 1 ? "text-gray-300" : idx === 2 ? "text-orange-400" : "text-gray-600"
                    }`}>{idx + 1}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {user.avatar}
                      </div>
                      <div className="text-white text-sm">{user.name}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${ROLE_COLORS[user.role]}`}>
                      {ROLE_LABELS[user.role]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3 min-w-28">
                      <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${idx === 0 ? "bg-gradient-to-r from-yellow-400 to-orange-400" : "bg-gradient-to-r from-blue-500 to-purple-500"}`}
                          style={{ width: `${user.progress}%` }}
                        />
                      </div>
                      <span className="text-sm text-white font-medium w-10 text-right">{user.progress}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="font-cormorant text-xl text-white font-bold">{user.completedQuests}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-sm ${user.hints > 5 ? "text-red-400" : user.hints > 0 ? "text-yellow-400" : "text-green-400"}`}>
                      {user.hints}
                    </span>
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

function ProfileSection({ user }: { user: User }) {
  const [answerInput, setAnswerInput] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [hintUsed, setHintUsed] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [message, setMessage] = useState("");
  const [messageSent, setMessageSent] = useState(false);
  const [wrongAnswer, setWrongAnswer] = useState(false);

  const currentLevel: QuestLevel = {
    id: 1, title: "Тайна городской площади", type: "text",
    riddle: "Что стоит посреди города, видно всем, но никто не замечает? (подсказка: попробуйте ввести слово «тень»)",
    answer: "тень", hint: "Думайте о солнечном свете и его отражении на земле", order: 1
  };

  const handleAnswer = () => {
    if (answerInput.toLowerCase().trim() === currentLevel.answer) {
      setShowSuccess(true);
      setWrongAnswer(false);
    } else {
      setWrongAnswer(true);
      setTimeout(() => setWrongAnswer(false), 1200);
    }
  };

  const handleHint = () => {
    setHintUsed(true);
    setShowHint(true);
  };

  const handleSendMessage = () => {
    if (!message.trim()) return;
    setMessageSent(true);
    setTimeout(() => { setMessageSent(false); setMessage(""); }, 2000);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-cormorant text-4xl text-white font-bold">Личный кабинет</h1>
        <p className="text-gray-400 mt-1">Ваш путь в мире квестов</p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="purple-card rounded-2xl p-6 flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-700 flex items-center justify-center text-white text-2xl font-bold mb-3 ring-4 ring-purple-500/30">
            {user.avatar}
          </div>
          <h3 className="font-cormorant text-xl text-white font-semibold">{user.name}</h3>
          <p className="text-gray-400 text-sm mb-3">{user.email}</p>
          <span className={`text-sm px-3 py-1 rounded-full border mb-4 ${ROLE_COLORS[user.role]}`}>
            {ROLE_LABELS[user.role]}
          </span>
          <div className="w-full space-y-2 text-sm">
            {[
              { label: "Квестов пройдено", value: user.completedQuests, color: "text-green-400" },
              { label: "Подсказок использовано", value: user.hints, color: "text-yellow-400" },
              { label: "Общий прогресс", value: `${user.progress}%`, color: "text-blue-400" },
            ].map(s => (
              <div key={s.label} className="flex justify-between bg-white/5 rounded-lg px-3 py-2">
                <span className="text-gray-400">{s.label}</span>
                <span className={`font-medium ${s.color}`}>{s.value}</span>
              </div>
            ))}
          </div>

          <a
            href="https://yoomoney.ru/to/410017253212598/0"
            target="_blank"
            rel="noopener noreferrer"
            className="gold-btn mt-5 w-full py-3 rounded-xl flex items-center justify-center gap-2 font-cormorant text-lg"
          >
            <Icon name="CreditCard" size={18} />
            Оплата
          </a>
        </div>

        <div className="md:col-span-2 space-y-4">
          <div className="blue-card rounded-xl p-4">
            <h3 className="text-gray-400 text-xs uppercase tracking-widest mb-3 flex items-center gap-2">
              <Icon name="Link" size={14} />Ваши уникальные ссылки доступа
            </h3>
            <div className="space-y-2">
              {["Городские Тайны", "Лесной Квест"].map((name, i) => {
                const link = `https://questmaster.app/q/${user.id}-${name.toLowerCase().replace(/ /g, "-")}-${["7f3k", "9d2p"][i]}`;
                return (
                  <div key={name} className="flex items-center gap-2 bg-white/5 rounded-lg p-2.5">
                    <div className="flex-1 truncate">
                      <span className="text-gray-400 text-xs mr-2">{name}:</span>
                      <code className="text-blue-400 text-xs">{link}</code>
                    </div>
                    <button
                      onClick={() => navigator.clipboard.writeText(link)}
                      className="text-gray-500 hover:text-blue-400 transition-colors flex-shrink-0"
                      title="Скопировать"
                    >
                      <Icon name="Copy" size={14} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="quest-card rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-cormorant text-xl text-white font-semibold">Текущий уровень</h3>
              <span className="text-xs text-gray-500 bg-white/5 px-3 py-1 rounded-full">Уровень 1 / 3</span>
            </div>
            <div className="bg-blue-500/5 border border-blue-500/15 rounded-xl p-4 mb-4">
              <div className="flex items-center gap-2 mb-2 text-purple-400 text-sm">
                <Icon name="Scroll" size={15} />
                <span>Загадка</span>
              </div>
              <p className="text-white font-cormorant text-lg leading-relaxed">{currentLevel.riddle}</p>
            </div>

            {showHint && (
              <div className="bg-yellow-400/5 border border-yellow-400/20 rounded-lg p-3 mb-4 animate-fade-in">
                <div className="flex items-center gap-2 text-yellow-400 text-xs mb-1">
                  <Icon name="Lightbulb" size={13} />
                  <span>Подсказка (влияет на итоговый результат)</span>
                </div>
                <p className="text-yellow-200/70 text-sm">{currentLevel.hint}</p>
              </div>
            )}

            {!showSuccess ? (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={answerInput}
                    onChange={e => setAnswerInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleAnswer()}
                    placeholder="Введите ответ одним словом..."
                    className={`flex-1 bg-white/5 border rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none transition-colors ${
                      wrongAnswer ? "border-red-500/60 bg-red-500/5" : "border-white/10 focus:border-blue-500"
                    }`}
                  />
                  <GoldButton onClick={handleAnswer} icon="ArrowRight">Ответить</GoldButton>
                </div>
                {wrongAnswer && (
                  <p className="text-red-400 text-xs animate-fade-in">✗ Неверный ответ, попробуйте ещё раз</p>
                )}
                {!hintUsed && (
                  <button
                    onClick={handleHint}
                    className="text-sm text-gray-500 hover:text-yellow-400 transition-colors flex items-center gap-1.5"
                  >
                    <Icon name="Lightbulb" size={14} />
                    Использовать подсказку
                  </button>
                )}
              </div>
            ) : (
              <div className="text-center py-6 animate-fade-in">
                <button className="gold-btn animate-pulse-gold px-10 py-5 rounded-2xl font-cormorant text-2xl tracking-widest">
                  ⚜ ПРОХОД ОТКРЫТ ⚜
                </button>
                <p className="text-gray-400 text-sm mt-3">Поздравляем! Следующий уровень разблокирован.</p>
              </div>
            )}
          </div>

          <div className="blue-card rounded-xl p-4">
            <h3 className="text-gray-400 text-xs uppercase tracking-widest mb-3 flex items-center gap-2">
              <Icon name="MessageSquare" size={14} />Сообщить
            </h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={message}
                onChange={e => setMessage(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSendMessage()}
                placeholder="Ваше сообщение владельцу или администратору..."
                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors text-sm"
              />
              {messageSent
                ? <div className="px-4 py-2.5 text-green-400 text-sm flex items-center gap-1.5 flex-shrink-0">
                    <Icon name="Check" size={15} />Отправлено
                  </div>
                : <button
                    onClick={handleSendMessage}
                    className="px-4 py-2.5 rounded-lg bg-blue-500/20 border border-blue-500/30 text-blue-300 hover:bg-blue-500/30 transition-colors text-sm flex items-center gap-2 flex-shrink-0"
                  >
                    <Icon name="Send" size={15} />Отправить
                  </button>
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Auth Screen ──────────────────────────────────────────────────────────────

function AuthScreen({ onLogin }: { onLogin: (email: string, role: Role) => void }) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = () => {
    if (!email || !password) { setError("Заполните все поля"); return; }
    setError("");
    const isOwner = email.includes("owner") || email.includes("admin");
    onLogin(email, isOwner ? "owner" : "member_1");
  };

  return (
    <div className="min-h-screen mystical-bg flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({length: 40}).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              width: Math.random() * 2.5 + 0.5 + "px",
              height: Math.random() * 2.5 + 0.5 + "px",
              top: Math.random() * 100 + "%",
              left: Math.random() * 100 + "%",
              opacity: Math.random() * 0.5 + 0.1,
              animation: `float ${4 + Math.random() * 6}s ease-in-out infinite`,
              animationDelay: Math.random() * 4 + "s",
            }}
          />
        ))}
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-600 to-purple-700 mb-4 animate-float"
            style={{ boxShadow: "0 0 40px rgba(99,102,241,0.5), 0 0 80px rgba(59,130,246,0.2)" }}
          >
            <Icon name="Compass" size={38} className="text-white" />
          </div>
          <h1 className="font-cormorant text-5xl text-white font-bold tracking-wide">QuestMaster</h1>
          <p className="text-gray-400 mt-2 font-cormorant text-lg italic">Платформа управления квестами</p>
        </div>

        <div className="quest-card rounded-2xl p-8">
          <div className="flex rounded-xl bg-white/5 p-1 mb-6">
            {(["login", "register"] as const).map(m => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(""); }}
                className={`flex-1 py-2.5 rounded-lg text-sm transition-all font-medium ${
                  mode === m ? "bg-blue-600 text-white shadow-lg" : "text-gray-400 hover:text-white"
                }`}
              >
                {m === "login" ? "Вход" : "Регистрация"}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            {mode === "register" && (
              <div>
                <label className="text-sm text-gray-400 mb-1.5 block">Имя</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Ваше имя"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            )}
            <div>
              <label className="text-sm text-gray-400 mb-1.5 block">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSubmit()}
                placeholder="your@email.com"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-1.5 block">Пароль</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSubmit()}
                placeholder="••••••••"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
            {mode === "login" && (
              <div className="text-right">
                <button className="text-sm text-blue-400 hover:text-blue-300 transition-colors">
                  Забыли пароль? Восстановить через SMS
                </button>
              </div>
            )}
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <GoldButton
              onClick={handleSubmit}
              className="w-full justify-center py-3 font-cormorant text-lg"
              icon={mode === "login" ? "LogIn" : "UserPlus"}
            >
              {mode === "login" ? "Войти в систему" : "Создать аккаунт"}
            </GoldButton>
          </div>

          {mode === "login" && (
            <p className="text-center text-xs text-gray-600 mt-4">
              Для демо владельца введите email со словом "owner"
            </p>
          )}
        </div>

        <p className="text-center text-gray-600 text-xs mt-4">
          QuestMaster © 2026 — Платформа квестов нового поколения
        </p>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function Index() {
  const [isAuth, setIsAuth] = useState(false);
  const [currentUser, setCurrentUser] = useState<User>(MOCK_USERS[0]);
  const [section, setSection] = useState<Section>("dashboard");
  const [sites, setSites] = useState<Site[]>(MOCK_SITES);
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [newSiteName, setNewSiteName] = useState("");
  const [newSiteUrl, setNewSiteUrl] = useState("");

  const isOwnerOrAdmin = currentUser.role === "owner" || currentUser.role === "admin" || currentUser.role === "editor";

  const handleLogin = (_email: string, role: Role) => {
    setCurrentUser({ ...MOCK_USERS[0], role });
    setIsAuth(true);
    setSection("dashboard");
  };

  const handleAcceptSite = () => {
    if (!newSiteName.trim()) return;
    const newSite: Site = {
      id: sites.length + 1,
      name: newSiteName,
      url: `${newSiteUrl || newSiteName.toLowerCase().replace(/ /g, "-")}.questmaster.app`,
      quests: [],
      participants: 0,
      status: "draft",
      createdAt: new Date().toISOString().split("T")[0],
    };
    setSites(prev => [...prev, newSite]);
    setShowAcceptModal(false);
    setNewSiteName("");
    setNewSiteUrl("");
    setSection("sites");
  };

  const navItems: { key: Section; label: string; icon: string; ownerOnly?: boolean }[] = [
    { key: "dashboard", label: "Панель управления", icon: "LayoutDashboard" },
    { key: "sites", label: "Управление сайтами", icon: "Globe", ownerOnly: true },
    { key: "quest-editor", label: "Редактор квестов", icon: "Map", ownerOnly: true },
    { key: "members", label: "Участники", icon: "Users", ownerOnly: true },
    { key: "achievements", label: "Достижения", icon: "Trophy" },
    { key: "profile", label: "Личный кабинет", icon: "User" },
  ];

  if (!isAuth) return <AuthScreen onLogin={handleLogin} />;

  return (
    <div className="min-h-screen flex">
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {Array.from({length: 25}).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white/20"
            style={{
              width: Math.random() * 2 + 0.5 + "px",
              height: Math.random() * 2 + 0.5 + "px",
              top: Math.random() * 100 + "%",
              left: Math.random() * 100 + "%",
            }}
          />
        ))}
        <div className="absolute top-0 left-64 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/20 to-transparent" />
      </div>

      {/* Sidebar */}
      <aside
        className="fixed top-0 left-0 h-full w-64 z-20 flex flex-col border-r border-white/5"
        style={{ background: "rgba(8,12,35,0.98)", backdropFilter: "blur(20px)" }}
      >
        <div className="p-5 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center flex-shrink-0"
              style={{ boxShadow: "0 0 20px rgba(99,102,241,0.4)" }}
            >
              <Icon name="Compass" size={22} className="text-white" />
            </div>
            <div>
              <div className="font-cormorant text-lg text-white font-bold leading-tight">QuestMaster</div>
              <div className="text-xs text-gray-500 leading-tight">Платформа квестов</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {navItems
            .filter(item => !item.ownerOnly || isOwnerOrAdmin)
            .map(item => (
              <button
                key={item.key}
                onClick={() => setSection(item.key)}
                className={`nav-item w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                  section === item.key
                    ? "active text-white"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                <Icon
                  name={item.icon as string}
                  size={16}
                  className={section === item.key ? "text-yellow-400" : "text-gray-500"}
                />
                {item.label}
              </button>
            ))
          }
        </nav>

        <div className="p-3 border-t border-white/5">
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {currentUser.avatar}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-white text-sm font-medium truncate">{currentUser.name.split(" ")[0]}</div>
              <div className={`text-xs truncate ${ROLE_COLORS[currentUser.role].split(" ")[0]}`}>
                {ROLE_LABELS[currentUser.role]}
              </div>
            </div>
            <button
              onClick={() => setIsAuth(false)}
              className="text-gray-500 hover:text-red-400 transition-colors flex-shrink-0"
              title="Выйти"
            >
              <Icon name="LogOut" size={15} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="relative z-10 flex-1 ml-64 overflow-auto min-h-screen">
        <div className="p-6 md:p-8 max-w-5xl">
          {section === "dashboard" && (
            <DashboardSection
              sites={sites}
              users={MOCK_USERS}
              onAcceptSite={() => setShowAcceptModal(true)}
            />
          )}
          {section === "sites" && (
            <SitesSection sites={sites} onAddSite={() => setShowAcceptModal(true)} />
          )}
          {section === "quest-editor" && <QuestEditorSection sites={sites} />}
          {section === "members" && <MembersSection users={MOCK_USERS} />}
          {section === "achievements" && <AchievementsSection users={MOCK_USERS} />}
          {section === "profile" && <ProfileSection user={currentUser} />}
        </div>
      </main>

      {/* Accept Site Modal */}
      {showAcceptModal && (
        <Modal title="✦ Принять дополнение — новый сайт" onClose={() => setShowAcceptModal(false)}>
          <div className="space-y-4">
            <p className="text-gray-400 text-sm leading-relaxed">
              Новый сайт будет добавлен на главную страницу как новый квест (путь) с полным доступом к управлению.
            </p>
            <div>
              <label className="text-sm text-gray-400 mb-1.5 block">Название сайта</label>
              <input
                type="text"
                value={newSiteName}
                onChange={e => setNewSiteName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleAcceptSite()}
                placeholder="Например: Таинственный замок"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                autoFocus
              />
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-1.5 block">URL (необязательно)</label>
              <input
                type="text"
                value={newSiteUrl}
                onChange={e => setNewSiteUrl(e.target.value)}
                placeholder="zamok.questmaster.app"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
            <GoldButton onClick={handleAcceptSite} icon="Plus" className="w-full justify-center py-3 font-cormorant text-base">
              Добавить сайт в платформу
            </GoldButton>
          </div>
        </Modal>
      )}
    </div>
  );
}
// Source of Truth - Family Command Center Data Model
// This file serves as the central data structure for the application

export const MOCK_DATA = {
  // User Table - All users in the household
  users: [
    {
      id: 'user-kv',
      name: 'Kyle Van Dieren',
      role: 'Pilot',
      avatarColor: '#6366f1' // Indigo
    },
    {
      id: 'user-av',
      name: 'Amy Van Dieren',
      role: 'Pilot',
      avatarColor: '#14b8a6' // Teal
    },
    {
      id: 'user-nanny',
      name: 'Nanny',
      role: 'Support',
      avatarColor: '#8b5cf6' // Purple
    },
    {
      id: 'user-noah',
      name: 'Noah',
      role: 'Dependent',
      avatarColor: '#4a9eff' // Blue
    },
    {
      id: 'user-leia',
      name: 'Leia',
      role: 'Dependent',
      avatarColor: '#ff6b9d' // Pink
    }
  ],

  // Permissions Matrix
  permissions: {
    Pilot: {
      view: true,
      create: true,
      update: true,
      delete: true,
      execute: true,
      manage: true
    },
    Support: {
      view: true,
      create: false,
      update: false,
      delete: false,
      execute: true,
      manage: false
    },
    Dependent: {
      view: false,
      create: false,
      update: false,
      delete: false,
      execute: false,
      manage: false
    }
  },

  // Household Configuration
  household: {
    name: 'Van Dieren',
    heads: ['KV', 'AV'],
    support: ['Nanny'],
    dependents: ['Noah', 'Leia']
  },

  // Live Feed Ticker
  ticker: [
    "LOGISTICS: School early dismissal tomorrow @ 13:30",
    "CALENDAR: Leia's Birthday Party planning - January 23",
    "FINANCE: Tax Specialist search in progress",
    "ADMIN: Phone transfer to T-Mobile scheduled"
  ],

  // Parent-Child Task Array with nested subTasks
  tasks: [
    // Standalone ActionItems
    {
      id: 1,
      type: 'ActionItem',
      title: "Find Tax Specialist",
      ownerId: 'user-av',
      cognitiveLoad: 8, // Heavy (scale 1-10)
      cpePhase: "Planning",
      dueDate: "2026-01-15",
      status: "Not started",
      dependentId: null
    },
    {
      id: 2,
      type: 'ActionItem',
      title: "Finalize Amy's birthday",
      ownerId: 'user-kv',
      cognitiveLoad: 5, // Medium
      cpePhase: "Execution",
      dueDate: "2026-01-16",
      status: "Not started",
      dependentId: null
    },
    {
      id: 3,
      type: 'ActionItem',
      title: "Transfer phone to TMOBILE",
      ownerId: 'user-av',
      cognitiveLoad: 2, // Low
      cpePhase: "Execution",
      dueDate: "2026-01-16",
      status: "Not started",
      dependentId: null
    },
    
    // Leia's Birthday - EVENT with nested subTasks
    {
      id: 4,
      type: 'EVENT',
      title: "Leia's Birthday",
      ownerId: 'user-kv',
      cognitiveLoad: 6, // Medium
      cpePhase: "Planning",
      dueDate: "2026-01-23",
      status: "Not started",
      dependentId: 'user-leia',
      subTasks: [
        {
          id: '4-1',
          title: "Book party venue",
          ownerId: 'user-kv',
          status: "Not started",
          cognitiveLoad: 5
        },
        {
          id: '4-2',
          title: "Order birthday cake",
          ownerId: 'user-av',
          status: "Not started",
          cognitiveLoad: 2
        },
        {
          id: '4-3',
          title: "Send invitations",
          ownerId: 'user-av',
          status: "Not started",
          cognitiveLoad: 3
        },
        {
          id: '4-4',
          title: "Buy party decorations",
          ownerId: 'user-kv',
          status: "Not started",
          cognitiveLoad: 2
        },
        {
          id: '4-5',
          title: "Plan party activities",
          ownerId: 'user-av',
          status: "Not started",
          cognitiveLoad: 4
        }
      ]
    },
    
    // More standalone ActionItems
    {
      id: 5,
      type: 'ActionItem',
      title: "Open Noah's Bank Account",
      ownerId: 'user-kv',
      cognitiveLoad: 3, // Low
      cpePhase: "Execution",
      dueDate: "2026-01-30",
      status: "Not started",
      dependentId: 'user-noah'
    },
    {
      id: 6,
      type: 'ActionItem',
      title: "Family Estate Planning",
      ownerId: 'user-kv',
      cognitiveLoad: 9, // Heavy
      cpePhase: "Planning",
      dueDate: "2026-01-30",
      status: "Not started",
      dependentId: null
    },
    {
      id: 7,
      type: 'ActionItem',
      title: "Debbie's Birthday Gift and Plan",
      ownerId: 'user-kv',
      cognitiveLoad: 5, // Medium
      cpePhase: "Conception",
      dueDate: "2026-02-20",
      status: "Not started",
      dependentId: null
    },
    {
      id: 8,
      type: 'ActionItem',
      title: "Research & Finalize Noah's School - waitlist",
      ownerId: 'user-av',
      cognitiveLoad: 8, // Heavy
      cpePhase: "Planning",
      dueDate: "2026-02-28",
      status: "Not started",
      dependentId: 'user-noah'
    },
    {
      id: 9,
      type: 'ActionItem',
      title: "Find & secure new Au Pair",
      ownerId: 'user-kv',
      cognitiveLoad: 7, // Heavy
      cpePhase: "Planning",
      dueDate: "2026-04-30",
      status: "Not started",
      dependentId: null
    }
  ],

  // Load Metrics (for charts)
  loadMetrics: [
    { month: "Jan 2026", amy_heavy: 33, amy_medium: 33, amy_low: 34, kyle_heavy: 40, kyle_medium: 30, kyle_low: 30 },
    { month: "Feb 2026", amy_heavy: 50, amy_medium: 0, amy_low: 50, kyle_heavy: 0, kyle_medium: 0, kyle_low: 0 },
    { month: "Mar 2026", amy_heavy: 0, amy_medium: 0, amy_low: 0, kyle_heavy: 0, kyle_medium: 0, kyle_low: 0 }
  ],

  // Strategic Priorities
  priorities: [
    {
      goal: "Research & Finalize Noah's School - waitlist",
      owner: "Amy",
      quarter: "Q1",
      targetDate: "2026-02-28",
      status: "Not started"
    },
    {
      goal: "Book Hawaii Trip - go for closer to a week this time",
      owner: "Kyle",
      quarter: "Q1",
      targetDate: "2026-03-01",
      status: "Not started"
    },
    {
      goal: "Find & secure new Au Pair",
      owner: "Kyle",
      quarter: "Q2",
      targetDate: "2026-04-30",
      status: "Not started"
    },
    {
      goal: "Net Assets to $3.5M",
      owner: "Kyle",
      quarter: "Q4",
      targetDate: "2026-12-31",
      status: "In progress"
    },
    {
      goal: "Tighter Expense Management and Tracking",
      owner: "Amy",
      quarter: "Q4",
      targetDate: "2026-12-31",
      status: "Not started"
    },
    {
      goal: "Keep our relationship more solid than it has ever been",
      owner: "Kyle",
      quarter: "Q4",
      targetDate: "2026-12-31",
      status: "Not started"
    }
  ],

  // 2026 Goals
  goals2026: [
    {
      goal: "Family Hawaii Trip - 4 Seaons, 1 Week!",
      quarter: "Q2",
      targetDate: "2026-06-30",
      status: "Planning"
    },
    {
      goal: "Find and Secure new Au Pair",
      quarter: "Q2",
      targetDate: "2026-04-30",
      status: "Not Started"
    },
    {
      goal: "Finalize Noah School",
      quarter: "Q1",
      targetDate: "2026-03-31",
      status: "Planning"
    }
  ],

  // Vacation Tracking
  nextVacation: {
    name: 'Hawaii 4 Seasons',
    date: '2026-05-15'
  },

  // API Integration Slots - Ready for external data ingestion
  googleCalendarSync: [],
  amazonOrderHistory: []
};

// Calculate days until vacation from today (January 14, 2026)
const today = new Date('2026-01-14');
const vacationDate = new Date(MOCK_DATA.nextVacation.date);
const timeDiff = vacationDate.getTime() - today.getTime();
export const daysUntilVacation = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

// Helper Functions - Data Access Layer

export const getUserById = (userId) => {
  return MOCK_DATA.users.find(user => user.id === userId);
};

export const getUsersByRole = (role) => {
  return MOCK_DATA.users.filter(user => user.role === role);
};

export const getHeads = () => {
  return getUsersByRole('Pilot');
};

export const getSupport = () => {
  return getUsersByRole('Support');
};

export const getDependents = () => {
  return getUsersByRole('Dependent');
};

export const getUserPermissions = (role) => {
  return MOCK_DATA.permissions[role] || {};
};

export const getTasksByType = (type) => {
  return MOCK_DATA.tasks.filter(task => task.type === type);
};

export const getEvents = () => {
  return getTasksByType('EVENT');
};

export const getActionItems = () => {
  return getTasksByType('ActionItem');
};

export const getTaskWithSubTasks = (taskId) => {
  return MOCK_DATA.tasks.find(task => task.id === taskId);
};

export const getAllSubTasks = () => {
  const events = getEvents();
  return events.flatMap(event => event.subTasks || []);
};

export const getTasksByOwner = (ownerId) => {
  const ownerTasks = MOCK_DATA.tasks.filter(task => task.ownerId === ownerId);
  const subTasks = getAllSubTasks().filter(subTask => subTask.ownerId === ownerId);
  return { tasks: ownerTasks, subTasks };
};

export const getTasksByDependent = (dependentId) => {
  return MOCK_DATA.tasks.filter(task => task.dependentId === dependentId);
};

export const getCognitiveLoadByUser = (userId) => {
  const { tasks, subTasks } = getTasksByOwner(userId);
  const allTasks = [...tasks, ...subTasks];
  return {
    total: allTasks.length,
    heavy: allTasks.filter(t => t.cognitiveLoad >= 7).length,
    medium: allTasks.filter(t => t.cognitiveLoad >= 4 && t.cognitiveLoad < 7).length,
    low: allTasks.filter(t => t.cognitiveLoad < 4).length
  };
};

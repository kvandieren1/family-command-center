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
  // Tasks include both old format (ownerId, cognitiveLoad, dependentId) and new format (owner, cognitiveWeight, dependent)
  // for backwards compatibility with existing code
  tasks: [
    // Standalone ActionItems
    {
      id: 1,
      type: 'ActionItem',
      title: "Find Tax Specialist",
      owner: "Amy",
      ownerId: 'user-av', // Keep for backwards compatibility
      ownerInitials: '[A]',
      cognitiveWeight: 'Heavy',
      cognitiveLoad: 8, // Keep for backwards compatibility
      cpePhase: "Planning",
      dueDate: "2026-01-15",
      status: "Not started",
      dependent: null,
      dependentId: null
    },
    {
      id: 2,
      type: 'ActionItem',
      title: "Finalize Amy's birthday",
      owner: "Kyle",
      ownerId: 'user-kv',
      ownerInitials: '[K]',
      cognitiveWeight: 'Medium',
      cognitiveLoad: 5,
      cpePhase: "Execution",
      dueDate: "2026-01-16",
      status: "Not started",
      dependent: null,
      dependentId: null
    },
    {
      id: 3,
      type: 'ActionItem',
      title: "Transfer phone to TMOBILE",
      owner: "Amy",
      ownerId: 'user-av',
      ownerInitials: '[A]',
      cognitiveWeight: 'Low',
      cognitiveLoad: 2,
      cpePhase: "Execution",
      dueDate: "2026-01-16",
      status: "Not started",
      dependent: null,
      dependentId: null
    },
    
    // Leia's Birthday - EVENT with nested subTasks
    {
      id: 4,
      type: 'EVENT',
      title: "Leia's Birthday",
      owner: "Kyle",
      ownerId: 'user-kv',
      ownerInitials: '[K]',
      cognitiveWeight: 'Medium',
      cognitiveLoad: 6,
      cpePhase: "Planning",
      dueDate: "2026-01-23",
      status: "Not started",
      dependent: "Leia",
      dependentId: 'user-leia',
      subTasks: [
        {
          id: '4-1',
          title: "Book party venue",
          owner: "Kyle",
          ownerId: 'user-kv',
          status: "Not started",
          cognitiveWeight: 'Medium',
          cognitiveLoad: 5
        },
        {
          id: '4-2',
          title: "Order birthday cake",
          owner: "Amy",
          ownerId: 'user-av',
          status: "Not started",
          cognitiveWeight: 'Low',
          cognitiveLoad: 2
        },
        {
          id: '4-3',
          title: "Send invitations",
          owner: "Amy",
          ownerId: 'user-av',
          status: "Not started",
          cognitiveWeight: 'Low',
          cognitiveLoad: 3
        },
        {
          id: '4-4',
          title: "Buy party decorations",
          owner: "Kyle",
          ownerId: 'user-kv',
          status: "Not started",
          cognitiveWeight: 'Low',
          cognitiveLoad: 2
        },
        {
          id: '4-5',
          title: "Plan party activities",
          owner: "Amy",
          ownerId: 'user-av',
          status: "Not started",
          cognitiveWeight: 'Medium',
          cognitiveLoad: 4
        }
      ]
    },
    
    // More standalone ActionItems
    {
      id: 5,
      type: 'ActionItem',
      title: "Open Noah's Bank Account",
      owner: "Kyle",
      ownerId: 'user-kv',
      ownerInitials: '[K]',
      cognitiveWeight: 'Low',
      cognitiveLoad: 3,
      cpePhase: "Execution",
      dueDate: "2026-01-30",
      status: "Not started",
      dependent: "Noah",
      dependentId: 'user-noah'
    },
    {
      id: 6,
      type: 'ActionItem',
      title: "Family Estate Planning",
      owner: "Kyle",
      ownerId: 'user-kv',
      ownerInitials: '[K]',
      cognitiveWeight: 'Heavy',
      cognitiveLoad: 9,
      cpePhase: "Planning",
      dueDate: "2026-01-30",
      status: "Not started",
      dependent: null,
      dependentId: null
    },
    {
      id: 7,
      type: 'ActionItem',
      title: "Debbie's Birthday Gift and Plan",
      owner: "Kyle",
      ownerId: 'user-kv',
      ownerInitials: '[K]',
      cognitiveWeight: 'Medium',
      cognitiveLoad: 5,
      cpePhase: "Conception",
      dueDate: "2026-02-20",
      status: "Not started",
      dependent: null,
      dependentId: null
    },
    {
      id: 8,
      type: 'ActionItem',
      title: "Research & Finalize Noah's School - waitlist",
      owner: "Amy",
      ownerId: 'user-av',
      ownerInitials: '[A]',
      cognitiveWeight: 'Heavy',
      cognitiveLoad: 8,
      cpePhase: "Planning",
      dueDate: "2026-02-28",
      status: "Not started",
      dependent: "Noah",
      dependentId: 'user-noah'
    },
    {
      id: 9,
      type: 'ActionItem',
      title: "Find & secure new Au Pair",
      owner: "Kyle",
      ownerId: 'user-kv',
      ownerInitials: '[K]',
      cognitiveWeight: 'Heavy',
      cognitiveLoad: 7,
      cpePhase: "Planning",
      dueDate: "2026-04-30",
      status: "Not started",
      dependent: null,
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

// Calculate days until vacation from current date (dynamic, not hardcoded)
// This function recalculates each time it's called to always show current countdown
export function getDaysUntilVacation() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const vacationDate = new Date(MOCK_DATA.nextVacation.date);
  vacationDate.setHours(0, 0, 0, 0);
  const timeDiff = vacationDate.getTime() - today.getTime();
  return Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
}

// Export a computed value for backwards compatibility (but it's now a function call)
export const daysUntilVacation = getDaysUntilVacation();

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
  // Safely filter subtasks - handle cases where subtasks might not have ownerId
  const subTasks = getAllSubTasks().filter(subTask => {
    // Support both ownerId (for backwards compatibility) and owner (string) properties
    return subTask?.ownerId === ownerId || 
           (subTask?.owner && getUserById(ownerId)?.name === subTask.owner);
  });
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
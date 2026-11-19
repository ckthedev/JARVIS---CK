export interface NavItem {
  title: string;
  href: string;
  iconName: string;
  badge?: string;
  description?: string;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

export const siteConfig = {
  name: "JARVIS",
  description: "Personal AI Assistant & Productivity Hub",
  url: "http://localhost:3000",
  sections: [
    {
      title: "WORKSPACE",
      items: [
        {
          title: "Dashboard",
          href: "/dashboard",
          iconName: "LayoutDashboard",
          description: "Overview of your personal productivity command center.",
        },
        {
          title: "Tasks",
          href: "/tasks",
          iconName: "CheckSquare",
          description: "Manage prioritized tasks, projects, and execution.",
        },
        {
          title: "Notes",
          href: "/notes",
          iconName: "FileText",
          description: "Editorial notes, ideas, knowledge base, and tags.",
        },
        {
          title: "Files",
          href: "/files",
          iconName: "FolderOpen",
          description: "Secure local asset and document repository.",
        },
      ],
    },
    {
      title: "PLANNING",
      items: [
        {
          title: "Reminders",
          href: "/reminders",
          iconName: "Bell",
          description: "Time-critical alerts and recurring dispatch.",
        },
        {
          title: "Meetings",
          href: "/meetings",
          iconName: "Calendar",
          description: "Schedule, agenda, and participant tracking.",
        },
        {
          title: "Calendar",
          href: "/social/calendar",
          iconName: "CalendarDays",
          description: "Unified schedule & content timeline.",
        },
      ],
    },
    {
      title: "MARKETING",
      items: [
        {
          title: "Social Media",
          href: "/social",
          iconName: "Share2",
          description: "Schedule and manage social communications.",
        },
        {
          title: "Campaigns",
          href: "/social/campaigns",
          iconName: "Layers",
          description: "Marketing campaigns, pillars, and content flow.",
        },
      ],
    },
    {
      title: "SYSTEM",
      items: [
        {
          title: "Settings",
          href: "/settings",
          iconName: "Settings",
          description: "Preferences, credentials, and parameters.",
        },
      ],
    },
  ] as NavSection[],
  // Flat nav list for legacy lookups
  mainNav: [
    {
      title: "Dashboard",
      href: "/dashboard",
      iconName: "LayoutDashboard",
      description: "Overview of your personal productivity command center.",
    },
    {
      title: "Tasks",
      href: "/tasks",
      iconName: "CheckSquare",
      description: "Manage prioritized tasks and projects.",
    },
    {
      title: "Notes",
      href: "/notes",
      iconName: "FileText",
      description: "Quick notes, knowledge base, and tags.",
    },
    {
      title: "Files",
      href: "/files",
      iconName: "FolderOpen",
      description: "Secure local asset and document storage.",
    },
    {
      title: "Reminders",
      href: "/reminders",
      iconName: "Bell",
      description: "Time-critical alerts and follow-ups.",
    },
    {
      title: "Meetings",
      href: "/meetings",
      iconName: "Calendar",
      description: "Schedule, agenda, and participant tracking.",
    },
    {
      title: "Social Media",
      href: "/social",
      iconName: "Share2",
      description: "Schedule and manage social communications.",
    },
  ] as NavItem[],
  bottomNav: [
    {
      title: "Settings",
      href: "/settings",
      iconName: "Settings",
      description: "Preferences, credentials, and system parameters.",
    },
  ] as NavItem[],
};

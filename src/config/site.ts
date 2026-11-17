export interface NavItem {
  title: string;
  href: string;
  iconName: string;
  badge?: string;
  description?: string;
}

export const siteConfig = {
  name: "JARVIS",
  description: "Personal AI Assistant & Productivity Hub",
  url: "http://localhost:3000",
  mainNav: [
    {
      title: "Dashboard",
      href: "/dashboard",
      iconName: "LayoutDashboard",
      description: "Overview of your personal productivity matrix.",
    },
    {
      title: "Tasks",
      href: "/tasks",
      iconName: "CheckSquare",
      description: "Manage prioritized tasks and projects.",
    },
    {
      title: "Social Media",
      href: "/social",
      iconName: "Share2",
      description: "Schedule and manage social communications.",
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
      title: "Notes",
      href: "/notes",
      iconName: "FileText",
      description: "Quick notes, knowledge base, and tags.",
    },
    {
      title: "My Files",
      href: "/files",
      iconName: "FolderOpen",
      description: "Secure local asset and document storage.",
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

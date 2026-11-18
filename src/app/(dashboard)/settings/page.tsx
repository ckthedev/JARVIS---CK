import React from "react";
import { requireAuth } from "@/lib/auth/session";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { User, ShieldCheck, Database, HardDrive, KeyRound } from "lucide-react";
import { PasswordChangeCard } from "./password-change-card";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await requireAuth();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings & System Configuration"
        description="Private operator credentials, core parameters, and environment security."
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile / Operator Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
              Operator Profile
            </CardTitle>
            <CardDescription>
              Authenticated administrator account details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <span className="text-xs text-secondary-text uppercase tracking-wider">
                Full Name
              </span>
              <p className="text-sm font-semibold text-foreground">{user.name}</p>
            </div>

            <div className="space-y-1">
              <span className="text-xs text-secondary-text uppercase tracking-wider">
                Authorized Email
              </span>
              <p className="text-sm font-semibold text-foreground">{user.email}</p>
            </div>

            <div className="space-y-1">
              <span className="text-xs text-secondary-text uppercase tracking-wider">
                Privilege Level
              </span>
              <div>
                <Badge variant="default" className="gap-1">
                  <ShieldCheck className="h-3 w-3" />
                  {user.role} (Full Access)
                </Badge>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-xs text-secondary-text uppercase tracking-wider">
                Provisioned At
              </span>
              <p className="text-xs text-secondary-text">
                {formatDate(user.createdAt)}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* System & Storage Environment */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Database className="h-4 w-4 text-[#A78BFA]" />
              System Architecture & Health
            </CardTitle>
            <CardDescription>
              Foundation parameters and storage telemetry
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between border-b border-border/40 pb-3">
              <div className="space-y-0.5">
                <span className="text-sm font-medium text-foreground">
                  Database Engine
                </span>
                <p className="text-xs text-secondary-text">
                  PostgreSQL 16 &bull; Prisma ORM
                </p>
              </div>
              <Badge variant="success">Online</Badge>
            </div>

            <div className="flex items-center justify-between border-b border-border/40 pb-3">
              <div className="space-y-0.5">
                <span className="text-sm font-medium text-foreground">
                  Authentication Engine
                </span>
                <p className="text-xs text-secondary-text">
                  Auth.js &bull; bcrypt (12 rounds) &bull; JWT Session
                </p>
              </div>
              <Badge variant="success">Secured</Badge>
            </div>

            <div className="flex items-center justify-between border-b border-border/40 pb-3">
              <div className="space-y-0.5">
                <span className="text-sm font-medium text-foreground">
                  Local Storage Repository
                </span>
                <p className="text-xs text-secondary-text">
                  data/uploads &bull; Path Traversal Guarded
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-primary font-medium">
                <HardDrive className="h-3.5 w-3.5" />
                Active
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-sm font-medium text-foreground">
                  Public Registration Gate
                </span>
                <p className="text-xs text-secondary-text">
                  External signups permanently locked
                </p>
              </div>
              <Badge variant="outline">Disabled</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Direct Password Change Card */}
      <PasswordChangeCard />

      {/* Security Credentials Guidance */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-primary" />
            Security & Password Architecture
          </CardTitle>
          <CardDescription>
            Passphrase encryption and credential boundaries
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-primary/20 bg-primary/5 p-4 text-xs text-secondary-text space-y-1">
            <p className="text-foreground font-semibold">
              Administrator Credential Protection:
            </p>
            <p>
              Passwords are automatically hashed using bcrypt with 12 salt rounds before being stored. Password hashes and authentication secrets are strictly prevented from leaking to client components or browser contexts.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

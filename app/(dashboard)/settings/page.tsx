"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";

export default function SettingsPage() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const isAdmin = (session?.user as { role?: string })?.role === "ADMIN";

  // Settings
  const { data: settingsData, isLoading: settingsLoading } = useQuery({
    queryKey: ["settings"],
    queryFn: () => fetch("/api/settings").then((r) => r.json()),
    enabled: isAdmin,
  });

  const [alpacaForm, setAlpacaForm] = useState({
    alpacaMode: "paper",
    alpacaPaperKey: "",
    alpacaPaperSecret: "",
    alpacaLiveKey: "",
    alpacaLiveSecret: "",
  });

  const [cronForm, setCronForm] = useState({
    cronExpression: "*/5 * * * *",
    tradeOutsideHours: false,
  });

  // Populate forms when data loads
  const settings = settingsData?.data;
  if (settings && alpacaForm.alpacaMode === "paper" && !alpacaForm.alpacaPaperKey) {
    // Only set once
  }

  const saveAlpacaMutation = useMutation({
    mutationFn: async (data: typeof alpacaForm) => {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      toast.success("Alpaca ayarları kaydedildi");
    },
    onError: () => toast.error("Kaydetme başarısız"),
  });

  const saveCronMutation = useMutation({
    mutationFn: async (data: typeof cronForm) => {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      toast.success("Cron ayarları kaydedildi");
    },
    onError: () => toast.error("Kaydetme başarısız"),
  });

  const testConnectionMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/settings/test-connection", {
        method: "POST",
      });
      if (!res.ok) throw new Error("Bağlantı başarısız");
      return res.json();
    },
    onSuccess: (data) => {
      toast.success(`Bağlantı başarılı! Hesap: ${data.data?.account_number || "OK"}`);
    },
    onError: () => toast.error("Alpaca bağlantısı başarısız"),
  });

  // Users
  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ["users"],
    queryFn: () => fetch("/api/users").then((r) => r.json()),
    enabled: isAdmin,
  });

  const [addUserOpen, setAddUserOpen] = useState(false);
  const [newUser, setNewUser] = useState({ email: "", name: "", password: "", role: "VIEWER" });

  const addUserMutation = useMutation({
    mutationFn: async (user: typeof newUser) => {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(user),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("Kullanıcı eklendi");
      setAddUserOpen(false);
      setNewUser({ email: "", name: "", password: "", role: "VIEWER" });
    },
    onError: () => toast.error("Eklenemedi"),
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("Kullanıcı silindi");
    },
    onError: () => toast.error("Silinemedi"),
  });

  const changeRoleMutation = useMutation({
    mutationFn: async ({ id, role }: { id: string; role: string }) => {
      const res = await fetch(`/api/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("Rol güncellendi");
    },
  });

  const users = usersData?.data ?? [];

  if (!isAdmin) {
    return (
      <div className="flex h-[60vh] items-center justify-center text-muted-foreground">
        Bu sayfaya erişim yetkiniz yok.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold tracking-tight">Ayarlar</h1>

      {/* Alpaca API */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-base">Alpaca API</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Label className="text-sm text-muted-foreground">Mod</Label>
            <div className="flex gap-2">
              {["paper", "live"].map((mode) => (
                <Button
                  key={mode}
                  variant={alpacaForm.alpacaMode === mode ? "default" : "outline"}
                  size="sm"
                  onClick={() => setAlpacaForm({ ...alpacaForm, alpacaMode: mode })}
                  className="h-7 text-xs capitalize"
                >
                  {mode}
                </Button>
              ))}
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">
                {alpacaForm.alpacaMode === "paper" ? "Paper" : "Live"} API Key
              </Label>
              <Input
                type="password"
                value={alpacaForm.alpacaMode === "paper" ? alpacaForm.alpacaPaperKey : alpacaForm.alpacaLiveKey}
                onChange={(e) => {
                  if (alpacaForm.alpacaMode === "paper") {
                    setAlpacaForm({ ...alpacaForm, alpacaPaperKey: e.target.value });
                  } else {
                    setAlpacaForm({ ...alpacaForm, alpacaLiveKey: e.target.value });
                  }
                }}
                className="border-border bg-background font-mono text-xs"
                placeholder="PK..."
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">
                {alpacaForm.alpacaMode === "paper" ? "Paper" : "Live"} Secret
              </Label>
              <Input
                type="password"
                value={alpacaForm.alpacaMode === "paper" ? alpacaForm.alpacaPaperSecret : alpacaForm.alpacaLiveSecret}
                onChange={(e) => {
                  if (alpacaForm.alpacaMode === "paper") {
                    setAlpacaForm({ ...alpacaForm, alpacaPaperSecret: e.target.value });
                  } else {
                    setAlpacaForm({ ...alpacaForm, alpacaLiveSecret: e.target.value });
                  }
                }}
                className="border-border bg-background font-mono text-xs"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={() => saveAlpacaMutation.mutate(alpacaForm)}
              disabled={saveAlpacaMutation.isPending}
              className="bg-foreground text-background hover:bg-foreground/90"
            >
              Kaydet
            </Button>
            <Button
              variant="outline"
              onClick={() => testConnectionMutation.mutate()}
              disabled={testConnectionMutation.isPending}
            >
              {testConnectionMutation.isPending ? "Test ediliyor..." : "Bağlantıyı Test Et"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* User Management */}
      <Card className="border-border bg-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Kullanıcı Yönetimi</CardTitle>
          <Dialog open={addUserOpen} onOpenChange={setAddUserOpen}>
            <DialogTrigger>
              <Button size="sm" className="bg-foreground text-background hover:bg-foreground/90">
                Kullanıcı Ekle
              </Button>
            </DialogTrigger>
            <DialogContent className="border-border bg-card">
              <DialogHeader>
                <DialogTitle>Yeni Kullanıcı</DialogTitle>
              </DialogHeader>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  addUserMutation.mutate(newUser);
                }}
                className="space-y-4"
              >
                <Input placeholder="Ad" value={newUser.name} onChange={(e) => setNewUser({...newUser, name: e.target.value})} className="border-border bg-background" />
                <Input placeholder="E-posta" type="email" value={newUser.email} onChange={(e) => setNewUser({...newUser, email: e.target.value})} className="border-border bg-background" />
                <Input placeholder="Şifre" type="password" value={newUser.password} onChange={(e) => setNewUser({...newUser, password: e.target.value})} className="border-border bg-background" />
                <Select value={newUser.role} onValueChange={(v) => setNewUser({...newUser, role: v ?? "VIEWER"})}>
                  <SelectTrigger className="border-border bg-background"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                    <SelectItem value="VIEWER">Viewer</SelectItem>
                  </SelectContent>
                </Select>
                <Button type="submit" disabled={addUserMutation.isPending} className="w-full bg-foreground text-background hover:bg-foreground/90">
                  Ekle
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-xs">Ad</TableHead>
                <TableHead className="text-xs">E-posta</TableHead>
                <TableHead className="text-xs">Rol</TableHead>
                <TableHead className="text-xs">Tarih</TableHead>
                <TableHead className="text-xs"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usersLoading
                ? Array.from({ length: 2 }).map((_, i) => (
                    <TableRow key={i} className="border-border">
                      {Array.from({ length: 5 }).map((_, j) => (
                        <TableCell key={j}><Skeleton className="h-4 w-20" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                : users.map(
                    (user: { id: string; name: string | null; email: string; role: string; createdAt: string }) => (
                      <TableRow key={user.id} className="border-border">
                        <TableCell className="text-sm">{user.name || "—"}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{user.email}</TableCell>
                        <TableCell>
                          <Select
                            value={user.role}
                            onValueChange={(v) => changeRoleMutation.mutate({ id: user.id, role: v ?? "VIEWER" })}
                          >
                            <SelectTrigger className="h-7 w-[100px] border-border bg-background text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ADMIN">Admin</SelectItem>
                              <SelectItem value="VIEWER">Viewer</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(user.createdAt).toLocaleDateString("tr-TR")}
                        </TableCell>
                        <TableCell>
                          {user.id !== (session?.user as { id?: string })?.id && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteUserMutation.mutate(user.id)}
                              className="h-7 text-xs text-danger hover:text-danger"
                            >
                              Sil
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Cron Settings */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-base">Cron Ayarları</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Strateji Kontrol Sıklığı</Label>
            <Select
              value={cronForm.cronExpression}
              onValueChange={(v) => setCronForm({ ...cronForm, cronExpression: v ?? "*/5 * * * *" })}
            >
              <SelectTrigger className="w-[200px] border-border bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="*/1 * * * *">Her 1 dakika</SelectItem>
                <SelectItem value="*/5 * * * *">Her 5 dakika</SelectItem>
                <SelectItem value="*/15 * * * *">Her 15 dakika</SelectItem>
                <SelectItem value="*/30 * * * *">Her 30 dakika</SelectItem>
                <SelectItem value="0 * * * *">Her saat</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-sm text-muted-foreground">
              Piyasa saatleri dışında çalıştır
            </Label>
            <Switch
              checked={cronForm.tradeOutsideHours}
              onCheckedChange={(v) => setCronForm({ ...cronForm, tradeOutsideHours: v })}
            />
          </div>
          <Button
            onClick={() => saveCronMutation.mutate(cronForm)}
            disabled={saveCronMutation.isPending}
            className="bg-foreground text-background hover:bg-foreground/90"
          >
            Kaydet
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

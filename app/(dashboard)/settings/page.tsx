"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
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
import { cn } from "@/lib/utils";

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

  const [profileForm, setProfileForm] = useState({
    name: "",
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Populate forms when data loads
  const settings = settingsData?.data;
  useEffect(() => {
    if (settings) {
      setAlpacaForm({
        alpacaMode: settings.alpacaMode || "paper",
        alpacaPaperKey: settings.alpacaPaperKey || "",
        alpacaPaperSecret: settings.alpacaPaperSecret || "",
        alpacaLiveKey: settings.alpacaLiveKey || "",
        alpacaLiveSecret: settings.alpacaLiveSecret || "",
      });
      setCronForm({
        cronExpression: settings.cronExpression || "*/5 * * * *",
        tradeOutsideHours: settings.tradeOutsideHours ?? false,
      });
    }
  }, [settings]);

  // Populate profile form when session loads
  useEffect(() => {
    if (session?.user) {
      setProfileForm({
        name: session.user.name || "",
      });
    }
  }, [session]);

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
      const isLive = alpacaForm.alpacaMode === "live";
      const apiKey = isLive
        ? alpacaForm.alpacaLiveKey
        : alpacaForm.alpacaPaperKey;
      const secretKey = isLive
        ? alpacaForm.alpacaLiveSecret
        : alpacaForm.alpacaPaperSecret;

      const res = await fetch("/api/settings/test-connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey,
          secretKey,
          isLive,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Bağlantı başarısız");
      }
      return res.json();
    },
    onSuccess: (data) => {
      toast.success("Bağlantı başarılı!");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const saveProfileMutation = useMutation({
    mutationFn: async (data: { name: string }) => {
      const res = await fetch("/api/users/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("Profil güncellendi. Yeni isminizin aktif olması için çıkış yapıp tekrar giriş yapın.");
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (err: Error) => toast.error(err.message || "Kaydetme başarısız"),
  });

  const changePasswordMutation = useMutation({
    mutationFn: async (data: typeof passwordForm) => {
      if (data.newPassword !== data.confirmPassword) {
        throw new Error("Yeni şifreler eşleşmiyor");
      }
      const res = await fetch("/api/users/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("Şifreniz başarıyla güncellendi");
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    },
    onError: (err: Error) => toast.error(err.message || "Şifre güncelleme başarısız"),
  });

  // Users
  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ["users"],
    queryFn: () => fetch("/api/users").then((r) => r.json()),
    enabled: isAdmin,
  });

  const [addUserOpen, setAddUserOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    email: "",
    name: "",
    password: "",
    role: "VIEWER",
  });

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

  return (
    <div className="space-y-8">
      {/* Profile Info Card (Visible to all users) */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-base">Profil Bilgilerim</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Profile Detail Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                saveProfileMutation.mutate(profileForm);
              }}
              className="space-y-4"
            >
              <h3 className="text-sm font-semibold text-muted-foreground">Profil Detayları</h3>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">E-posta</Label>
                <Input
                  value={session?.user?.email || ""}
                  disabled
                  className="border-border bg-zinc-900/40 cursor-not-allowed text-muted-foreground font-medium text-xs h-9"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Rol</Label>
                <Input
                  value={
                    (session?.user as { role?: string })?.role === "ADMIN"
                      ? "Yönetici (ADMIN)"
                      : "Gözlemci (VIEWER)"
                  }
                  disabled
                  className="border-border bg-zinc-900/40 cursor-not-allowed text-muted-foreground font-medium text-xs h-9"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="profileName" className="text-xs text-muted-foreground">Ad Soyad</Label>
                <Input
                  id="profileName"
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  className="border-border bg-background text-xs h-9"
                  placeholder="Kullanıcı Adı"
                />
              </div>
              <Button
                type="submit"
                disabled={saveProfileMutation.isPending}
                size="sm"
                className="bg-foreground text-background hover:bg-foreground/90 h-8 text-xs px-4"
              >
                {saveProfileMutation.isPending ? "Kaydediliyor..." : "Adımı Güncelle"}
              </Button>
            </form>

            {/* Password Change Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                changePasswordMutation.mutate(passwordForm);
              }}
              className="space-y-4 border-t border-border pt-6 md:border-t-0 md:pt-0 md:pl-8 md:border-l"
            >
              <h3 className="text-sm font-semibold text-muted-foreground">Şifre Değiştir</h3>
              <div className="space-y-2">
                <Label htmlFor="currentPassword" className="text-xs text-muted-foreground">Mevcut Şifre</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) =>
                    setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
                  }
                  className="border-border bg-background text-xs h-9"
                  placeholder="••••••••"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword" className="text-xs text-muted-foreground">Yeni Şifre</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) =>
                    setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                  }
                  className="border-border bg-background text-xs h-9"
                  placeholder="••••••••"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-xs text-muted-foreground">Yeni Şifre (Tekrar)</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) =>
                    setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
                  }
                  className="border-border bg-background text-xs h-9"
                  placeholder="••••••••"
                  required
                />
              </div>
              <Button
                type="submit"
                disabled={changePasswordMutation.isPending}
                size="sm"
                className="bg-foreground text-background hover:bg-foreground/90 h-8 text-xs px-4"
              >
                {changePasswordMutation.isPending ? "Değiştiriliyor..." : "Şifre Değiştir"}
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>

      {/* Admin Settings Sections */}
      {isAdmin && (
        <>
          {/* Alpaca API */}
          <Card className="border-border bg-card animate-in fade-in duration-200">
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
                      variant={
                        alpacaForm.alpacaMode === mode ? "default" : "outline"
                      }
                      size="sm"
                      onClick={() =>
                        setAlpacaForm({ ...alpacaForm, alpacaMode: mode })
                      }
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
                    value={
                      alpacaForm.alpacaMode === "paper"
                        ? alpacaForm.alpacaPaperKey
                        : alpacaForm.alpacaLiveKey
                    }
                    onChange={(e) => {
                      if (alpacaForm.alpacaMode === "paper") {
                        setAlpacaForm({
                          ...alpacaForm,
                          alpacaPaperKey: e.target.value,
                        });
                      } else {
                        setAlpacaForm({
                          ...alpacaForm,
                          alpacaLiveKey: e.target.value,
                        });
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
                    value={
                      alpacaForm.alpacaMode === "paper"
                        ? alpacaForm.alpacaPaperSecret
                        : alpacaForm.alpacaLiveSecret
                    }
                    onChange={(e) => {
                      if (alpacaForm.alpacaMode === "paper") {
                        setAlpacaForm({
                          ...alpacaForm,
                          alpacaPaperSecret: e.target.value,
                        });
                      } else {
                        setAlpacaForm({
                          ...alpacaForm,
                          alpacaLiveSecret: e.target.value,
                        });
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
                  {testConnectionMutation.isPending
                    ? "Test ediliyor..."
                    : "Bağlantıyı Test Et"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* User Management */}
          <Card className="border-border bg-card animate-in fade-in duration-200">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Kullanıcı Yönetimi</CardTitle>
              <Dialog open={addUserOpen} onOpenChange={setAddUserOpen}>
                <DialogTrigger
                  render={
                    <Button
                      size="sm"
                      className="bg-foreground text-background hover:bg-foreground/90"
                    >
                      Kullanıcı Ekle
                    </Button>
                  }
                />
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
                    <Input
                      placeholder="Ad"
                      value={newUser.name}
                      onChange={(e) =>
                        setNewUser({ ...newUser, name: e.target.value })
                      }
                      className="border-border bg-background"
                    />
                    <Input
                      placeholder="E-posta"
                      type="email"
                      value={newUser.email}
                      onChange={(e) =>
                        setNewUser({ ...newUser, email: e.target.value })
                      }
                      className="border-border bg-background"
                    />
                    <Input
                      placeholder="Şifre"
                      type="password"
                      value={newUser.password}
                      onChange={(e) =>
                        setNewUser({ ...newUser, password: e.target.value })
                      }
                      className="border-border bg-background"
                    />
                    <Select
                      value={newUser.role}
                      onValueChange={(v) =>
                        setNewUser({ ...newUser, role: v ?? "VIEWER" })
                      }
                    >
                      <SelectTrigger className="border-border bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ADMIN">Admin</SelectItem>
                        <SelectItem value="VIEWER">Viewer</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      type="submit"
                      disabled={addUserMutation.isPending}
                      className="w-full bg-foreground text-background hover:bg-foreground/90"
                    >
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
                            <TableCell key={j}>
                              <Skeleton className="h-4 w-20" />
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    : users.map(
                        (user: {
                          id: string;
                          name: string | null;
                          email: string;
                          role: string;
                          createdAt: string;
                        }) => (
                          <TableRow key={user.id} className="border-border">
                            <TableCell className="text-sm">
                              {user.name || "—"}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {user.email}
                            </TableCell>
                            <TableCell>
                              <Select
                                value={user.role}
                                onValueChange={(v) =>
                                  changeRoleMutation.mutate({
                                    id: user.id,
                                    role: v ?? "VIEWER",
                                  })
                                }
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
                              {user.id !==
                                (session?.user as { id?: string })?.id && (
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
                        ),
                      )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Cron Settings */}
          <Card className="border-border bg-card animate-in fade-in duration-200">
            <CardHeader>
              <CardTitle className="text-base">Cron Ayarları</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">
                  Strateji Kontrol Sıklığı
                </Label>
                <Select
                  value={cronForm.cronExpression}
                  onValueChange={(v) =>
                    setCronForm({ ...cronForm, cronExpression: v ?? "*/5 * * * *" })
                  }
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
                  onCheckedChange={(v) =>
                    setCronForm({ ...cronForm, tradeOutsideHours: v })
                  }
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
        </>
      )}
    </div>
  );
}

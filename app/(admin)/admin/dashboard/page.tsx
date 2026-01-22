"use client";

import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Users, Shield, Activity, Settings } from "lucide-react";

export default function AdminDashboard() {
  const { data: session } = useSession();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            管理员控制台
          </h1>
          <p className="text-gray-600 mt-2">
            欢迎回来，{session?.user?.username}（管理员）
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                用户管理
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">管理</div>
              <p className="text-xs text-muted-foreground mt-2">
                创建和管理用户账号
              </p>
              <Link href="/admin/users" className="block">
                <Button className="mt-4 w-full" variant="outline">
                  查看用户
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                权限管理
              </CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">控制</div>
              <p className="text-xs text-muted-foreground mt-2">
                分配员工权限
              </p>
              <Link href="/admin/users" className="block">
                <Button className="mt-4 w-full" variant="outline">
                  管理权限
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                审计日志
              </CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">监控</div>
              <p className="text-xs text-muted-foreground mt-2">
                查看系统活动日志
              </p>
              <Button className="mt-4 w-full" variant="outline">
                查看日志
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                系统设置
              </CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">配置</div>
              <p className="text-xs text-muted-foreground mt-2">
                系统配置管理
              </p>
              <Button className="mt-4 w-full" variant="outline">
                进入设置
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>最近活动</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                系统活动将在此处显示
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>快捷操作</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                <Link href="/admin/users">
                  <Button variant="outline">创建用户</Button>
                </Link>
                <Link href="/staff/cases">
                  <Button variant="outline">查看所有工单</Button>
                </Link>
                <Link href="/api/auth/signout">
                  <Button variant="destructive">退出登录</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

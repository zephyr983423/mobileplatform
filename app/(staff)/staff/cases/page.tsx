"use client";

import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function StaffCasesPage() {
  const { data: session } = useSession();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <Link href="/staff/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              返回工作台
            </Button>
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            维修工单
          </h1>
          <p className="text-gray-600 mt-2">
            管理和查看所有维修工单
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>所有工单</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                工单列表功能即将实现
              </p>
              <div className="flex justify-center gap-3">
                <Button>创建新工单</Button>
                <Button variant="outline">筛选工单</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6">
          <Link href="/api/auth/signout">
            <Button variant="destructive">退出登录</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

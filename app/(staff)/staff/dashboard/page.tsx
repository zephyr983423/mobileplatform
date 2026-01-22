"use client";

import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Package, ClipboardList, TruckIcon } from "lucide-react";

export default function StaffDashboard() {
  const { data: session } = useSession();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            员工工作台
          </h1>
          <p className="text-gray-600 mt-2">
            欢迎回来，{session?.user?.username}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                维修工单
              </CardTitle>
              <ClipboardList className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">查看工单</div>
              <p className="text-xs text-muted-foreground mt-2">
                管理维修案例和服务记录
              </p>
              <Link href="/staff/cases">
                <Button className="mt-4 w-full">
                  进入工单管理
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                仓库管理
              </CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">库存</div>
              <p className="text-xs text-muted-foreground mt-2">
                管理设备库存和配件
              </p>
              <Button className="mt-4 w-full" variant="outline">
                即将推出
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                物流追踪
              </CardTitle>
              <TruckIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">快递</div>
              <p className="text-xs text-muted-foreground mt-2">
                追踪进出货物流信息
              </p>
              <Button className="mt-4 w-full" variant="outline">
                即将推出
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>快捷操作</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                <Button variant="outline">创建新工单</Button>
                <Button variant="outline">更新状态</Button>
                <Button variant="outline">查看报表</Button>
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

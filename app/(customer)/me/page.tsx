"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Smartphone, Package, MapPin, LogOut } from "lucide-react";
import Link from "next/link";

interface Device {
  id: string;
  brand: string;
  model: string;
  color?: string;
  storage?: string;
  latestCase: {
    id: string;
    caseNumber: string;
    title: string;
    status: string;
    lastUpdated: string;
    location?: string;
    tracking?: {
      carrier?: string;
      trackingNumber?: string;
      status: string;
      currentLocation?: string;
    };
  } | null;
}

const statusColors: Record<string, string> = {
  PENDING: "bg-gray-500",
  RECEIVED: "bg-blue-500",
  DIAGNOSING: "bg-yellow-500",
  AWAITING_PARTS: "bg-amber-500",
  REPAIRING: "bg-orange-500",
  QA: "bg-purple-500",
  READY_TO_SHIP: "bg-green-500",
  SHIPPING: "bg-blue-600",
  DELIVERED: "bg-green-600",
  CLOSED: "bg-gray-400",
  RETURNED: "bg-red-500",
};

const statusLabels: Record<string, string> = {
  PENDING: "待处理",
  RECEIVED: "已接收",
  DIAGNOSING: "诊断中",
  AWAITING_PARTS: "等待配件",
  REPAIRING: "维修中",
  QA: "质检中",
  READY_TO_SHIP: "待发货",
  SHIPPING: "运输中",
  DELIVERED: "已送达",
  CLOSED: "已关闭",
  RETURNED: "已退回",
  CANCELLED: "已取消",
};

export default function MyDevicesPage() {
  const router = useRouter();
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDevices();
  }, []);

  const fetchDevices = async () => {
    try {
      const res = await fetch("/api/me/overview");
      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error?.message || "Failed to fetch devices");
      }

      setDevices(data.data.devices);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("zh-CN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold mb-2">我的设备</h1>
          <p className="text-muted-foreground">
            查看所有设备及其维修状态
          </p>
        </div>
        <Link href="/api/auth/signout">
          <Button variant="outline" size="sm">
            <LogOut className="w-4 h-4 mr-2" />
            退出登录
          </Button>
        </Link>
      </div>

      {devices.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Smartphone className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg text-muted-foreground">
              未找到设备。请联系客服注册您的设备。
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {devices.map((device) => (
            <Card
              key={device.id}
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => router.push(`/me/devices/${device.id}`)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Smartphone className="w-5 h-5" />
                      {device.brand} {device.model}
                    </CardTitle>
                    <CardDescription>
                      {device.color && `${device.color}`}
                      {device.storage && ` • ${device.storage}`}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                {device.latestCase ? (
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">最新维修</span>
                        <Badge
                          className={`${
                            statusColors[device.latestCase.status] || "bg-gray-500"
                          } text-white`}
                        >
                          {statusLabels[device.latestCase.status] || device.latestCase.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">
                        {device.latestCase.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        工单号 #{device.latestCase.caseNumber}
                      </p>
                    </div>

                    {device.latestCase.location && (
                      <div className="flex items-start gap-2 text-sm">
                        <MapPin className="w-4 h-4 mt-0.5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">当前位置</p>
                          <p className="text-muted-foreground">
                            {device.latestCase.location}
                          </p>
                        </div>
                      </div>
                    )}

                    {device.latestCase.tracking && (
                      <div className="flex items-start gap-2 text-sm">
                        <Package className="w-4 h-4 mt-0.5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">物流追踪</p>
                          <p className="text-muted-foreground">
                            {device.latestCase.tracking.carrier}{" "}
                            {device.latestCase.tracking.trackingNumber}
                          </p>
                          {device.latestCase.tracking.currentLocation && (
                            <p className="text-xs text-muted-foreground">
                              {device.latestCase.tracking.currentLocation}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="pt-2 border-t">
                      <p className="text-xs text-muted-foreground">
                        最后更新：{formatDate(device.latestCase.lastUpdated)}
                      </p>
                    </div>

                    <Button className="w-full" variant="outline">
                      查看完整历史
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground">
                      暂无维修记录
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import {
  Loader2,
  ArrowLeft,
  Clock,
  MapPin,
  Package,
  LogOut,
  AlertTriangle,
} from "lucide-react";

interface StatusEvent {
  id: string;
  fromStatus: string | null;
  toStatus: string;
  notes: string | null;
  location: string | null;
  createdAt: string;
  operator: {
    username: string;
  };
}

interface ServiceRound {
  id: string;
  roundNo: number;
  issue: string;
  diagnosis: string | null;
  resolution: string | null;
  cost: number | null;
  warrantyDays: number | null;
  status: string;
  startedAt: string;
  completedAt: string | null;
  statusEvents: StatusEvent[];
  shipments: any[];
}

interface ServiceCase {
  id: string;
  caseNumber: string;
  title: string;
  description: string | null;
  createdAt: string;
  serviceRounds: ServiceRound[];
}

interface Device {
  id: string;
  brand: string;
  model: string;
  imei: string | null;
  color: string | null;
  storage: string | null;
  serviceCases: ServiceCase[];
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
  CANCELLED: "bg-gray-600",
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

export default function DeviceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [device, setDevice] = useState<Device | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (params.id) {
      fetchDevice(params.id as string);
    }
  }, [params.id]);

  const fetchDevice = async (id: string) => {
    try {
      const res = await fetch(`/api/me/devices/${id}`);
      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error?.message || "Failed to fetch device");
      }

      setDevice(data.data.device);
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("zh-CN", {
      style: "currency",
      currency: "CNY",
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !device) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">错误</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error || "未找到设备"}</p>
            <Button onClick={() => router.push("/me")} className="mt-4">
              返回我的设备
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 统计返修次数
  const totalRounds = device.serviceCases.reduce(
    (sum, serviceCase) => sum + serviceCase.serviceRounds.length,
    0
  );
  const hasMultipleReworks = device.serviceCases.some(
    (serviceCase) => serviceCase.serviceRounds.length > 2
  );

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <Button variant="ghost" onClick={() => router.push("/me")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回我的设备
          </Button>
          <Link href="/api/auth/signout">
            <Button variant="outline" size="sm">
              <LogOut className="w-4 h-4 mr-2" />
              退出登录
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl">
                  {device.brand} {device.model}
                </CardTitle>
                <div className="flex gap-4 text-sm text-muted-foreground mt-2">
                  {device.color && <span>颜色: {device.color}</span>}
                  {device.storage && <span>容量: {device.storage}</span>}
                  {device.imei && <span>IMEI: {device.imei}</span>}
                </div>
              </div>
              {hasMultipleReworks && (
                <Badge variant="destructive" className="flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  多次返修
                </Badge>
              )}
            </div>
          </CardHeader>
        </Card>
      </div>

      {/* Service History */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">维修历史</h2>
          {totalRounds > 1 && (
            <span className="text-sm text-muted-foreground">
              共 {totalRounds} 次维修记录
            </span>
          )}
        </div>

        {device.serviceCases.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              暂无维修历史
            </CardContent>
          </Card>
        ) : (
          device.serviceCases.map((serviceCase) => (
            <Card key={serviceCase.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{serviceCase.title}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      工单号 #{serviceCase.caseNumber} •{" "}
                      {formatDate(serviceCase.createdAt)}
                    </p>
                  </div>
                  {serviceCase.serviceRounds.length > 1 && (
                    <Badge variant="outline" className="text-orange-600 border-orange-600">
                      {serviceCase.serviceRounds.length} 次维修
                    </Badge>
                  )}
                </div>
                {serviceCase.description && (
                  <p className="text-sm text-muted-foreground mt-2">
                    {serviceCase.description}
                  </p>
                )}
              </CardHeader>

              <CardContent>
                {/* Service Rounds */}
                {serviceCase.serviceRounds.map((round, roundIdx) => (
                  <div key={round.id} className="mb-6 last:mb-0">
                    {serviceCase.serviceRounds.length > 1 && (
                      <div className="mb-3">
                        <Badge
                          variant={round.roundNo > 1 ? "destructive" : "outline"}
                          className="text-sm"
                        >
                          第 {round.roundNo} 次维修
                          {round.roundNo > 1 && " (返修)"}
                        </Badge>
                      </div>
                    )}

                    {/* Issue & Resolution */}
                    <div className="mb-4 p-4 bg-muted rounded-lg">
                      <div className="mb-3">
                        <p className="text-sm font-medium mb-1">问题描述</p>
                        <p className="text-sm text-muted-foreground">
                          {round.issue}
                        </p>
                      </div>

                      {round.diagnosis && (
                        <div className="mb-3">
                          <p className="text-sm font-medium mb-1">诊断结果</p>
                          <p className="text-sm text-muted-foreground">
                            {round.diagnosis}
                          </p>
                        </div>
                      )}

                      {round.resolution && (
                        <div className="mb-3">
                          <p className="text-sm font-medium mb-1">解决方案</p>
                          <p className="text-sm text-muted-foreground">
                            {round.resolution}
                          </p>
                        </div>
                      )}

                      <div className="flex gap-4 text-sm">
                        {round.cost !== null && (
                          <div>
                            <span className="font-medium">费用:</span>{" "}
                            <span className="text-muted-foreground">
                              {formatCurrency(round.cost)}
                            </span>
                          </div>
                        )}
                        {round.warrantyDays !== null && (
                          <div>
                            <span className="font-medium">保修期:</span>{" "}
                            <span className="text-muted-foreground">
                              {round.warrantyDays} 天
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Status Timeline */}
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        状态时间线
                      </h4>

                      <div className="relative pl-6 border-l-2 border-muted">
                        {round.statusEvents.map((event, idx) => (
                          <div
                            key={event.id}
                            className="mb-4 last:mb-0 relative"
                          >
                            <div
                              className={`absolute -left-[25px] w-3 h-3 rounded-full ${
                                statusColors[event.toStatus] || "bg-gray-500"
                              }`}
                            />

                            <div className="bg-card border rounded-lg p-3">
                              <div className="flex items-start justify-between mb-1">
                                <Badge
                                  className={`${
                                    statusColors[event.toStatus] || "bg-gray-500"
                                  } text-white`}
                                >
                                  {statusLabels[event.toStatus] || event.toStatus}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {formatDate(event.createdAt)}
                                </span>
                              </div>

                              {event.location && (
                                <p className="text-sm flex items-center gap-1 mb-1">
                                  <MapPin className="w-3 h-3" />
                                  {event.location}
                                </p>
                              )}

                              {event.notes && (
                                <p className="text-sm text-muted-foreground">
                                  {event.notes}
                                </p>
                              )}

                              <p className="text-xs text-muted-foreground mt-1">
                                操作员: {event.operator.username}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Shipments */}
                    {round.shipments.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                          <Package className="w-4 h-4" />
                          物流信息
                        </h4>
                        {round.shipments.map((shipment: any) => (
                          <div
                            key={shipment.id}
                            className="p-3 bg-muted rounded-lg mb-2"
                          >
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <p className="text-sm font-medium">
                                  {shipment.type === "INBOUND"
                                    ? "寄入"
                                    : "寄出"}
                                </p>
                                {shipment.trackingNumber && (
                                  <p className="text-sm text-muted-foreground">
                                    {shipment.carrier} -{" "}
                                    {shipment.trackingNumber}
                                  </p>
                                )}
                              </div>
                              <Badge variant="outline">
                                {shipment.status === "SIGNED" ? "已签收" :
                                 shipment.status === "IN_TRANSIT" ? "运输中" :
                                 shipment.status === "ARRIVED" ? "已到达" :
                                 shipment.status === "PENDING" ? "待发货" :
                                 shipment.status}
                              </Badge>
                            </div>

                            {shipment.currentLocation && (
                              <p className="text-sm text-muted-foreground">
                                当前位置: {shipment.currentLocation}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {roundIdx < serviceCase.serviceRounds.length - 1 && (
                      <Separator className="my-6" />
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

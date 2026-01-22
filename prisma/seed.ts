import { PrismaClient, Permission, ServiceStatus, ShipmentStatus, ShipmentType } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

// 辅助函数：计算相对日期
function daysAgo(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(9, 0, 0, 0);
  return date;
}

function hoursAgo(hours: number): Date {
  const date = new Date();
  date.setHours(date.getHours() - hours);
  return date;
}

// 生成工单号
function generateCaseNumber(daysAgo: number, seq: number): string {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, "");
  return `CS${dateStr}${String(seq).padStart(3, "0")}`;
}

async function main() {
  console.log("🌱 开始填充测试数据...\n");

  // ========== 第一步：清除所有现有数据 ==========
  console.log("🗑️  清除现有数据...");
  await prisma.auditLog.deleteMany();
  await prisma.statusEvent.deleteMany();
  await prisma.shipment.deleteMany();
  await prisma.serviceRound.deleteMany();
  await prisma.serviceCase.deleteMany();
  await prisma.device.deleteMany();
  await prisma.staffPermission.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.user.deleteMany();
  console.log("✅ 数据清除完成\n");

  // ========== 第二步：创建用户 ==========
  console.log("👤 创建用户账号...");
  const password = await hash("password123", 10);

  // 管理员
  const boss = await prisma.user.create({
    data: {
      username: "boss",
      password,
      role: "BOSS",
      email: "admin@mobile-service.com",
      phone: "13800000001",
    },
  });
  console.log("   ✅ 管理员: boss");

  // 员工1 - 全权限维修技术员
  const staff1 = await prisma.user.create({
    data: {
      username: "staff1",
      password,
      role: "STAFF",
      email: "tech1@mobile-service.com",
      phone: "13800000002",
      staffPermissions: {
        create: [
          { permission: Permission.CASE_READ_ALL, createdBy: boss.id },
          { permission: Permission.CASE_WRITE, createdBy: boss.id },
          { permission: Permission.DEVICE_READ, createdBy: boss.id },
          { permission: Permission.DEVICE_WRITE, createdBy: boss.id },
          { permission: Permission.CUSTOMER_READ_ALL, createdBy: boss.id },
          { permission: Permission.SHIPMENT_READ, createdBy: boss.id },
          { permission: Permission.SHIPMENT_WRITE, createdBy: boss.id },
        ],
      },
    },
  });
  console.log("   ✅ 员工1: staff1 (维修技术员)");

  // 员工2 - 物流专员
  const staff2 = await prisma.user.create({
    data: {
      username: "staff2",
      password,
      role: "STAFF",
      email: "logistics@mobile-service.com",
      phone: "13800000003",
      staffPermissions: {
        create: [
          { permission: Permission.CASE_READ_ALL, createdBy: boss.id },
          { permission: Permission.CASE_WRITE, createdBy: boss.id },
          { permission: Permission.SHIPMENT_READ, createdBy: boss.id },
          { permission: Permission.SHIPMENT_WRITE, createdBy: boss.id },
          { permission: Permission.CUSTOMER_READ_ALL, createdBy: boss.id },
        ],
      },
    },
  });
  console.log("   ✅ 员工2: staff2 (物流专员)");

  // 客户1 - 张三
  const customer1 = await prisma.user.create({
    data: {
      username: "customer1",
      password,
      role: "CUSTOMER",
      email: "zhangsan@email.com",
      phone: "13900001001",
      customer: {
        create: {
          name: "张三",
          phone: "13900001001",
          email: "zhangsan@email.com",
          address: "北京市朝阳区建国路88号SOHO现代城A座1201",
        },
      },
    },
    include: { customer: true },
  });
  console.log("   ✅ 客户1: customer1 (张三)");

  // 客户2 - 李四
  const customer2 = await prisma.user.create({
    data: {
      username: "customer2",
      password,
      role: "CUSTOMER",
      email: "lisi@email.com",
      phone: "13900001002",
      customer: {
        create: {
          name: "李四",
          phone: "13900001002",
          email: "lisi@email.com",
          address: "上海市浦东新区陆家嘴环路1000号恒生银行大厦",
        },
      },
    },
    include: { customer: true },
  });
  console.log("   ✅ 客户2: customer2 (李四)");

  // 客户3 - 王五
  const customer3 = await prisma.user.create({
    data: {
      username: "customer3",
      password,
      role: "CUSTOMER",
      email: "wangwu@email.com",
      phone: "13900001003",
      customer: {
        create: {
          name: "王五",
          phone: "13900001003",
          email: "wangwu@email.com",
          address: "广州市天河区珠江新城花城大道85号高德置地广场",
        },
      },
    },
    include: { customer: true },
  });
  console.log("   ✅ 客户3: customer3 (王五)\n");

  // ========== 第三步：创建设备 ==========
  console.log("📱 创建设备...");

  // 张三的设备
  const device1 = await prisma.device.create({
    data: {
      customerId: customer1.customer!.id,
      brand: "Apple",
      model: "iPhone 15 Pro Max",
      imei: "356789012345678",
      serial: "F2LXK1234567",
      color: "原色钛金属",
      storage: "256GB",
    },
  });
  console.log("   ✅ iPhone 15 Pro Max (张三)");

  const device2 = await prisma.device.create({
    data: {
      customerId: customer1.customer!.id,
      brand: "Apple",
      model: "iPad Pro 12.9",
      imei: "356789012345679",
      serial: "DLXK4567890",
      color: "深空灰",
      storage: "512GB",
    },
  });
  console.log("   ✅ iPad Pro 12.9 (张三)");

  // 李四的设备
  const device3 = await prisma.device.create({
    data: {
      customerId: customer2.customer!.id,
      brand: "Samsung",
      model: "Galaxy S24 Ultra",
      imei: "352456789012345",
      serial: "R5CT12345678",
      color: "钛灰",
      storage: "512GB",
    },
  });
  console.log("   ✅ Galaxy S24 Ultra (李四)");

  const device4 = await prisma.device.create({
    data: {
      customerId: customer2.customer!.id,
      brand: "Xiaomi",
      model: "小米14 Ultra",
      imei: "869012345678901",
      serial: "MI14U2024001",
      color: "黑色",
      storage: "512GB",
    },
  });
  console.log("   ✅ 小米14 Ultra (李四)");

  // 王五的设备
  const device5 = await prisma.device.create({
    data: {
      customerId: customer3.customer!.id,
      brand: "Apple",
      model: "iPhone 14 Pro",
      imei: "352789456123789",
      serial: "C7LXK9876543",
      color: "暗紫色",
      storage: "256GB",
    },
  });
  console.log("   ✅ iPhone 14 Pro (王五)\n");

  // ========== 第四步：创建维修工单 ==========
  console.log("🔧 创建维修工单...\n");

  // ---------- 工单1: 已完成 - 张三的 iPhone 15 Pro Max 换电池 ----------
  console.log("   📋 工单1: iPhone 15 Pro Max 电池更换 (已完成)");
  const case1 = await prisma.serviceCase.create({
    data: {
      deviceId: device1.id,
      caseNumber: generateCaseNumber(15, 1),
      title: "电池健康度低，需要更换",
      description: "客户反馈电池续航明显下降，充满电后使用不到半天",
      closedAt: daysAgo(3),
    },
  });

  const round1_1 = await prisma.serviceRound.create({
    data: {
      serviceCaseId: case1.id,
      roundNo: 1,
      issue: "电池健康度仅78%，充电循环次数超过800次",
      diagnosis: "电池严重老化，内阻增大，容量下降",
      resolution: "更换原装电池，校准电量显示",
      cost: 749,
      warrantyDays: 90,
      status: ServiceStatus.CLOSED,
      startedAt: daysAgo(15),
      completedAt: daysAgo(3),
    },
  });

  // 工单1的状态事件
  await prisma.statusEvent.createMany({
    data: [
      { serviceRoundId: round1_1.id, fromStatus: null, toStatus: ServiceStatus.PENDING, notes: "客户提交维修申请", location: "线上", operatorId: staff1.id, createdAt: daysAgo(15) },
      { serviceRoundId: round1_1.id, fromStatus: ServiceStatus.PENDING, toStatus: ServiceStatus.RECEIVED, notes: "设备已签收入库", location: "主仓库", operatorId: staff2.id, createdAt: daysAgo(13) },
      { serviceRoundId: round1_1.id, fromStatus: ServiceStatus.RECEIVED, toStatus: ServiceStatus.DIAGNOSING, notes: "开始检测电池状态", location: "维修工位A1", operatorId: staff1.id, createdAt: daysAgo(12) },
      { serviceRoundId: round1_1.id, fromStatus: ServiceStatus.DIAGNOSING, toStatus: ServiceStatus.REPAIRING, notes: "确认需要更换电池，开始维修", location: "维修工位A1", operatorId: staff1.id, createdAt: daysAgo(11) },
      { serviceRoundId: round1_1.id, fromStatus: ServiceStatus.REPAIRING, toStatus: ServiceStatus.QA, notes: "电池更换完成，进入质检", location: "质检区", operatorId: staff1.id, createdAt: daysAgo(10) },
      { serviceRoundId: round1_1.id, fromStatus: ServiceStatus.QA, toStatus: ServiceStatus.READY_TO_SHIP, notes: "质检通过，电池健康度100%", location: "发货区", operatorId: staff2.id, createdAt: daysAgo(8) },
      { serviceRoundId: round1_1.id, fromStatus: ServiceStatus.READY_TO_SHIP, toStatus: ServiceStatus.SHIPPING, notes: "已交付顺丰快递", location: "运输中", operatorId: staff2.id, createdAt: daysAgo(6) },
      { serviceRoundId: round1_1.id, fromStatus: ServiceStatus.SHIPPING, toStatus: ServiceStatus.DELIVERED, notes: "客户已签收", location: "客户地址", operatorId: staff2.id, createdAt: daysAgo(4) },
      { serviceRoundId: round1_1.id, fromStatus: ServiceStatus.DELIVERED, toStatus: ServiceStatus.CLOSED, notes: "客户确认维修完成，工单关闭", location: "系统", operatorId: staff1.id, createdAt: daysAgo(3) },
    ],
  });

  // 工单1的物流信息
  await prisma.shipment.createMany({
    data: [
      { serviceRoundId: round1_1.id, type: ShipmentType.INBOUND, trackingNumber: "SF1001234567890", carrier: "顺丰速运", status: ShipmentStatus.SIGNED, origin: "北京市朝阳区", destination: "维修中心", currentLocation: "已签收", shippedAt: daysAgo(14), actualArrival: daysAgo(13), operatorId: staff2.id },
      { serviceRoundId: round1_1.id, type: ShipmentType.OUTBOUND, trackingNumber: "SF1009876543210", carrier: "顺丰速运", status: ShipmentStatus.SIGNED, origin: "维修中心", destination: "北京市朝阳区", currentLocation: "已签收", shippedAt: daysAgo(6), actualArrival: daysAgo(4), operatorId: staff2.id },
    ],
  });

  // ---------- 工单2: 维修中 - 张三的 iPad Pro 屏幕问题 ----------
  console.log("   📋 工单2: iPad Pro 屏幕闪烁 (维修中)");
  const case2 = await prisma.serviceCase.create({
    data: {
      deviceId: device2.id,
      caseNumber: generateCaseNumber(5, 1),
      title: "屏幕偶发性闪烁",
      description: "使用过程中屏幕会突然闪烁几下，重启后暂时恢复",
    },
  });

  const round2_1 = await prisma.serviceRound.create({
    data: {
      serviceCaseId: case2.id,
      roundNo: 1,
      issue: "屏幕闪烁，疑似排线或显示芯片问题",
      diagnosis: "检测发现屏幕排线接触不良",
      status: ServiceStatus.REPAIRING,
      startedAt: daysAgo(5),
    },
  });

  await prisma.statusEvent.createMany({
    data: [
      { serviceRoundId: round2_1.id, fromStatus: null, toStatus: ServiceStatus.PENDING, notes: "客户提交维修申请", location: "线上", operatorId: staff1.id, createdAt: daysAgo(5) },
      { serviceRoundId: round2_1.id, fromStatus: ServiceStatus.PENDING, toStatus: ServiceStatus.RECEIVED, notes: "设备到达仓库", location: "主仓库", operatorId: staff2.id, createdAt: daysAgo(4) },
      { serviceRoundId: round2_1.id, fromStatus: ServiceStatus.RECEIVED, toStatus: ServiceStatus.DIAGNOSING, notes: "开始排查闪屏原因", location: "维修工位A2", operatorId: staff1.id, createdAt: daysAgo(3) },
      { serviceRoundId: round2_1.id, fromStatus: ServiceStatus.DIAGNOSING, toStatus: ServiceStatus.REPAIRING, notes: "确认排线问题，正在重新连接", location: "维修工位A2", operatorId: staff1.id, createdAt: daysAgo(1) },
    ],
  });

  await prisma.shipment.create({
    data: { serviceRoundId: round2_1.id, type: ShipmentType.INBOUND, trackingNumber: "YT2001234567890", carrier: "圆通速递", status: ShipmentStatus.SIGNED, origin: "北京市朝阳区", destination: "维修中心", currentLocation: "已签收", shippedAt: daysAgo(5), actualArrival: daysAgo(4), operatorId: staff2.id },
  });

  // ---------- 工单3: 等待配件 - 李四的 Galaxy S24 主板问题 ----------
  console.log("   📋 工单3: Galaxy S24 Ultra 主板故障 (等待配件)");
  const case3 = await prisma.serviceCase.create({
    data: {
      deviceId: device3.id,
      caseNumber: generateCaseNumber(7, 1),
      title: "手机频繁死机重启",
      description: "最近一周手机频繁自动重启，有时会死机卡住",
    },
  });

  const round3_1 = await prisma.serviceRound.create({
    data: {
      serviceCaseId: case3.id,
      roundNo: 1,
      issue: "频繁死机重启，系统不稳定",
      diagnosis: "主板电源管理芯片故障，需要更换",
      status: ServiceStatus.AWAITING_PARTS,
      startedAt: daysAgo(7),
    },
  });

  await prisma.statusEvent.createMany({
    data: [
      { serviceRoundId: round3_1.id, fromStatus: null, toStatus: ServiceStatus.PENDING, notes: "收到维修请求", location: "线上", operatorId: staff1.id, createdAt: daysAgo(7) },
      { serviceRoundId: round3_1.id, fromStatus: ServiceStatus.PENDING, toStatus: ServiceStatus.RECEIVED, notes: "设备入库", location: "主仓库", operatorId: staff2.id, createdAt: daysAgo(6) },
      { serviceRoundId: round3_1.id, fromStatus: ServiceStatus.RECEIVED, toStatus: ServiceStatus.DIAGNOSING, notes: "进行全面检测", location: "维修工位B1", operatorId: staff1.id, createdAt: daysAgo(5) },
      { serviceRoundId: round3_1.id, fromStatus: ServiceStatus.DIAGNOSING, toStatus: ServiceStatus.AWAITING_PARTS, notes: "需要订购三星原厂电源管理芯片，预计3天到货", location: "配件仓库", operatorId: staff1.id, createdAt: daysAgo(3) },
    ],
  });

  await prisma.shipment.create({
    data: { serviceRoundId: round3_1.id, type: ShipmentType.INBOUND, trackingNumber: "JD3001234567890", carrier: "京东物流", status: ShipmentStatus.SIGNED, origin: "上海市浦东新区", destination: "维修中心", currentLocation: "已签收", shippedAt: daysAgo(7), actualArrival: daysAgo(6), operatorId: staff2.id },
  });

  // ---------- 工单4: 返修案例 - 李四的小米14 (2次维修) ----------
  console.log("   📋 工单4: 小米14 Ultra 相机故障 (返修中)");
  const case4 = await prisma.serviceCase.create({
    data: {
      deviceId: device4.id,
      caseNumber: generateCaseNumber(20, 1),
      title: "相机无法对焦",
      description: "主摄像头无法自动对焦，照片模糊",
    },
  });

  // 第一轮维修
  const round4_1 = await prisma.serviceRound.create({
    data: {
      serviceCaseId: case4.id,
      roundNo: 1,
      issue: "主摄像头无法对焦",
      diagnosis: "对焦马达卡住",
      resolution: "清理对焦马达，重新校准",
      cost: 299,
      warrantyDays: 30,
      status: ServiceStatus.DELIVERED,
      startedAt: daysAgo(20),
      completedAt: daysAgo(12),
    },
  });

  await prisma.statusEvent.createMany({
    data: [
      { serviceRoundId: round4_1.id, fromStatus: null, toStatus: ServiceStatus.PENDING, notes: "客户报修相机问题", location: "线上", operatorId: staff1.id, createdAt: daysAgo(20) },
      { serviceRoundId: round4_1.id, fromStatus: ServiceStatus.PENDING, toStatus: ServiceStatus.RECEIVED, notes: "设备入库", location: "主仓库", operatorId: staff2.id, createdAt: daysAgo(18) },
      { serviceRoundId: round4_1.id, fromStatus: ServiceStatus.RECEIVED, toStatus: ServiceStatus.DIAGNOSING, notes: "检测相机模组", location: "维修工位C1", operatorId: staff1.id, createdAt: daysAgo(17) },
      { serviceRoundId: round4_1.id, fromStatus: ServiceStatus.DIAGNOSING, toStatus: ServiceStatus.REPAIRING, notes: "清理对焦马达", location: "维修工位C1", operatorId: staff1.id, createdAt: daysAgo(16) },
      { serviceRoundId: round4_1.id, fromStatus: ServiceStatus.REPAIRING, toStatus: ServiceStatus.QA, notes: "维修完成，测试对焦", location: "质检区", operatorId: staff1.id, createdAt: daysAgo(15) },
      { serviceRoundId: round4_1.id, fromStatus: ServiceStatus.QA, toStatus: ServiceStatus.SHIPPING, notes: "寄回客户", location: "运输中", operatorId: staff2.id, createdAt: daysAgo(14) },
      { serviceRoundId: round4_1.id, fromStatus: ServiceStatus.SHIPPING, toStatus: ServiceStatus.DELIVERED, notes: "客户签收", location: "客户地址", operatorId: staff2.id, createdAt: daysAgo(12) },
    ],
  });

  // 第二轮维修（返修）
  const round4_2 = await prisma.serviceRound.create({
    data: {
      serviceCaseId: case4.id,
      roundNo: 2,
      issue: "对焦问题复发，且出现拍照时异响",
      diagnosis: "对焦马达损坏，需要更换整个相机模组",
      status: ServiceStatus.DIAGNOSING,
      startedAt: daysAgo(8),
    },
  });

  await prisma.statusEvent.createMany({
    data: [
      { serviceRoundId: round4_2.id, fromStatus: ServiceStatus.DELIVERED, toStatus: ServiceStatus.RETURNED, notes: "客户反馈问题复发，申请返修", location: "退货部门", operatorId: staff2.id, createdAt: daysAgo(10) },
      { serviceRoundId: round4_2.id, fromStatus: ServiceStatus.RETURNED, toStatus: ServiceStatus.RECEIVED, notes: "返修设备入库", location: "主仓库", operatorId: staff2.id, createdAt: daysAgo(8) },
      { serviceRoundId: round4_2.id, fromStatus: ServiceStatus.RECEIVED, toStatus: ServiceStatus.DIAGNOSING, notes: "重新检测，发现马达彻底损坏", location: "维修工位C1", operatorId: staff1.id, createdAt: daysAgo(6) },
    ],
  });

  await prisma.shipment.createMany({
    data: [
      { serviceRoundId: round4_1.id, type: ShipmentType.INBOUND, trackingNumber: "SF4001234567890", carrier: "顺丰速运", status: ShipmentStatus.SIGNED, origin: "上海市浦东新区", destination: "维修中心", currentLocation: "已签收", shippedAt: daysAgo(19), actualArrival: daysAgo(18), operatorId: staff2.id },
      { serviceRoundId: round4_1.id, type: ShipmentType.OUTBOUND, trackingNumber: "SF4009876543210", carrier: "顺丰速运", status: ShipmentStatus.SIGNED, origin: "维修中心", destination: "上海市浦东新区", currentLocation: "已签收", shippedAt: daysAgo(14), actualArrival: daysAgo(12), operatorId: staff2.id },
      { serviceRoundId: round4_2.id, type: ShipmentType.INBOUND, trackingNumber: "SF4002345678901", carrier: "顺丰速运", status: ShipmentStatus.SIGNED, origin: "上海市浦东新区", destination: "维修中心", currentLocation: "已签收", shippedAt: daysAgo(9), actualArrival: daysAgo(8), operatorId: staff2.id },
    ],
  });

  // ---------- 工单5: 新工单 - 王五的 iPhone 14 Pro ----------
  console.log("   📋 工单5: iPhone 14 Pro 进水 (刚接收)");
  const case5 = await prisma.serviceCase.create({
    data: {
      deviceId: device5.id,
      caseNumber: generateCaseNumber(2, 1),
      title: "手机意外进水无法开机",
      description: "手机掉入水中，捞出后无法开机，屏幕有水印",
    },
  });

  const round5_1 = await prisma.serviceRound.create({
    data: {
      serviceCaseId: case5.id,
      roundNo: 1,
      issue: "进水导致无法开机",
      status: ServiceStatus.RECEIVED,
      startedAt: daysAgo(2),
    },
  });

  await prisma.statusEvent.createMany({
    data: [
      { serviceRoundId: round5_1.id, fromStatus: null, toStatus: ServiceStatus.PENDING, notes: "客户紧急报修，进水手机", location: "线上", operatorId: staff1.id, createdAt: daysAgo(2) },
      { serviceRoundId: round5_1.id, fromStatus: ServiceStatus.PENDING, toStatus: ServiceStatus.RECEIVED, notes: "设备已到达，准备拆机检查", location: "主仓库", operatorId: staff2.id, createdAt: hoursAgo(12) },
    ],
  });

  await prisma.shipment.create({
    data: { serviceRoundId: round5_1.id, type: ShipmentType.INBOUND, trackingNumber: "SF5001234567890", carrier: "顺丰速运", status: ShipmentStatus.SIGNED, origin: "广州市天河区", destination: "维修中心", currentLocation: "已签收", shippedAt: daysAgo(2), actualArrival: hoursAgo(12), operatorId: staff2.id },
  });

  console.log("");

  // ========== 第五步：创建审计日志 ==========
  console.log("📝 创建审计日志...");
  await prisma.auditLog.createMany({
    data: [
      { userId: boss.id, action: "CREATE_USER", resource: "User", resourceId: staff1.id, details: JSON.stringify({ username: "staff1", role: "STAFF" }), createdAt: daysAgo(30) },
      { userId: boss.id, action: "CREATE_USER", resource: "User", resourceId: staff2.id, details: JSON.stringify({ username: "staff2", role: "STAFF" }), createdAt: daysAgo(30) },
      { userId: boss.id, action: "ASSIGN_PERMISSION", resource: "StaffPermission", resourceId: staff1.id, details: JSON.stringify({ permissions: ["CASE_READ_ALL", "CASE_WRITE", "DEVICE_READ"] }), createdAt: daysAgo(30) },
      { userId: staff1.id, action: "CREATE_CASE", resource: "ServiceCase", resourceId: case1.id, details: JSON.stringify({ caseNumber: case1.caseNumber, title: case1.title }), createdAt: daysAgo(15) },
      { userId: staff1.id, action: "UPDATE_STATUS", resource: "ServiceRound", resourceId: round1_1.id, details: JSON.stringify({ from: "PENDING", to: "RECEIVED" }), createdAt: daysAgo(13) },
      { userId: staff1.id, action: "CREATE_CASE", resource: "ServiceCase", resourceId: case2.id, details: JSON.stringify({ caseNumber: case2.caseNumber, title: case2.title }), createdAt: daysAgo(5) },
      { userId: staff1.id, action: "CREATE_CASE", resource: "ServiceCase", resourceId: case3.id, details: JSON.stringify({ caseNumber: case3.caseNumber, title: case3.title }), createdAt: daysAgo(7) },
      { userId: staff1.id, action: "CREATE_CASE", resource: "ServiceCase", resourceId: case4.id, details: JSON.stringify({ caseNumber: case4.caseNumber, title: case4.title }), createdAt: daysAgo(20) },
      { userId: staff1.id, action: "CREATE_CASE", resource: "ServiceCase", resourceId: case5.id, details: JSON.stringify({ caseNumber: case5.caseNumber, title: case5.title }), createdAt: daysAgo(2) },
      { userId: staff2.id, action: "CREATE_SHIPMENT", resource: "Shipment", details: JSON.stringify({ type: "INBOUND", carrier: "顺丰速运" }), createdAt: daysAgo(14) },
    ],
  });
  console.log("   ✅ 审计日志创建完成\n");

  // ========== 完成 ==========
  console.log("═══════════════════════════════════════════════════════════");
  console.log("✨ 测试数据填充完成！");
  console.log("═══════════════════════════════════════════════════════════\n");

  console.log("📋 数据摘要:");
  console.log("┌─────────────────────────────────────────────────────────┐");
  console.log("│ 用户账号                                                 │");
  console.log("├─────────────────────────────────────────────────────────┤");
  console.log("│ 管理员:  boss       / password123                        │");
  console.log("│ 员工1:   staff1     / password123  (维修技术员)          │");
  console.log("│ 员工2:   staff2     / password123  (物流专员)            │");
  console.log("│ 客户1:   customer1  / password123  (张三-北京)           │");
  console.log("│ 客户2:   customer2  / password123  (李四-上海)           │");
  console.log("│ 客户3:   customer3  / password123  (王五-广州)           │");
  console.log("└─────────────────────────────────────────────────────────┘\n");

  console.log("📱 设备统计:");
  console.log("   • 张三: iPhone 15 Pro Max, iPad Pro 12.9");
  console.log("   • 李四: Galaxy S24 Ultra, 小米14 Ultra");
  console.log("   • 王五: iPhone 14 Pro\n");

  console.log("🔧 工单统计:");
  console.log("   • 工单1: 电池更换      [已完成] - 张三 iPhone 15 Pro Max");
  console.log("   • 工单2: 屏幕闪烁      [维修中] - 张三 iPad Pro");
  console.log("   • 工单3: 主板故障      [等待配件] - 李四 Galaxy S24 Ultra");
  console.log("   • 工单4: 相机对焦(返修) [诊断中] - 李四 小米14 Ultra");
  console.log("   • 工单5: 进水维修      [已接收] - 王五 iPhone 14 Pro\n");

  console.log("═══════════════════════════════════════════════════════════\n");
}

main()
  .catch((e) => {
    console.error("❌ 数据填充失败:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

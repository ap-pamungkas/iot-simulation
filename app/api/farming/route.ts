import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      temp,
      humidity,
      soilMoisture,
      deviceCode,
    } = body;

    // 1. Validasi dasar
    if (
      typeof temp !== "number" ||
      humidity === undefined ||
      soilMoisture === undefined ||
      !deviceCode
    ) {
      return NextResponse.json(
        { message: "Data tidak valid atau tidak lengkap" },
        { status: 400 }
      );
    }

    // 2. Cari ID (angka) dari device berdasarkan deviceCode (string)
    // Karena tabel SensorLog butuh deviceId (Int), bukan deviceCode (String)
    const device = await prisma.device.findUnique({
      where: { deviceCode: deviceCode }
    });

    if (!device) {
      return NextResponse.json(
        { message: `Device dengan kode ${deviceCode} tidak ditemukan` },
        { status: 404 }
      );
    }

    // 3. Simpan log sensor menggunakan ID angka dari device yang ditemukan
    const log = await prisma.sensorLog.create({
      data: {
        temperature: temp,
        humidity: humidity,
        soilMoisture: soilMoisture,
        deviceId: device.id, // Ini akan bernilai 1 jika device-nya FARM-001
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Data sensor berhasil disimpan!",
        data: log,
      },
      { status: 201 }
    );
    
  } catch (error: any) {
    console.error("[POST /api/farming]", error.message);

    return NextResponse.json(
      { 
        success: false, 
        message: "Internal Server Error", 
        details: error.message 
      },
      { status: 500 }
    );
  }
}



export async function GET() {
    try {
        // Menarik semua data Device sekaligus menyertakan semua riwayat SensorLog-nya
        const allData = await prisma.device.findMany({
            include: {
                logs: {
                    orderBy: {
                        createdAt: 'desc' // Mengurutkan log dari yang terbaru
                    }
                },
                irrigationLogs: {
                    orderBy: {
                        createdAt: 'desc'
                    }
                }
            }
        });

        return NextResponse.json({
            success: true,
            message: "Data Smart Farming Berhasil Diambil!",
            totalDevices: allData.length,
            data: allData
        });
    } catch (error: any) {
        console.error("[GET /api/farming] Error details:", error.message);

        return NextResponse.json(
            { 
                success: false, 
                message: "Gagal menarik data dari database",
                error: error.message 
            },
            { status: 500 }
        );
    }
}



export async function PATCH(req: Request) {
  try {
    const body = await req.json();

    const {
      deviceCode,
      pumpStatus,
      duration,
    } = body;

    // 1. Validasi dasar
    if (!deviceCode || typeof pumpStatus !== "boolean") {
      return NextResponse.json(
        {
          success: false,
          message: "deviceCode dan pumpStatus wajib diisi",
        },
        { status: 400 }
      );
    }

    // 2. Cari device berdasarkan deviceCode
    const device = await prisma.device.findUnique({
      where: { deviceCode },
    });

    if (!device) {
      return NextResponse.json(
        {
          success: false,
          message: `Device dengan kode ${deviceCode} tidak ditemukan`,
        },
        { status: 404 }
      );
    }

    // 2.5 Cek apakah device aktif (online)
    // Anggap device mati jika tidak ada "lastSeen" diperbarui > 1 menit (atau sesuaikan)
    const MAX_OFFLINE_DURATION = 60 * 1000; // 1 menit toleransi
    const lastSeenTime = new Date(device.lastSeen).getTime();
    const now = Date.now();

    if (now - lastSeenTime > MAX_OFFLINE_DURATION) {
      return NextResponse.json(
        {
          success: false,
          message: `Device ${deviceCode} sedang offline/tidak aktif. Terakhir terlihat: ${new Date(device.lastSeen).toLocaleString()}`,
        },
        { status: 408 } // 408 Request Timeout atau 503 Service Unavailable
      );
    }

    // 3. Update device & Catat Log Irigasi jika menyala
    const updatedDevice = await prisma.$transaction(async (tx) => {
      const dev = await tx.device.update({
        where: { deviceCode },
        data: {
          pumpStatus: pumpStatus,
          duration: typeof duration === "number" ? duration : device.duration,
          lastSeen: new Date(),
        },
      });

      // Jika pompa dinyalakan, catat ke IrrigationLog
      if (pumpStatus === true) {
        await tx.irrigationLog.create({
          data: {
            deviceId: dev.id,
            duration: dev.duration,
            createdAt: new Date(),
          },
        });
      }

      return dev;
    });

    return NextResponse.json(
      {
        success: true,
        message: "Status pompa berhasil diperbarui",
        data: {
          deviceCode: updatedDevice.deviceCode,
          pumpStatus: updatedDevice.pumpStatus,
          duration: updatedDevice.duration,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[PATCH /api/farming]", error.message);

    return NextResponse.json(
      {
        success: false,
        message: "Internal Server Error",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

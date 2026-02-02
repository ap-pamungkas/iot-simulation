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

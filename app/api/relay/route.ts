import mqtt from "mqtt";
import { NextResponse } from "next/server";

const MQTT_BROKER = "mqtt://broker.emqx.io";
const MQTT_TOPIC = "iot-simulation/relay";

export async function POST(request: Request) {
  try {
    const { command } = await request.json();
    
    // Connect to the MQTT broker
    const client = mqtt.connect(MQTT_BROKER);

    return new Promise<NextResponse>((resolve, reject) => {
        client.on("connect", () => {
            console.log("Connected to MQTT Broker");
            
            // Publish the command
            const message = JSON.stringify({ message: command });
            client.publish(MQTT_TOPIC, message, {}, (error) => {
                client.end(); // Close connection after publishing
                if (error) {
                    console.error("MQTT Publish Error:", error);
                    resolve(NextResponse.json({ success: false, error: "Failed to publish" }, { status: 500 }));
                } else {
                    console.log(`Published: ${message} to ${MQTT_TOPIC}`);
                     resolve(NextResponse.json({ success: true, message: `Relay is ${command}` }));
                }
            });
        });

        client.on("error", (error) => {
            console.error("MQTT Connection Error:", error);
            client.end();
            resolve(NextResponse.json({ success: false, error: "Broker connection failed" }, { status: 500 }));
        });
    });

  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
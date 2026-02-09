"use client";
export default function RelayPage() {
  async function handleRelay(command: string) {
    const response = await fetch("/api/relay", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ command }),
    });
    const data = await response.json();
    console.log(data);
  }
  return (
    <div>
      <h1>Relay Page</h1>
      <button onClick={() => handleRelay("on")}>ON</button>
      <button onClick={() => handleRelay("off")}>OFF</button>
    </div>
  );
}

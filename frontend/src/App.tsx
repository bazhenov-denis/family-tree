import { useEffect, useState } from "react";

function App() {
  const [message, setMessage] = useState("Loading...");

  useEffect(() => {
    fetch("/api/ping")
      .then((res) => {
        if (!res.ok) {
          throw new Error("Request failed");
        }
        return res.text();
      })
      .then((data) => setMessage(data))
      .catch((err) => {
        console.error(err);
        setMessage("Error connecting to backend");
      });
  }, []);

  return (
    <div style={{ padding: 40, fontSize: 24 }}>
      <h1>Family Tree App</h1>
      <p>{message}</p>
    </div>
  );
}

export default App;

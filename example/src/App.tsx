import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";
import { useExampleStore } from "./store";

function App() {
  const count = useExampleStore((state) => state.count);
  const isReady = useExampleStore((state) => state.isReady);
  const increment = useExampleStore((state) => state.increment);
  const decrement = useExampleStore((state) => state.decrement);
  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <button onClick={increment}>count is {count}</button>
        <button onClick={decrement}>decrement</button>
        <p>Sync status: {isReady ? "🟢 Connected" : "🔴 Disconnected"}</p>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  );
}

export default App;

"use client";

import { useState } from "react";
import SearchBox from "./components/SearchBox";
import Dashboard from "./components/Dashboard";

export default function Home() {
  const [user, setUser] = useState(null);

  return (
    <div
      className="min-h-screen bg-[url('/website.png')] bg-cover bg-center bg-no-repeat flex items-center justify-center pt-6 px-4 pb-10 md:pt-10 md:px-5 md:pb-14"
      style={{ fontFamily: "var(--font-prompt), sans-serif" }}
    >
      {!user && <SearchBox onFound={setUser} />}

      {user?.found && (
        <Dashboard
          user={user}
          onUserChange={setUser}
          onLogout={() => setUser(null)}
        />
      )}
    </div>
  );
}

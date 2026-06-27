export async function fetchTierCheck(phone, monthOffset = 0) {
  const res = await fetch("/api/check", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ phone, monthOffset }),
  });

  return res.json();
}

export async function fetchTierHistory(phone) {
  const res = await fetch("/api/check/history", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ phone }),
  });

  return res.json();
}

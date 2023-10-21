"use client";

async function fetchCatFacts() {
  const response = await fetch(
    window.location.origin + "/api/do-it-plz/fetchCatFact",
    {
      method: "POST",
      body: JSON.stringify({}),
    }
  );
  const result = await response.json();
  console.log(result);
  if (result.success) alert("Cat facts fetched!");
}

export const Button = () => (
  <button
    type="button"
    className="rounded-md bg-yellow-600 px-4 py-2 text-lg font-semibold text-white shadow-sm hover:bg-yellow-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow-600"
    onClick={fetchCatFacts}
  >
    Fetch them!
  </button>
);

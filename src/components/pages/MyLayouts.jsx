import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function MyLayouts() {
  const [layouts, setLayouts] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("uvnet_auth_user"));

    if (!user) {
      alert("Please login to view your layouts.");
      navigate("/login");
      return;
    }

    const allLayouts =
      JSON.parse(localStorage.getItem("uvnet_saved_layouts")) || [];

    const userLayouts = allLayouts.filter(
      (layout) => layout.user === user.email,
    );

    setLayouts(userLayouts);
  }, [navigate]);

  function handleDelete(id) {
    const allLayouts =
      JSON.parse(localStorage.getItem("uvnet_saved_layouts")) || [];

    const updated = allLayouts.filter((layout) => layout.id !== id);

    localStorage.setItem("uvnet_saved_layouts", JSON.stringify(updated));

    setLayouts(updated);
  }

  function handleLoad(layout) {
    localStorage.setItem("uvnet_load_layout", JSON.stringify(layout));
    navigate("/editor");
  }

  return (
    <div className="min-h-[60vh] bg-black text-white px-10 py-10">
      <h1 className="text-3xl font-bold text-blue-400 mb-8">My Layouts</h1>

      {layouts.length === 0 ? (
        <p className="text-gray-400">No saved layouts yet.</p>
      ) : (
        <div className="grid md:grid-cols-3 gap-6">
          {layouts.map((layout) => (
            <div
              key={layout.id}
              className="p-5 rounded-xl bg-[#000021]"
              style={{ border: "1.5px solid #000055" }}
            >
              <h2 className="text-lg font-semibold text-blue-300">
                {layout.name}
              </h2>

              <p className="text-sm text-gray-400 mt-2">
                Seats: {layout.seats?.length || 0}
              </p>

              <p className="text-xs text-gray-500 mt-1">
                {new Date(layout.createdAt).toLocaleString()}
              </p>

              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => handleLoad(layout)}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm"
                >
                  Load
                </button>

                <button
                  onClick={() => handleDelete(layout.id)}
                  className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

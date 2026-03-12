import React from "react";
import { Link } from "react-router-dom";

export default function Documentation() {
  const sections = [
    {
      title: "1.Getting Started",
      description:
        "Start a project, open the editor, and create the base layout for your venue or workspace.",
    },
    {
      title: "2.Build Layouts",
      description:
        "Use rows, seats, text, and templates to shape layouts precisely and keep spacing consistent.",
    },
    {
      title: "3.Export and Share",
      description:
        "Save your work, export layouts, and prepare configurations for downstream booking or operations flows.",
    },
  ];

  return (
    <div className="min-h-screen bg-linear-to-b from-black via-black to-black text-white px-6 sm:px-12 py-20">
      <div className="max-w-6xl mx-auto space-y-16">
        <section className="text-center max-w-3xl mx-auto">
          <p className="text-sm uppercase tracking-[0.35em] text-blue-400 mb-4">
            Documentation
          </p>
          <h1 className="text-5xl sm:text-6xl font-black mb-6 leading-tight">
            Learn the UVnetware workflow
          </h1>
          <p className="text-lg text-gray-400 leading-relaxed">
            This guide serves as the central starting point for creating seat
            layouts, refining the structure, and generating outputs from the
            editor
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 mt-10">
            <Link
              to="/editor"
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors duration-300"
            >
              Open Editor
            </Link>
            <Link
              to="/"
              className="px-8 py-3 bg-[#000021] hover:bg-[#000055] text-white font-bold rounded-lg transition-colors duration-300"
              style={{ border: "1.75px solid #000055" }}
            >
              Demo
            </Link>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {sections.map((section) => (
            <article
              key={section.title}
              className="bg-[#000021] rounded-2xl p-8 shadow-xl"
              style={{ border: "1.75px solid #000055" }}
            >
              <h2 className="text-2xl font-bold mb-4 text-blue-400">
                {section.title}
              </h2>
              <p className="text-gray-300 leading-relaxed">
                {section.description}
              </p>
            </article>
          ))}
        </section>

        <section
          className="bg-[#000021] rounded-3xl p-8 sm:p-10"
          style={{ border: "1.75px solid #000055" }}
        >
          <h2 className="text-3xl font-bold mb-6">Recommended flow</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-gray-300">
            <div>
              <h3 className="text-xl font-semibold text-white mb-2">
                1. Start with a template or blank canvas
              </h3>
              <p>
                Open the editor, load a venue template from the Templates panel,
                or begin from an empty canvas depending on how much structure
                you already have.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white mb-2">
                2. Build the layout with toolbar tools
              </h3>
              <p>
                Use the Select, Seat, Row, Arc, Rotate, Text, and Eraser tools
                to place seats, shape curved rows, label zones, and clean up the
                canvas as you work.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white mb-2">
                3. Refine selected items in Properties
              </h3>
              <p>
                Select seats or text elements to update labels, status,
                category, pricing, colors, and other settings from the
                Properties panel on the right.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white mb-2">
                4. Review, save, and keep the layout manageable
              </h3>
              <p>
                Use Align, Undo/Redo, and Save Layout as you iterate, and keep
                an eye on the seat counter so the working layout stays within
                the current 500-seat editor capacity.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

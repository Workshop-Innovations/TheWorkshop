import { Link } from "react-router-dom";

const links = [
  {
    title: "Study tools",
    items: [
      ["Past papers", "/past-papers"],
      ["Revision notes", "/revision-notes"],
      ["Study suite", "/study-suite"],
    ],
  },
  {
    title: "Your workspace",
    items: [
      ["Dashboard", "/dashboard"],
      ["Focus timer", "/pomodoro"],
      ["Community", "/community"],
      ["Progress", "/progress"],
    ],
  },
  {
    title: "WorkShop",
    items: [
      ["About us", "/about"],
      ["Plans", "/pricing"],
      ["Send feedback", "/feedback"],
    ],
  },
];

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 py-12">
        <div className="grid grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr] gap-8">
          <div className="col-span-2 lg:col-span-1">
            <Link to="/" className="text-xl font-bold text-primary">
              WorkShop
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-slate-500 max-w-xs">
              A calmer place to prepare, practice and focus.
            </p>
          </div>
          {links.map((group) => (
            <div key={group.title}>
              <h2 className="font-semibold text-sm mb-4">{group.title}</h2>
              <ul className="space-y-3">
                {group.items.map(([label, to]) => (
                  <li key={to}>
                    <Link
                      to={to}
                      className="text-sm text-slate-500 hover:text-primary"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="border-t border-slate-100 mt-10 pt-6 text-xs text-slate-400">
          &copy; {new Date().getFullYear()} WorkShop
        </p>
      </div>
    </footer>
  );
}

import { formatPhone } from "@/lib/format";
import type { Client } from "@/types";
import { ContactCell } from "./ContactCell";

type ClientsTableProps = {
  clients: Client[];
};

const CELL = "px-2 py-2.5 sm:px-4";

export function ClientsTable({ clients }: ClientsTableProps) {
  if (clients.length === 0) {
    return (
      <p className="mt-3 rounded-xl border border-ink/10 bg-white px-4 py-10 text-center text-sm text-ink/70">
        No clients match these filters yet.
        <span className="block">Try removing one.</span>
      </p>
    );
  }

  return (
    // Scrolls sideways only if the columns truly cannot fit.
    <div className="mt-3 overflow-x-auto rounded-xl border border-ink/10 bg-white">
      <table className="w-full text-left text-sm">
        <caption className="sr-only">Clients matching your filters</caption>
        <thead className="bg-ink/5 text-ink/70">
          <tr>
            <th scope="col" className={`${CELL} font-semibold`}>Name</th>
            <th scope="col" className={`${CELL} font-semibold`}>Email</th>
            <th scope="col" className={`${CELL} font-semibold`}>Phone</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-ink/10">
          {clients.map((client) => (
            <tr key={client.id}>
              {/* Names may wrap on phones only, where width is tight. */}
              <td className={`${CELL} sm:whitespace-nowrap`}>
                {client.first_name} {client.last_name}
              </td>
              {/* Phones: max-w-0 + w-full lets this column take the leftover
                  width and truncate. min-w keeps some email readable; below
                  that the table scrolls sideways instead. Wider screens share
                  the width across all columns. */}
              <td className={`${CELL} w-full max-w-0 min-w-24 sm:w-auto sm:max-w-none`}>
                <ContactCell channel="email" value={client.email} optedIn={client.email_opt_in} />
              </td>
              <td className={`${CELL} whitespace-nowrap`}>
                <ContactCell
                  channel="sms"
                  value={client.phone && formatPhone(client.phone)}
                  optedIn={client.sms_opt_in}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

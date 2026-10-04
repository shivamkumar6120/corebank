import { useEffect, useState } from "react";
import api, { errorMessage } from "../../api/client";
import { EmptyState, PageHeader, Skeleton } from "../../components/ui";
import { accountTitle, formatINR } from "../../lib/format";

export default function AdminUsersPage() {
  const [users, setUsers] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/admin/users")
      .then((response) => setUsers(response.data))
      .catch((err) => setError(errorMessage(err, "The user list could not be loaded.")));
  }, []);

  return (
    <div>
      <PageHeader title="Users" subtitle="Every registered customer, with the accounts they hold. This list is read-only." />
      {error ? (
        <EmptyState title="Users unavailable" text={error} />
      ) : !users ? (
        <Skeleton className="h-80 w-full" />
      ) : users.length === 0 ? (
        <div className="card"><EmptyState title="No users yet" text="Registered customers will appear in this table." /></div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Email</th>
                <th className="px-5 py-3 font-medium">Accounts</th>
                <th className="px-5 py-3 text-right font-medium">Balance</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-t border-line align-top">
                  <td className="px-5 py-4 font-medium">{user.fullName}</td>
                  <td className="px-5 py-4 text-muted">{user.email}</td>
                  <td className="px-5 py-4">
                    {user.accounts.length === 0 ? (
                      <span className="text-muted">No accounts</span>
                    ) : user.accounts.map((account) => (
                      <p key={account.accountNumber} className="font-mono text-xs">
                        {account.accountNumber}
                        <span className="ml-2 font-sans text-muted">{accountTitle(account)}</span>
                      </p>
                    ))}
                  </td>
                  <td className="money px-5 py-4 text-right">
                    {user.accounts.length === 0 ? (
                      <span className="text-muted">—</span>
                    ) : user.accounts.map((account) => (
                      <p key={account.accountNumber}>{formatINR(account.balance)}</p>
                    ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

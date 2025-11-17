import { Customer } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChangeEvent } from "react";

interface Props {
  customers: Customer[];
  searchTerm: string;
  onSearch: (value: string) => void;
  selectedCustomerId: string | null;
  onSelect: (customerId: string) => void;
}

export function CustomerList({
  customers,
  searchTerm,
  onSearch,
  selectedCustomerId,
  onSelect,
}: Props) {
  const handleSearch = (event: ChangeEvent<HTMLInputElement>) =>
    onSearch(event.target.value);

  const filteredCustomers = customers.filter((customer) =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Card className="flex h-full flex-col gap-4">
      <header className="flex flex-col gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-tight text-zinc-500">
            Relationships
          </p>
          <h2 className="text-lg font-semibold text-zinc-950">
            Customer dossier
          </h2>
        </div>
        <Input
          placeholder="Search by name"
          value={searchTerm}
          onChange={handleSearch}
        />
      </header>
      <ScrollArea className="flex-1 pr-2">
        <ul className="space-y-2">
          {filteredCustomers.map((customer) => (
            <li key={customer.id}>
              <button
                onClick={() => onSelect(customer.id)}
                className={cn(
                  "w-full rounded-2xl border p-4 text-left transition-all hover:border-black/40",
                  selectedCustomerId === customer.id
                    ? "border-black bg-zinc-50 shadow-sm"
                    : "border-transparent bg-zinc-100"
                )}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-zinc-950">
                      {customer.name}
                    </p>
                    <p className="text-sm text-zinc-500">{customer.title}</p>
                    <p className="text-xs text-zinc-500">{customer.location}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2 text-xs">
                    <Badge variant="outline">{customer.segment}</Badge>
                    <Badge
                      variant={
                        customer.priority === "High"
                          ? "destructive"
                          : customer.priority === "Medium"
                          ? "warning"
                          : "success"
                      }
                    >
                      {customer.priority} priority
                    </Badge>
                  </div>
                </div>
              </button>
            </li>
          ))}
          {filteredCustomers.length === 0 ? (
            <li className="rounded-2xl border border-dashed border-zinc-200 p-6 text-center text-sm text-zinc-500">
              No customers match that name.
            </li>
          ) : null}
        </ul>
      </ScrollArea>
    </Card>
  );
}

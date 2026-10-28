import { useMemo, useState, type ReactNode } from "react";
import { ArrowDown, ArrowUp, ChevronsUpDown, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatNumber } from "@/services/analytics";
import type { CaseStatus, Priority } from "@/types/domain";

export function PageHeading({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: ReactNode }) {
  return <div className="page-heading"><div className="heading-copy">{eyebrow && <div className="eyebrow">{eyebrow}</div>}<h1>{title}</h1>{description && <p>{description}</p>}</div>{action && <div className="heading-action">{action}</div>}</div>;
}

export function Panel({ title, description, action, children, className = "" }: { title?: string; description?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return <section className={`panel ${className}`}><div className="panel-header">{(title || description) && <div><h2>{title}</h2>{description && <p>{description}</p>}</div>}{action && <div>{action}</div>}</div>{children}</section>;
}

export function StatusBadge({ status }: { status: CaseStatus }) {
  const cls = status.toLowerCase().replace(/\s+/g, "-");
  return <Badge variant="outline" className={`status-badge status-${cls}`}>{status}</Badge>;
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  return <Badge variant="outline" className={`priority-badge priority-${priority.toLowerCase()}`}>{priority}</Badge>;
}

export function OutcomeBadge({ outcome }: { outcome: string }) {
  const label = outcome === "no-conflict" ? "Reviewed · no conflict" : outcome === "related" ? "Confirmed related" : outcome === "duplicate" ? "Confirmed duplicate" : "Pending review";
  const cls = outcome === "pending" ? "pending" : outcome === "duplicate" ? "duplicate" : outcome === "no-conflict" ? "no-conflict" : "related";
  return <Badge variant="outline" className={`status-badge review-${cls}`}>{label}</Badge>;
}

export function EmptyState({ title, detail, action }: { title: string; detail: string; action?: ReactNode }) {
  return <div className="empty-state"><span className="empty-mark" aria-hidden="true">—</span><h3>{title}</h3><p>{detail}</p>{action}</div>;
}

export function FieldLabel({ label, children }: { label: string; children: ReactNode }) {
  return <label className="filter-field"><span>{label}</span>{children}</label>;
}

export function SearchInput({ value, onChange, placeholder, ariaLabel = "Search records" }: { value: string; onChange: (value: string) => void; placeholder: string; ariaLabel?: string }) {
  return <div className="search-field"><Search size={15} aria-hidden="true" /><Input aria-label={ariaLabel} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} /></div>;
}

export interface TableColumn<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  className?: string;
  sortable?: boolean;
  sortValue?: (row: T) => string | number | null | undefined;
}

export function DataTable<T extends { id: string }>({ data, columns, initialPageSize = 8, emptyTitle = "No records found", emptyDetail = "Try adjusting the search or filters.", onRowClick }: { data: T[]; columns: TableColumn<T>[]; initialPageSize?: number; emptyTitle?: string; emptyDetail?: string; onRowClick?: (row: T) => void }) {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [sort, setSort] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);
  const sorted = useMemo(() => {
    if (!sort) return data;
    const column = columns.find((item) => item.key === sort.key);
    if (!column) return data;
    return [...data].sort((a, b) => {
      const av = column.sortValue?.(a) ?? "";
      const bv = column.sortValue?.(b) ?? "";
      const result = typeof av === "number" && typeof bv === "number" ? av - bv : String(av).localeCompare(String(bv), "en", { numeric: true, sensitivity: "base" });
      return sort.direction === "asc" ? result : -result;
    });
  }, [data, columns, sort]);
  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const currentPage = Math.min(page, pageCount - 1);
  const visible = sorted.slice(currentPage * pageSize, (currentPage + 1) * pageSize);
  const toggleSort = (key: string) => {
    setPage(0);
    setSort((current) => current?.key === key ? { key, direction: current.direction === "asc" ? "desc" : "asc" } : { key, direction: "asc" });
  };
  return <div className="table-frame">
    {data.length === 0 ? <EmptyState title={emptyTitle} detail={emptyDetail} /> : <>
      <div className="table-scroll"><table className="data-table"><thead><tr>{columns.map((column) => <th key={column.key} className={column.className}>{column.sortable ? <button className="sort-button" onClick={() => toggleSort(column.key)}>{column.header}{sort?.key === column.key ? sort.direction === "asc" ? <ArrowUp size={12} /> : <ArrowDown size={12} /> : <ChevronsUpDown size={12} />}</button> : column.header}</th>)}</tr></thead>
        <tbody>{visible.map((row) => <tr key={row.id} onClick={() => onRowClick?.(row)} className={onRowClick ? "row-clickable" : ""}>{columns.map((column) => <td key={column.key} className={column.className}>{column.render(row)}</td>)}</tr>)}</tbody>
      </table></div>
      <div className="table-footer"><span>Showing <strong>{formatNumber(sorted.length ? currentPage * pageSize + 1 : 0)}–{formatNumber(Math.min((currentPage + 1) * pageSize, sorted.length))}</strong> of <strong>{formatNumber(sorted.length)}</strong> records</span><div className="table-pagination"><label>Rows <select value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(0); }} aria-label="Rows per page"><option>8</option><option>12</option><option>20</option><option>40</option></select></label><Button variant="outline" size="icon" aria-label="Previous page" disabled={currentPage === 0} onClick={() => setPage((value) => Math.max(0, value - 1))}><ChevronLeft size={15} /></Button><span>Page {currentPage + 1} of {pageCount}</span><Button variant="outline" size="icon" aria-label="Next page" disabled={currentPage + 1 >= pageCount} onClick={() => setPage((value) => Math.min(pageCount - 1, value + 1))}><ChevronRight size={15} /></Button></div></div>
    </>}
  </div>;
}

export function SelectField({ label, value, onChange, options, allLabel = "All" }: { label: string; value: string; onChange: (value: string) => void; options: string[]; allLabel?: string }) {
  return <FieldLabel label={label}><select value={value} onChange={(event) => onChange(event.target.value)}><option value="">{allLabel}</option>{options.map((option) => <option key={option} value={option}>{option}</option>)}</select></FieldLabel>;
}

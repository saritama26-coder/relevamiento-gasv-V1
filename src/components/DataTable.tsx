import { useState } from 'react';
import { ChevronUp, ChevronDown, BookmarkPlus, Trash } from 'lucide-react';
import { useCatalogos } from '../context/CatalogContext';

export interface ColumnDef {
  key: string;
  label: string;
  type: 'text' | 'number' | 'select';
  width?: string;
  options?: string[];
  dataListId?: string;
}

interface DataTableProps {
  columns: ColumnDef[];
  data: any[];
  onChange: (newData: any[]) => void;
}

function isCustomValue(listas: Record<string, string[]>, listId: string, val: any): boolean {
  const str = String(val || '').trim();
  if (!str) return false;
  const list = listas[listId] || [];
  return !list.some((item) => item.toLowerCase() === str.toLowerCase());
}

export function DataTable({ columns, data, onChange }: DataTableProps) {
  const { listas, agregar } = useCatalogos();
  const [activeCell, setActiveCell] = useState<string | null>(null);

  const getCustomTokens = (row: any) => {
    return columns
      .filter((col) => col.dataListId && isCustomValue(listas, col.dataListId, row[col.key]))
      .map((col) => ({
        listId: col.dataListId!,
        valor: String(row[col.key]).trim(),
      }));
  };

  const handleAddRow = () => {
    const newRow: any = { id: Math.random().toString() };
    columns.forEach((col) => {
      newRow[col.key] = '';
    });
    onChange([...data, newRow]);
  };

  const handleUpdate = (idx: number, key: string, value: any) => {
    const copy = [...data];
    copy[idx] = { ...copy[idx], [key]: value };
    onChange(copy);
  };

  const handleDelete = (idx: number) => {
    const copy = [...data];
    copy.splice(idx, 1);
    onChange(copy);
  };

  const handleMove = (idx: number, delta: number) => {
    const target = idx + delta;
    if (target < 0 || target >= data.length) return;
    const copy = [...data];
    const temp = copy[idx];
    copy[idx] = copy[target];
    copy[target] = temp;
    onChange(copy);
  };

  return (
    <div className="space-y-3">
      {/* Mobile Card Layout (< md screens) */}
      <div className="block md:hidden space-y-3 print:hidden">
        {data.map((row, idx) => {
          const customTokens = getCustomTokens(row);
          return (
            <div
              key={row.id || idx}
              className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs space-y-2.5"
            >
              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Fila #{idx + 1}
                </span>
                <div className="flex items-center space-x-1">
                  <button
                    type="button"
                    onClick={() => handleMove(idx, -1)}
                    className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-md active:bg-slate-200"
                    title="Subir"
                  >
                    <ChevronUp size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMove(idx, 1)}
                    className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-md active:bg-slate-200"
                    title="Bajar"
                  >
                    <ChevronDown size={16} />
                  </button>
                  {customTokens.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        agregar(customTokens);
                        alert('Guardado en el catálogo: ' + customTokens.map((t) => t.valor).join(', '));
                      }}
                      className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-md active:bg-emerald-100"
                      title={'Guardar en el catálogo: ' + customTokens.map((t) => t.valor).join(', ')}
                    >
                      <BookmarkPlus size={16} />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDelete(idx)}
                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-md active:bg-red-100"
                    title="Eliminar"
                  >
                    <Trash size={16} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                {columns.map((col) => {
                  const cellKey = `mob-${idx}|${col.key}`;
                  const isQty = col.key === 'cantidad';
                  const val = row[col.key] ?? '';
                  const isFullWidth = col.key === 'descripcion' || col.key === 'observacion' || col.key === 'actividad' || col.key === 'elemento';

                  return (
                    <div
                      key={col.key}
                      className={isFullWidth ? 'col-span-2' : 'col-span-1'}
                    >
                      <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                        {col.label}
                      </label>
                      {col.type === 'select' ? (
                        <select
                          className="w-full p-2 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-lg text-xs"
                          value={val}
                          onChange={(e) => handleUpdate(idx, col.key, e.target.value)}
                        >
                          <option value="">Seleccione...</option>
                          {col.options?.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type={col.type}
                          list={col.dataListId}
                          step={isQty ? '0.01' : undefined}
                          className="w-full p-2 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-lg text-xs"
                          value={val}
                          onFocus={() => setActiveCell(cellKey)}
                          onBlur={() => {
                            if (isQty) {
                              const parsed = parseFloat(String(val).replace(',', '.'));
                              if (!isNaN(parsed)) {
                                handleUpdate(idx, col.key, parsed.toFixed(2));
                              }
                            }
                            setActiveCell(null);
                          }}
                          onChange={(e) => handleUpdate(idx, col.key, e.target.value)}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {data.length === 0 && (
          <div className="p-4 text-center text-slate-500 bg-white rounded-xl border border-slate-200 text-xs">
            No hay registros. Toca &quot;+ Agregar fila&quot; para añadir uno.
          </div>
        )}
      </div>

      {/* Desktop / Print Table Layout (>= md or @media print) */}
      <div className="hidden md:block print:block overflow-x-auto">
        <table className="w-full text-sm text-left border-collapse border border-gray-300 print:text-[10px]">
          <thead className="bg-slate-100 text-slate-800 text-xs uppercase font-semibold print:bg-gray-200">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-2 py-1.5 border border-gray-300"
                  style={{ width: col.width }}
                >
                  {col.label}
                </th>
              ))}
              <th className="px-2 py-1.5 border border-gray-300 w-24 print:hidden text-center">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, idx) => {
              const customTokens = getCustomTokens(row);
              return (
                <tr
                  key={row.id || idx}
                  className="bg-white hover:bg-slate-50 border-b border-gray-300"
                >
                  {columns.map((col) => {
                    const cellKey = `${idx}|${col.key}`;
                    const isQty = col.key === 'cantidad';
                    const val = row[col.key] ?? '';

                    let displayVal = val;
                    if (isQty && activeCell !== cellKey && String(val).trim() !== '') {
                      const parsed = parseFloat(String(val).replace(',', '.'));
                      if (!isNaN(parsed)) {
                        displayVal = parsed.toFixed(2);
                      }
                    }

                    return (
                      <td key={col.key} className="p-1 border border-gray-300">
                        {col.type === 'select' ? (
                          <select
                            className="w-full p-1 bg-transparent border-0 focus:ring-1 focus:ring-blue-500 rounded text-sm print:text-[10px]"
                            value={val}
                            onChange={(e) => handleUpdate(idx, col.key, e.target.value)}
                          >
                            <option value="">Seleccione...</option>
                            {col.options?.map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type={col.type}
                            list={col.dataListId}
                            step={isQty ? '0.01' : undefined}
                            className="w-full p-1 bg-transparent border-0 focus:ring-1 focus:ring-blue-500 rounded text-sm print:text-[10px]"
                            value={displayVal}
                            onFocus={() => setActiveCell(cellKey)}
                            onBlur={() => {
                              if (isQty) {
                                const parsed = parseFloat(String(val).replace(',', '.'));
                                if (!isNaN(parsed)) {
                                  handleUpdate(idx, col.key, parsed.toFixed(2));
                                }
                              }
                              setActiveCell(null);
                            }}
                            onChange={(e) => handleUpdate(idx, col.key, e.target.value)}
                          />
                        )}
                      </td>
                    );
                  })}
                  <td className="p-1 border border-gray-300 print:hidden text-center space-x-1 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => handleMove(idx, -1)}
                      className="p-1 text-slate-500 hover:bg-slate-200 rounded"
                      title="Subir"
                    >
                      <ChevronUp size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMove(idx, 1)}
                      className="p-1 text-slate-500 hover:bg-slate-200 rounded"
                      title="Bajar"
                    >
                      <ChevronDown size={14} />
                    </button>
                    {customTokens.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          agregar(customTokens);
                          alert('Guardado en el catálogo: ' + customTokens.map((t) => t.valor).join(', '));
                        }}
                        className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                        title={'Guardar en el catálogo: ' + customTokens.map((t) => t.valor).join(', ')}
                      >
                        <BookmarkPlus size={14} />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDelete(idx)}
                      className="p-1 text-red-500 hover:bg-red-50 rounded"
                      title="Eliminar"
                    >
                      <Trash size={14} />
                    </button>
                  </td>
                </tr>
              );
            })}
            {data.length === 0 && (
              <tr>
                <td colSpan={columns.length + 1} className="p-4 text-center text-slate-500">
                  No hay registros
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <button
        type="button"
        onClick={handleAddRow}
        className="w-full sm:w-auto px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-sm font-semibold transition-colors print:hidden flex items-center justify-center"
      >
        + Agregar fila
      </button>
    </div>
  );
}

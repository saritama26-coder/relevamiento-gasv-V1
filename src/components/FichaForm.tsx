import React, { useState, useMemo, useRef } from 'react';
import { WandSparkles, Trash, Camera, Image as ImageIcon } from 'lucide-react';
import { Ficha, ProjectData } from '../types';
import { DataTable } from './DataTable';
import { useCatalogos } from '../context/CatalogContext';
import {
  ESTADOS,
  SEVERIDADES,
  PRIORIDADES,
  INTERVENCIONES,
  ASISTENTE_ELEMENTOS,
  ASISTENTE_INTERVENCIONES,
  ASISTENTE_DEFAULTS,
} from '../constants/catalogos';
import {
  compressImage,
  calculateArea,
  calculatePerimeter,
  priorityFromState,
  lookupReference,
} from '../utils/helpers';

interface FichaFormProps {
  ficha: Ficha;
  projectData: ProjectData;
  onChange: (patch: Partial<Ficha>) => void;
}

export function FichaForm({ ficha, projectData, onChange }: FichaFormProps) {
  const { listas } = useCatalogos();

  const [asistente, setAsistente] = useState({
    elemento: '',
    estado: 'Bueno',
    intervencion: 'Reparación',
    actividad: '',
    cantidad: '',
    unidad: '',
    origen: '',
  });

  const handleAsistenteElementoChange = (elem: string) => {
    const updated = { ...asistente, elemento: elem };
    const defaults = ASISTENTE_DEFAULTS[elem];
    if (elem && defaults) {
      updated.actividad = defaults[0];
      updated.unidad = defaults[1];
    }
    if (updated.estado === 'Crítico') {
      updated.intervencion = 'Intervención integral';
    }

    const ref = lookupReference(ficha, elem);
    updated.origen = '';
    if (ref) {
      if (!String(updated.cantidad || '').trim()) {
        updated.cantidad = ref.cantidad;
      }
      if (!String(updated.unidad || '').trim()) {
        updated.unidad = ref.unidad;
      }
      updated.cantidad = ref.cantidad;
      updated.unidad = ref.unidad || updated.unidad;
      updated.origen = 'Referencia automática: ' + ref.origen;
    }
    setAsistente(updated);
  };

  const handleAsistenteEstadoChange = (st: string) => {
    setAsistente((prev) => ({
      ...prev,
      estado: st,
      intervencion: st === 'Crítico' ? 'Intervención integral' : prev.intervencion,
    }));
  };

  const handleAgregarAsistente = () => {
    if (!asistente.elemento.trim()) {
      alert('Seleccione el elemento que desea cuantificar.');
      return;
    }
    if (!asistente.actividad.trim() || !String(asistente.cantidad).trim() || !asistente.unidad.trim()) {
      alert('Complete actividad, cantidad y unidad.');
      return;
    }

    const nuevaFila = {
      id: Math.random().toString(),
      codigo: ficha.codigo,
      elemento: asistente.elemento,
      actividad: asistente.actividad,
      cantidad: asistente.cantidad,
      unidad: asistente.unidad,
      estado: asistente.estado,
      prioridad: priorityFromState(asistente.estado),
    };

    onChange({ cuan: [...ficha.cuan, nuevaFila] });
    setAsistente((prev) => ({
      ...prev,
      elemento: '',
      actividad: '',
      cantidad: '',
      unidad: '',
      origen: '',
    }));
  };

  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);

  const handleUploadFotos = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    e.target.value = '';
    const newFotos = await Promise.all(
      files.map(async (file) => {
        const compressed = await compressImage(file);
        return {
          id: Math.random().toString(),
          src: compressed,
          desc: '',
        };
      })
    );
    onChange({ fotos: [...ficha.fotos, ...newFotos] });
  };

  const handlePasarSeccion8 = () => {
    const cuanCopia = [...ficha.cuan];
    ficha.pat.forEach((p) => {
      if (p.elemento && p.patologia) {
        cuanCopia.push({
          id: Math.random().toString(),
          codigo: ficha.codigo,
          elemento: p.elemento,
          actividad: `${p.intervencion || 'Reparación'} de ${p.elemento.toLowerCase()} por ${p.patologia.toLowerCase()} ${p.ubicacion ? `(${p.ubicacion.toLowerCase()})` : ''}`,
          cantidad: p.cantidad,
          unidad: p.unidad,
          estado: p.severidad === 'Crítica' ? 'Crítico' : p.severidad === 'Severa' ? 'Malo' : 'Regular',
          prioridad: p.severidad === 'Crítica' || p.severidad === 'Severa' ? 'Alta' : p.severidad === 'Moderada' ? 'Media' : 'Baja',
        });
      }
    });
    onChange({ cuan: cuanCopia });
    alert(`${ficha.pat.length} actividades generadas. Revise y ajuste en la Sección 8.`);
  };

  const areaCalculada = useMemo(() => calculateArea(ficha).toFixed(2), [ficha]);
  const perimetroCalculado = useMemo(() => {
    if (ficha.geometria === 'irregular') return 'No calculado';
    return calculatePerimeter(ficha).toFixed(2);
  }, [ficha]);

  const safeNum = (v: string) => {
    if (typeof (window as any).Gsv2d === 'function') {
      return (window as any).Gsv2d(v);
    }
    const n = parseFloat(String(v || '').replace(',', '.'));
    return isNaN(n) ? v : n.toFixed(2);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20">
      {/* 1. Datos Generales */}
      <div className="print-card bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-xl font-semibold text-blue-900 mb-4 border-b pb-2 print:text-lg">
          1. Datos generales
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <div>
            <label className="text-xs font-bold text-gray-500">Proyecto</label>
            <input className="w-full p-2 border rounded bg-gray-50 text-xs sm:text-sm" readOnly value={projectData.proyecto} />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500">Ubicación</label>
            <input className="w-full p-2 border rounded bg-gray-50 text-xs sm:text-sm" readOnly value={projectData.ubicacion} />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500">Bloque / Edificio</label>
            <input
              className="w-full p-2 border rounded text-xs sm:text-sm"
              value={ficha.bloque || projectData.bloque}
              onChange={(e) => onChange({ bloque: e.target.value })}
            />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500">Nivel / Planta</label>
            <input
              className="w-full p-2 border rounded text-xs sm:text-sm"
              value={ficha.nivel}
              onChange={(e) => onChange({ nivel: e.target.value })}
            />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500">Ambiente / Área</label>
            <input
              className="w-full p-2 border rounded text-xs sm:text-sm"
              value={ficha.ambiente}
              onChange={(e) => onChange({ ambiente: e.target.value })}
            />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500">Código</label>
            <input
              className="w-full p-2 border rounded text-xs sm:text-sm"
              value={ficha.codigo}
              onChange={(e) => onChange({ codigo: e.target.value })}
            />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500">Fecha</label>
            <input
              type="date"
              className="w-full p-2 border rounded text-xs sm:text-sm"
              value={ficha.fecha}
              onChange={(e) => onChange({ fecha: e.target.value })}
            />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500">Responsable</label>
            <input
              className="w-full p-2 border rounded text-xs sm:text-sm"
              value={ficha.responsable || projectData.profesional || 'Arq. Gabriel Saritama Veira'}
              onChange={(e) => onChange({ responsable: e.target.value })}
            />
          </div>
        </div>
      </div>

      {/* 2. Levantamiento dimensional */}
      <div className="print-card bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-xl font-semibold text-blue-900 mb-4 border-b pb-2 print:text-lg">
          2. Levantamiento dimensional
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <div>
            <label className="text-xs font-bold text-gray-500">Tipo de geometría</label>
            <select
              className="w-full p-2 border rounded text-xs sm:text-sm"
              value={ficha.geometria}
              onChange={(e) => onChange({ geometria: e.target.value as 'regular' | 'irregular' })}
            >
              <option value="regular">Regular</option>
              <option value="irregular">Irregular</option>
            </select>
          </div>

          {ficha.geometria === 'regular' ? (
            <>
              <div>
                <label className="text-xs font-bold text-gray-500">Largo (m)</label>
                <input
                  type="number"
                  step="0.01"
                  className="w-full p-2 border rounded"
                  value={ficha.largo}
                  onBlur={(e) => onChange({ largo: safeNum(e.target.value) })}
                  onChange={(e) => onChange({ largo: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500">Ancho (m)</label>
                <input
                  type="number"
                  step="0.01"
                  className="w-full p-2 border rounded"
                  value={ficha.ancho}
                  onBlur={(e) => onChange({ ancho: safeNum(e.target.value) })}
                  onChange={(e) => onChange({ ancho: e.target.value })}
                />
              </div>
            </>
          ) : (
            <div className="col-span-2">
              <label className="text-xs font-bold text-gray-500">Área del ambiente (m²)</label>
              <input
                type="number"
                step="0.01"
                className="w-full p-2 border rounded"
                value={ficha.areaDirecta}
                onBlur={(e) => onChange({ areaDirecta: safeNum(e.target.value) })}
                onChange={(e) => onChange({ areaDirecta: e.target.value })}
              />
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-gray-500">Altura libre (m)</label>
            <input
              type="number"
              step="0.01"
              className="w-full p-2 border rounded"
              value={ficha.altura}
              onBlur={(e) => onChange({ altura: safeNum(e.target.value) })}
              onChange={(e) => onChange({ altura: e.target.value })}
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500">Área registrada (m²)</label>
            <input className="w-full p-2 border rounded bg-gray-50" readOnly value={areaCalculada} />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500">Perímetro calculado (m)</label>
            <input className="w-full p-2 border rounded bg-gray-50" readOnly value={perimetroCalculado} />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500">Estado general</label>
            <select
              className="w-full p-2 border rounded"
              value={ficha.estadoDimensional}
              onChange={(e) => onChange({ estadoDimensional: e.target.value })}
            >
              {ESTADOS.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-4">
            <label className="text-xs font-bold text-gray-500">Observaciones</label>
            <textarea
              className="w-full p-2 border rounded"
              rows={2}
              value={ficha.obsdim}
              onChange={(e) => onChange({ obsdim: e.target.value })}
            />
          </div>
        </div>
      </div>

      {/* 3. Elementos constructivos y acabados */}
      <div className="print-card bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-xl font-semibold text-blue-900 mb-4 border-b pb-2 print:text-lg">
          3. Elementos constructivos y acabados
        </h2>
        <DataTable
          data={ficha.cons}
          onChange={(newData) => onChange({ cons: newData })}
          columns={[
            { key: 'elemento', label: 'Elemento', type: 'text', dataListId: 'list-cons-elem' },
            { key: 'descripcion', label: 'Descripción', type: 'text' },
            { key: 'dimension', label: 'Dimensión', type: 'text' },
            { key: 'cantidad', label: 'Cantidad', type: 'number', width: '10%' },
            { key: 'unidad', label: 'Unidad', type: 'text', dataListId: 'list-unidades', width: '10%' },
            { key: 'estado', label: 'Estado', type: 'select', options: ESTADOS, width: '15%' },
            { key: 'observacion', label: 'Observación', type: 'text' },
          ]}
        />
      </div>

      {/* 4. Aparatos y equipamiento */}
      <div className="print-card bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-xl font-semibold text-blue-900 mb-4 border-b pb-2 print:text-lg">
          4. Aparatos y equipamiento
        </h2>
        <DataTable
          data={ficha.equip}
          onChange={(newData) => onChange({ equip: newData })}
          columns={[
            { key: 'elemento', label: 'Elemento', type: 'text', dataListId: 'list-equip-elem' },
            { key: 'descripcion', label: 'Descripción', type: 'text' },
            { key: 'cantidad', label: 'Cantidad', type: 'number', width: '10%' },
            { key: 'unidad', label: 'Unidad', type: 'text', dataListId: 'list-unidades', width: '10%' },
            { key: 'estado', label: 'Estado', type: 'select', options: ESTADOS, width: '15%' },
            { key: 'observacion', label: 'Observación', type: 'text' },
          ]}
        />
      </div>

      {/* 5. Instalaciones eléctricas */}
      <div className="print-card bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-xl font-semibold text-blue-900 mb-4 border-b pb-2 print:text-lg">
          5. Instalaciones eléctricas
        </h2>
        <DataTable
          data={ficha.elec}
          onChange={(newData) => onChange({ elec: newData })}
          columns={[
            { key: 'elemento', label: 'Elemento', type: 'text', dataListId: 'list-elec-elem' },
            { key: 'cantidad', label: 'Cantidad', type: 'number', width: '15%' },
            { key: 'unidad', label: 'Unidad', type: 'text', dataListId: 'list-unidades', width: '15%' },
            { key: 'estado', label: 'Estado', type: 'select', options: ESTADOS, width: '20%' },
            { key: 'observacion', label: 'Observación', type: 'text' },
          ]}
        />
      </div>

      {/* 6. Instalaciones hidrosanitarias */}
      <div className="print-card bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-xl font-semibold text-blue-900 mb-4 border-b pb-2 print:text-lg">
          6. Instalaciones hidrosanitarias
        </h2>
        <DataTable
          data={ficha.hidro}
          onChange={(newData) => onChange({ hidro: newData })}
          columns={[
            { key: 'elemento', label: 'Elemento', type: 'text', dataListId: 'list-hidro-elem' },
            { key: 'cantidad', label: 'Cantidad', type: 'number', width: '15%' },
            { key: 'unidad', label: 'Unidad', type: 'text', dataListId: 'list-unidades', width: '15%' },
            { key: 'estado', label: 'Estado', type: 'select', options: ESTADOS, width: '20%' },
            { key: 'observacion', label: 'Observación', type: 'text' },
          ]}
        />
      </div>

      {/* 7. Patologías y deficiencias */}
      <div className="print-card bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex justify-between items-center mb-4 border-b pb-2">
          <h2 className="text-xl font-semibold text-blue-900 print:text-lg">
            7. Patologías y deficiencias
          </h2>
          <button
            type="button"
            onClick={handlePasarSeccion8}
            className="print:hidden text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded hover:bg-blue-200 font-medium"
          >
            Pasar a sección 8
          </button>
        </div>
        <DataTable
          data={ficha.pat}
          onChange={(newData) => onChange({ pat: newData })}
          columns={[
            { key: 'elemento', label: 'Elemento afectado', type: 'text', dataListId: 'list-pat-elem' },
            { key: 'patologia', label: 'Patología / deficiencia', type: 'text', dataListId: 'list-pat-tipos' },
            { key: 'ubicacion', label: 'Ubicación', type: 'text', dataListId: 'list-pat-ubic' },
            { key: 'cantidad', label: 'Cantidad', type: 'number', width: '10%' },
            { key: 'unidad', label: 'Unidad', type: 'text', dataListId: 'list-unidades', width: '10%' },
            { key: 'severidad', label: 'Severidad', type: 'select', options: SEVERIDADES, width: '15%' },
            { key: 'intervencion', label: 'Intervención recomendada', type: 'select', options: INTERVENCIONES },
          ]}
        />
      </div>

      {/* 8. Cuantificación preliminar */}
      <div className="print-card bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-xl font-semibold text-blue-900 mb-4 border-b pb-2 print:text-lg">
          8. Cuantificación preliminar
        </h2>

        {/* Asistente */}
        <div className="print:hidden mb-5 bg-slate-50 border border-slate-200 rounded p-4">
          <div className="flex items-center mb-3">
            <WandSparkles size={16} className="text-blue-700 mr-2" />
            <h3 className="text-sm font-bold text-blue-900">Asistente de cuantificación</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3">
            <div>
              <label className="text-xs font-bold text-gray-500">1. Elemento</label>
              <select
                className="w-full p-2 border rounded"
                value={asistente.elemento}
                onChange={(e) => handleAsistenteElementoChange(e.target.value)}
              >
                <option value="">Seleccione...</option>
                {ASISTENTE_ELEMENTOS.map((el) => (
                  <option key={el} value={el}>
                    {el}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500">2. Estado</label>
              <select
                className="w-full p-2 border rounded"
                value={asistente.estado}
                onChange={(e) => handleAsistenteEstadoChange(e.target.value)}
              >
                {ESTADOS.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500">3. Intervención</label>
              <select
                className="w-full p-2 border rounded"
                value={asistente.intervencion}
                onChange={(e) => setAsistente({ ...asistente, intervencion: e.target.value })}
              >
                {ASISTENTE_INTERVENCIONES.map((it) => (
                  <option key={it} value={it}>
                    {it}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2 md:col-span-3">
              <label className="text-xs font-bold text-gray-500">4. Trabajo a ejecutar</label>
              <input
                className="w-full p-2 border rounded"
                value={asistente.actividad}
                onChange={(e) => setAsistente({ ...asistente, actividad: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500">5. Cantidad</label>
              <input
                type="number"
                step="0.01"
                className="w-full p-2 border rounded"
                value={asistente.cantidad}
                onBlur={(e) => setAsistente({ ...asistente, cantidad: safeNum(e.target.value) })}
                onChange={(e) => setAsistente({ ...asistente, cantidad: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500">6. Unidad</label>
              <input
                className="w-full p-2 border rounded"
                list="list-unidades"
                value={asistente.unidad}
                onChange={(e) => setAsistente({ ...asistente, unidad: e.target.value })}
              />
            </div>
            <div className="sm:col-span-2 md:col-span-2 flex items-end">
              <button
                type="button"
                onClick={handleAgregarAsistente}
                className="w-full bg-blue-700 hover:bg-blue-600 text-white py-2 rounded text-sm font-semibold transition-colors shadow-xs"
              >
                Agregar a la tabla
              </button>
            </div>
            <div className="sm:col-span-2 md:col-span-2 flex items-end">
              <p className="text-xs text-slate-500 italic">
                {asistente.origen || 'La cantidad se toma de las secciones 2 a 6 cuando existe el dato.'}
              </p>
            </div>
          </div>
        </div>

        <DataTable
          data={ficha.cuan}
          onChange={(newData) => onChange({ cuan: newData })}
          columns={[
            { key: 'codigo', label: 'Código', type: 'text', width: '10%' },
            { key: 'elemento', label: 'Elemento', type: 'text', dataListId: 'list-pat-elem' },
            { key: 'actividad', label: 'Trabajo a ejecutar', type: 'text' },
            { key: 'cantidad', label: 'Cantidad', type: 'number', width: '10%' },
            { key: 'unidad', label: 'Unidad', type: 'text', dataListId: 'list-unidades', width: '10%' },
            { key: 'estado', label: 'Estado', type: 'select', options: ESTADOS, width: '15%' },
            { key: 'prioridad', label: 'Prioridad', type: 'select', options: PRIORIDADES, width: '15%' },
          ]}
        />
      </div>

      {/* 9. Registro fotográfico */}
      <div className="print-card bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 border-b pb-2 gap-2">
          <h2 className="text-xl font-semibold text-blue-900 print:text-lg">
            9. Registro fotográfico
          </h2>
          <div className="flex flex-wrap gap-2 print:hidden">
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              className="flex items-center px-3 py-1.5 bg-blue-700 hover:bg-blue-600 text-white rounded-lg text-xs sm:text-sm font-semibold shadow-xs transition-colors"
            >
              <Camera size={16} className="mr-1.5" />
              <span>Tomar Foto (Cámara)</span>
            </button>
            <button
              type="button"
              onClick={() => galleryInputRef.current?.click()}
              className="flex items-center px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs sm:text-sm font-semibold border border-slate-300 transition-colors"
            >
              <ImageIcon size={16} className="mr-1.5 text-slate-600" />
              <span>Subir de Galería / PC</span>
            </button>
          </div>
        </div>

        {/* Hidden File Inputs */}
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleUploadFotos}
          className="hidden"
        />
        <input
          ref={galleryInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleUploadFotos}
          className="hidden"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {ficha.fotos.map((foto, idx) => (
            <div key={foto.id} className="border p-2 rounded bg-gray-50 flex flex-col items-center">
              <img
                src={foto.src}
                alt="relevamiento"
                className="w-full h-48 object-cover rounded mb-2"
              />
              <input
                className="w-full p-1.5 border rounded text-sm mb-2"
                placeholder="Descripción"
                value={foto.desc}
                onChange={(e) => {
                  const copy = [...ficha.fotos];
                  copy[idx].desc = e.target.value;
                  onChange({ fotos: copy });
                }}
              />
              <button
                type="button"
                onClick={() => onChange({ fotos: ficha.fotos.filter((f) => f.id !== foto.id) })}
                className="print:hidden text-red-500 text-sm hover:underline"
              >
                <Trash size={16} className="inline mr-1" />
                Eliminar
              </button>
            </div>
          ))}
          {ficha.fotos.length === 0 && (
            <p className="text-sm text-gray-500 italic col-span-full">No hay fotografías.</p>
          )}
        </div>
      </div>

      {/* 10. Diagnóstico preliminar */}
      <div className="print-card bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-xl font-semibold text-blue-900 mb-4 border-b pb-2 print:text-lg">
          10. Diagnóstico preliminar
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-xs font-bold text-gray-500">Estado</label>
            <select
              className="w-full p-2 border rounded"
              value={ficha.diagestado}
              onChange={(e) => onChange({ diagestado: e.target.value })}
            >
              {ESTADOS.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500">Intervención</label>
            <select
              className="w-full p-2 border rounded"
              value={ficha.interv}
              onChange={(e) => onChange({ interv: e.target.value })}
            >
              {INTERVENCIONES.map((it) => (
                <option key={it} value={it}>
                  {it}
                </option>
              ))}
            </select>
          </div>
        </div>
        <label className="text-xs font-bold text-gray-500">Diagnóstico / criterio técnico</label>
        <textarea
          className="w-full p-2 border rounded"
          rows={3}
          value={ficha.diag}
          onChange={(e) => onChange({ diag: e.target.value })}
        />
      </div>

      {/* 11 & 12. Observaciones y Verificación */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="print-card bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold text-blue-900 mb-4 border-b pb-2 print:text-lg">
            11. Observaciones generales
          </h2>
          <textarea
            className="w-full p-2 border rounded h-32"
            value={ficha.obs}
            onChange={(e) => onChange({ obs: e.target.value })}
          />
        </div>

        <div className="print-card bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold text-blue-900 mb-4 border-b pb-2 print:text-lg">
            12. Verificación
          </h2>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-gray-500">Responsable</label>
              <input
                className="w-full p-2 border rounded"
                value={ficha.fir1 || projectData.profesional || 'Arq. Gabriel Saritama Veira'}
                onChange={(e) => onChange({ fir1: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500">Revisión</label>
              <input
                className="w-full p-2 border rounded"
                value={ficha.fir2}
                onChange={(e) => onChange({ fir2: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500">Aprobación</label>
              <input
                className="w-full p-2 border rounded"
                value={ficha.fir3}
                onChange={(e) => onChange({ fir3: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500">Fecha</label>
              <input
                type="date"
                className="w-full p-2 border rounded"
                value={ficha.fir4}
                onChange={(e) => onChange({ fir4: e.target.value })}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 13. Resumen de la ficha */}
      <div className="print-card bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-xl font-semibold text-blue-900 mb-4 border-b pb-2 print:text-lg">
          13. Resumen de la ficha
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 print:grid-cols-4">
          {[
            ['Constructivos', ficha.cons.length],
            ['Equipamiento', ficha.equip.length],
            ['Patologías', ficha.pat.length],
            ['Actividades', ficha.cuan.length],
          ].map(([label, count]) => (
            <div key={label as string} className="p-3 border border-gray-200 rounded bg-slate-50 print:p-2">
              <span className="block text-xs font-bold text-gray-500 uppercase">{label}</span>
              <b className="block text-2xl font-bold text-[#17365d] print:text-base">{count}</b>
            </div>
          ))}
        </div>
      </div>

      {/* Datalists */}
      {Object.keys(listas).map((key) => (
        <datalist key={key} id={key}>
          {(listas[key] || []).map((val) => (
            <option key={val} value={val} />
          ))}
        </datalist>
      ))}
    </div>
  );
}

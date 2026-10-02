import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { StatistikItem } from '../types/desa';
import { formatAngka } from '../utils/formatters';

interface DataDesaChartsProps {
  dataDesa: StatistikItem[];
  namaDesa: string;
}

const NUSANTARA_PALETTE = [
  '#14532D', // Forest Emerald
  '#D97706', // Warm Amber Gold
  '#0F766E', // Deep Teal
  '#9A3412', // Terracotta
  '#1E3A8A', // Lapis Blue
  '#4D7C0F', // Olive Leaf
  '#78350F', // Bronze Bark
];

const GENDER_COLORS = ['#14532D', '#D97706'];

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    payload: {
      name: string;
      nilai: number;
      satuan: string;
      persen: string;
      keterangan: string;
    };
  }>;
}

const CustomChartTooltip: React.FC<CustomTooltipProps> = ({ active, payload }) => {
  if (!active || !payload || payload.length === 0) return null;
  const item = payload[0].payload;
  return (
    <div className="rounded-lg border border-stone-200 bg-white p-3 shadow-md text-xs">
      <p className="font-semibold text-stone-900">{item.name}</p>
      <p className="mt-1 font-mono font-bold tabular-nums text-emerald-900">
        {formatAngka(item.nilai)} {item.satuan} ({item.persen}%)
      </p>
      {item.keterangan && (
        <p className="mt-0.5 text-[11px] text-stone-500">{item.keterangan}</p>
      )}
    </div>
  );
};

export const DataDesaCharts: React.FC<DataDesaChartsProps> = ({ dataDesa, namaDesa }) => {
  const [pieCategory, setPieCategory] = useState<'Umur' | 'Pendidikan' | 'Agama'>('Umur');
  const [barCategory, setBarCategory] = useState<'Pekerjaan' | 'Pendidikan' | 'Umur' | 'Semua'>('Pekerjaan');
  const [barLayout, setBarLayout] = useState<'vertical' | 'horizontal'>('vertical');

  // 1. Data Pie Chart Jenis Kelamin (Laki-laki vs Perempuan)
  const genderData = useMemo(() => {
    const laki = dataDesa.find(
      (d) =>
        d.label.toLowerCase().includes('laki-laki') ||
        d.label.toLowerCase().includes('pria')
    );
    const perempuan = dataDesa.find(
      (d) =>
        d.label.toLowerCase().includes('perempuan') ||
        d.label.toLowerCase().includes('wanita')
    );

    const valLaki = laki ? Number(laki.nilai) : 0;
    const valPerempuan = perempuan ? Number(perempuan.nilai) : 0;
    const total = valLaki + valPerempuan || 1;

    const list = [
      {
        name: laki?.label || 'Penduduk Laki-laki',
        nilai: valLaki,
        satuan: laki?.satuan || 'Jiwa',
        persen: ((valLaki / total) * 100).toFixed(1),
        keterangan: laki?.keterangan || 'Penduduk Laki-laki',
      },
      {
        name: perempuan?.label || 'Penduduk Perempuan',
        nilai: valPerempuan,
        satuan: perempuan?.satuan || 'Jiwa',
        persen: ((valPerempuan / total) * 100).toFixed(1),
        keterangan: perempuan?.keterangan || 'Penduduk Perempuan',
      },
    ];
    return { list, total: valLaki + valPerempuan };
  }, [dataDesa]);

  // 2. Data Pie Chart Dinamis (Umur / Pendidikan / Agama)
  const dynamicPieData = useMemo(() => {
    const filtered = dataDesa
      .filter((d) => d.kategori === pieCategory)
      .sort((a, b) => a.urutan - b.urutan);

    const total = filtered.reduce((acc, cur) => acc + Number(cur.nilai || 0), 0) || 1;

    const list = filtered.map((item) => ({
      name: item.label,
      nilai: Number(item.nilai || 0),
      satuan: item.satuan,
      persen: ((Number(item.nilai || 0) / total) * 100).toFixed(1),
      keterangan: item.keterangan,
    }));

    return { list, total: filtered.reduce((acc, cur) => acc + Number(cur.nilai || 0), 0) };
  }, [dataDesa, pieCategory]);

  // 3. Data Bar Chart Dinamis (Pekerjaan / Pendidikan / Umur / Semua Indikator Jiwa)
  const dynamicBarData = useMemo(() => {
    const filtered = dataDesa
      .filter((d) => {
        if (barCategory === 'Semua') {
          return (
            d.kategori !== 'Wilayah' &&
            !d.label.toLowerCase().includes('jumlah penduduk') &&
            !d.label.toLowerCase().includes('kepala keluarga')
          );
        }
        return d.kategori === barCategory;
      })
      .sort((a, b) => b.nilai - a.nilai);

    const total = filtered.reduce((acc, cur) => acc + Number(cur.nilai || 0), 0) || 1;

    return filtered.map((item) => ({
      name: item.label.length > 26 ? item.label.slice(0, 24) + '…' : item.label,
      fullName: item.label,
      nilai: Number(item.nilai || 0),
      satuan: item.satuan,
      persen: ((Number(item.nilai || 0) / total) * 100).toFixed(1),
      keterangan: `${item.kategori} — ${item.keterangan}`,
    }));
  }, [dataDesa, barCategory]);

  return (
    <div className="space-y-8">
      {/* BARIS 1: DUA PIE CHART DINAMIS */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* PIE CHART 1: KOMPOSISI JENIS KELAMIN */}
        <div className="flex flex-col justify-between rounded-xl border border-stone-200 bg-white p-6 lg:col-span-5">
          <div>
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-emerald-900">
                  Proporsi Gender
                </p>
                <h2 className="mt-0.5 font-serif text-lg font-semibold text-stone-900">
                  Komposisi Jenis Kelamin Penduduk
                </h2>
              </div>
              <span className="font-mono text-xs text-stone-500">
                Total: {formatAngka(genderData.total)} Jiwa
              </span>
            </div>

            <div className="mt-4 h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={genderData.list}
                    dataKey="nilai"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={58}
                    outerRadius={88}
                    paddingAngle={3}
                  >
                    {genderData.list.map((_entry, idx) => (
                      <Cell
                        key={`gender-cell-${idx}`}
                        fill={GENDER_COLORS[idx % GENDER_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomChartTooltip />} />
                  <Legend
                    verticalAlign="bottom"
                    height={32}
                    iconType="circle"
                    formatter={(value) => (
                      <span className="text-xs font-medium text-stone-700">{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3 border-t border-stone-100 pt-4">
            {genderData.list.map((g, idx) => (
              <div key={g.name} className="rounded-lg bg-stone-50 p-3">
                <div className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: GENDER_COLORS[idx % GENDER_COLORS.length] }}
                  />
                  <span className="truncate text-xs font-medium text-stone-600">{g.name}</span>
                </div>
                <p className="mt-1 font-mono text-base font-bold tabular-nums text-stone-900">
                  {formatAngka(g.nilai)} <span className="text-xs font-normal text-stone-500">Jiwa</span>
                </p>
                <p className="font-mono text-[11px] font-semibold text-emerald-900">
                  {g.persen}% dari populasi
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* PIE CHART 2: DISTRIBUSI DEMOGRAFI DINAMIS (UMUR / PENDIDIKAN / AGAMA) */}
        <div className="flex flex-col justify-between rounded-xl border border-stone-200 bg-white p-6 lg:col-span-7">
          <div>
            <div className="flex flex-col justify-between gap-3 border-b border-stone-200 pb-3 sm:flex-row sm:items-center">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-emerald-900">
                  Visualisasi Pie Chart Interaktif
                </p>
                <h2 className="mt-0.5 font-serif text-lg font-semibold text-stone-900">
                  Distribusi {pieCategory} Warga {namaDesa}
                </h2>
              </div>

              {/* Interactive Segmented Control */}
              <div className="flex items-center gap-1 rounded-lg bg-stone-100 p-1">
                {(['Umur', 'Pendidikan', 'Agama'] as const).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setPieCategory(cat)}
                    className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                      pieCategory === cat
                        ? 'bg-emerald-900 text-white shadow-xs'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {dynamicPieData.list.length === 0 ? (
              <div className="flex h-64 items-center justify-center text-center text-xs text-stone-500">
                Belum ada data pada kategori {pieCategory}. Tambahkan melalui Dashboard Admin → Data Desa.
              </div>
            ) : (
              <div className="mt-4 grid grid-cols-1 items-center gap-4 md:grid-cols-12">
                <div className="h-64 w-full md:col-span-7">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={dynamicPieData.list}
                        dataKey="nilai"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={52}
                        outerRadius={90}
                        paddingAngle={2}
                      >
                        {dynamicPieData.list.map((_entry, idx) => (
                          <Cell
                            key={`dyn-pie-${idx}`}
                            fill={NUSANTARA_PALETTE[idx % NUSANTARA_PALETTE.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomChartTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Custom Tabular Legend Breakdown */}
                <div className="space-y-2.5 md:col-span-5">
                  {dynamicPieData.list.map((item, idx) => (
                    <div
                      key={item.name}
                      className="flex items-center justify-between gap-2 border-b border-stone-100 pb-2 text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="h-3 w-3 shrink-0 rounded-xs"
                          style={{
                            backgroundColor:
                              NUSANTARA_PALETTE[idx % NUSANTARA_PALETTE.length],
                          }}
                        />
                        <span className="truncate font-medium text-stone-800" title={item.name}>
                          {item.name}
                        </span>
                      </div>
                      <div className="shrink-0 text-right font-mono tabular-nums">
                        <span className="font-semibold text-stone-900">
                          {formatAngka(item.nilai)}
                        </span>
                        <span className="ml-1.5 text-stone-500">({item.persen}%)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 border-t border-stone-100 pt-3 flex items-center justify-between text-xs text-stone-500">
            <span>Sumber: Database Monografi SIAK {namaDesa}</span>
            <span className="font-mono">
              Total Terdata ({pieCategory}): {formatAngka(dynamicPieData.total)} Jiwa
            </span>
          </div>
        </div>
      </div>

      {/* BARIS 2: BAR CHART DINAMIS */}
      <div className="rounded-xl border border-stone-200 bg-white p-6">
        <div className="flex flex-col justify-between gap-4 border-b border-stone-200 pb-4 lg:flex-row lg:items-center">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-emerald-900">
              Grafik Perbandingan Kuantitatif (Recharts Bar)
            </p>
            <h2 className="mt-0.5 font-serif text-xl font-semibold text-stone-900">
              Distribusi Demografi Berdasarkan {barCategory === 'Semua' ? 'Seluruh Indikator Penduduk' : barCategory}
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Category Filter */}
            <div className="flex items-center gap-1 rounded-lg bg-stone-100 p-1">
              {(['Pekerjaan', 'Pendidikan', 'Umur', 'Semua'] as const).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setBarCategory(cat)}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                    barCategory === cat
                      ? 'bg-emerald-900 text-white shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  {cat === 'Semua' ? 'Semua Kategori' : cat}
                </button>
              ))}
            </div>

            {/* Orientation Switcher */}
            <div className="flex items-center gap-1 rounded-lg border border-stone-200 bg-white p-1">
              <button
                type="button"
                onClick={() => setBarLayout('vertical')}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap ${
                  barLayout === 'vertical'
                    ? 'bg-stone-900 text-white'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Grafik Vertikal
              </button>
              <button
                type="button"
                onClick={() => setBarLayout('horizontal')}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap ${
                  barLayout === 'horizontal'
                    ? 'bg-stone-900 text-white'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Grafik Horizontal
              </button>
            </div>
          </div>
        </div>

        {dynamicBarData.length === 0 ? (
          <div className="py-12 text-center text-xs text-stone-500">
            Tidak ada data untuk kategori ini.
          </div>
        ) : (
          <div className="mt-6 h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              {barLayout === 'vertical' ? (
                <BarChart
                  data={dynamicBarData}
                  margin={{ top: 10, right: 24, left: 10, bottom: 28 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#E7E2DA" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: '#57534E' }}
                    interval={0}
                    angle={-12}
                    textAnchor="end"
                    height={50}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#57534E' }}
                    tickFormatter={(val) => formatAngka(Number(val))}
                  />
                  <Tooltip content={<CustomChartTooltip />} />
                  <Bar dataKey="nilai" name="Jumlah Jiwa" radius={[6, 6, 0, 0]} maxBarSize={54}>
                    {dynamicBarData.map((_entry, idx) => (
                      <Cell
                        key={`bar-v-${idx}`}
                        fill={NUSANTARA_PALETTE[idx % NUSANTARA_PALETTE.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              ) : (
                <BarChart
                  data={dynamicBarData}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 30, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#E7E2DA" horizontal={false} />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 11, fill: '#57534E' }}
                    tickFormatter={(val) => formatAngka(Number(val))}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={175}
                    tick={{ fontSize: 11, fill: '#1C1917' }}
                  />
                  <Tooltip content={<CustomChartTooltip />} />
                  <Bar dataKey="nilai" name="Jumlah Jiwa" radius={[0, 6, 6, 0]} barSize={22}>
                    {dynamicBarData.map((_entry, idx) => (
                      <Cell
                        key={`bar-h-${idx}`}
                        fill={NUSANTARA_PALETTE[idx % NUSANTARA_PALETTE.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
};

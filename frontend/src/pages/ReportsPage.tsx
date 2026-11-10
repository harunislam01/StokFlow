import { useMutation, useQuery } from '@tanstack/react-query';
import {
    getMonthlyReport,
    getReportArchives,
    getReportArchiveById,
    type ReportArchiveSummary
} from '../api/reports';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import { Button } from '../components/ui/button';
import { BarChart3, ArrowDownRight, ArrowUpRight, History, PackageOpen, Download, Archive, FileSpreadsheet, Loader2 } from 'lucide-react';
import * as XLSX from 'xlsx';

const MONTH_NAMES = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
];

const formatMonthName = (year: number, month: number) => {
    const name = MONTH_NAMES[month - 1] || String(month);
    return `${name} ${year}`;
};

const exportMovementsToExcel = (movements: any[], fileName: string) => {
    if (!movements || movements.length === 0) {
        toast.info('İndirilecek hareket bulunmuyor.');
        return;
    }

    // Excel tablosu için veriyi formatlıyoruz
    const excelData = movements.map((mov: any) => ({
        'Tarih': new Date(mov.createdAt).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
        'Ürün Kodu': mov.product?.productCode || '-',
        'Ürün Adı': mov.product?.name || '-',
        'İşlem Türü': mov.movementType === 'IN' ? 'Giriş' : 'Çıkış',
        'Miktar': mov.changeAmount,
        'İşlemi Yapan': mov.user?.username || 'Bilinmeyen'
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);

    worksheet['!cols'] = [
        { wch: 18 }, // Tarih
        { wch: 15 }, // Ürün Kodu
        { wch: 30 }, // Ürün Adı
        { wch: 12 }, // İşlem Türü
        { wch: 10 }, // Miktar
        { wch: 15 }, // İşlemi Yapan
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Aylık Rapor');
    XLSX.writeFile(workbook, fileName);
};

export const ReportsPage = () => {
    const { data: report, isLoading } = useQuery({
        queryKey: ['monthly-report'],
        queryFn: getMonthlyReport,
    });

    const { data: archives, isLoading: isLoadingArchives } = useQuery({
        queryKey: ['report-archives'],
        queryFn: getReportArchives,
    });

    const downloadArchiveMutation = useMutation({
        mutationFn: (archive: ReportArchiveSummary) => getReportArchiveById(archive.id),
        onSuccess: (archive) => {
            const movements = archive?.data?.movements || [];
            exportMovementsToExcel(movements, `Stok_Raporu_${formatMonthName(archive.year, archive.month)}.xlsx`);
            toast.success(`${formatMonthName(archive.year, archive.month)} raporu indirildi`);
        },
        onError: (err: any) => {
            toast.error(err?.response?.data?.error || 'Rapor indirilemedi');
        }
    });

    // Excel İndirme Fonksiyonu (içinde bulunulan ay)
    const handleExportExcel = () => {
        const movements = report?.movements || [];
        if (movements.length === 0) {
            toast.info('İndirilecek hareket bulunmuyor.');
            return;
        }
        const dateStr = new Date().toLocaleDateString('tr-TR').replace(/\./g, '-');
        exportMovementsToExcel(movements, `Stok_Raporu_${dateStr}.xlsx`);
        toast.success('Aylık rapor Excel dosyası indirildi');
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6 pt-4">
            {/* Sayfa Başlığı ve Excel Butonu */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                        <BarChart3 className="h-6 w-6 text-blue-600" /> Aylık Raporlar
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">Bu ay içerisindeki stok giriş ve çıkış hareketlerinin özeti.</p>
                </div>

                <Button
                    onClick={handleExportExcel}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-10 px-4 gap-2 shrink-0 shadow-sm shadow-emerald-600/20"
                    disabled={isLoading || !report?.movements?.length}
                >
                    <Download className="h-4 w-4" /> Excel'e Aktar
                </Button>
            </div>

            {/* Özet Kartları */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Card className="rounded-2xl border-emerald-100 bg-emerald-50/30 shadow-sm overflow-hidden">
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="h-14 w-14 rounded-2xl bg-emerald-100 flex items-center justify-center shrink-0">
                            <ArrowDownRight className="h-7 w-7 text-emerald-600" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-emerald-700 mb-1">Bu Ay Toplam Giriş</p>
                            {isLoading ? (
                                <Skeleton className="h-8 w-24" />
                            ) : (
                                <p className="text-3xl font-bold text-emerald-800 font-mono">
                                    {report?.totalIn || 0} <span className="text-lg font-medium text-emerald-600">adet</span>
                                </p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-2xl border-red-100 bg-red-50/30 shadow-sm overflow-hidden">
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="h-14 w-14 rounded-2xl bg-red-100 flex items-center justify-center shrink-0">
                            <ArrowUpRight className="h-7 w-7 text-red-600" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-red-700 mb-1">Bu Ay Toplam Çıkış</p>
                            {isLoading ? (
                                <Skeleton className="h-8 w-24" />
                            ) : (
                                <p className="text-3xl font-bold text-red-800 font-mono">
                                    {report?.totalOut || 0} <span className="text-lg font-medium text-red-600">adet</span>
                                </p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Geçmiş Aylık Raporlar */}
            <Card className="rounded-2xl border-slate-200/80 shadow-sm bg-white overflow-hidden">
                <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4">
                    <div>
                        <CardTitle className="text-base font-bold flex items-center gap-2 text-slate-800">
                            <Archive className="h-5 w-5 text-blue-600" /> Geçmiş Aylık Raporlar
                        </CardTitle>
                        <p className="text-xs text-slate-500 mt-1">Arşivlenen raporlar kalıcı olarak saklanır ve her ay yeniden indirilebilir.</p>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {isLoadingArchives ? (
                        <div className="p-6 space-y-3">
                            {[1, 2, 3].map(i => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}
                        </div>
                    ) : !archives || archives.length === 0 ? (
                        <div className="text-center py-12 px-6">
                            <Archive className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                            <h3 className="text-base font-bold text-slate-800">Henüz Arşivlenmiş Rapor Yok</h3>
                            <p className="text-sm text-slate-500 mt-1">
                                Her ay sonunda o ayın stok verileri otomatik olarak rapor halinde arşivlenir. Arşiv oluştuğunda burada listelenir.
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {archives.map((archive) => {
                                const isDownloading = downloadArchiveMutation.isPending && downloadArchiveMutation.variables?.id === archive.id;
                                return (
                                    <div key={archive.id} className="flex flex-col sm:flex-row sm:items-center gap-3 px-5 py-4 hover:bg-slate-50/60 transition-colors">
                                        <div className="h-11 w-11 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                                            <FileSpreadsheet className="h-5 w-5 text-blue-600" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-sm font-bold text-slate-800">{formatMonthName(archive.year, archive.month)}</h3>
                                            <p className="text-xs text-slate-500 mt-0.5">
                                                {archive.movementCount} hareket • Giriş {archive.totalIn} • Çıkış {archive.totalOut}
                                            </p>
                                        </div>
                                        <Button
                                            onClick={() => downloadArchiveMutation.mutate(archive)}
                                            disabled={isDownloading}
                                            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-9 px-3 gap-2 shrink-0 shadow-sm shadow-emerald-600/20"
                                        >
                                            {isDownloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                                            {isDownloading ? 'İndiriliyor...' : 'İndir'}
                                        </Button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Detaylı Hareket Tablosu */}
            <Card className="rounded-2xl border-slate-200/80 shadow-sm bg-white overflow-hidden">
                <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4">
                    <CardTitle className="text-base font-bold flex items-center gap-2 text-slate-800">
                        <History className="h-5 w-5 text-blue-600" /> Bu Ayki Hareketler
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="p-6 space-y-4">
                            {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-12 w-full rounded-xl" />)}
                        </div>
                    ) : !report?.movements || report.movements.length === 0 ? (
                        <div className="text-center py-20">
                            <PackageOpen className="mx-auto h-16 w-16 text-slate-300 mb-4" />
                            <h3 className="text-lg font-bold text-slate-800">Hareket Bulunmuyor</h3>
                            <p className="text-sm text-slate-500 mt-1">Bu ay içerisinde herhangi bir stok hareketi yapılmamış.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
                                        <TableHead className="font-semibold text-slate-600">Tarih</TableHead>
                                        <TableHead className="font-semibold text-slate-600">Ürün</TableHead>
                                        <TableHead className="font-semibold text-slate-600">İşlem</TableHead>
                                        <TableHead className="font-semibold text-slate-600 text-right">Miktar</TableHead>
                                        <TableHead className="font-semibold text-slate-600">İşlemi Yapan</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {report.movements.map((mov: any) => {
                                        const isIn = mov.movementType === 'IN';
                                        return (
                                            <TableRow key={mov.id} className="hover:bg-slate-50/50 transition-colors">
                                                <TableCell className="text-slate-600 text-sm">
                                                    {new Date(mov.createdAt).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                </TableCell>
                                                <TableCell>
                                                    <p className="font-semibold text-slate-800 text-sm">{mov.product?.name}</p>
                                                    <p className="text-xs font-mono text-slate-500">{mov.product?.productCode}</p>
                                                </TableCell>
                                                <TableCell>
                                                    {isIn ? (
                                                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">Giriş</Badge>
                                                    ) : (
                                                        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Çıkış</Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <span className={`font-bold font-mono text-base ${isIn ? 'text-emerald-600' : 'text-red-600'}`}>
                                                        {isIn ? '+' : ''}{mov.changeAmount}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-slate-600 text-sm">
                                                    {mov.user?.username || 'Bilinmeyen'}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

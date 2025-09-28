import path from 'path';
import { Request, Response } from 'express';
import { authorize, uploadFileToDrive } from '../services/googleDriveService';
import { generateMonthlyReportPDF, MonthlyReportUser } from '../services/pdfReportService';
import User from '../models/User';
import Salary from '../models/Salary';
import Expense from '../models/Expense';
import InvestmentEntry from '../models/InvestmentEntry';
import Investment from '../models/Investment';
import EmergencyEntry from '../models/EmergencyEntry';
import ViagemEntry from '../models/ViagemEntry';
import CarroEntry from '../models/CarroEntry';
import MesadaEntry from '../models/MesadaEntry';

// ID da pasta do Google Drive onde os relatórios serão salvos
const GOOGLE_DRIVE_FOLDER_ID = '1ARdpGJ11ZWI7JnDPpozQyHQGI7Tt0k0M';

export async function generateAndSendMonthlyReport(req: Request, res: Response) {
  try {
    // Determina mês/ano alvo: aceita query ?month=8&year=2025; default: mês anterior ao atual
    const now = new Date();
    const qMonth = req.query.month ? Number(req.query.month) : undefined; // 1-12
    const qYear = req.query.year ? Number(req.query.year) : undefined;
    let targetYear: number;
    let targetMonthNum: number; // 1-12
    if (qMonth && qYear) {
      targetYear = qYear;
      targetMonthNum = qMonth;
    } else {
      const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      targetYear = prev.getFullYear();
      targetMonthNum = prev.getMonth() + 1; // 1-12
    }
    const firstDay = new Date(targetYear, targetMonthNum - 1, 1);
    const lastDay = new Date(targetYear, targetMonthNum, 0, 23, 59, 59, 999);

    const monthStr = String(targetMonthNum).padStart(2, '0');
    const fileName = `relatorio-mensal-${monthStr}-${targetYear}.pdf`;
    const outputPath = path.join(process.cwd(), fileName);

  // Buscar dados dos usuários
  const users = await User.find();
    const reportData: MonthlyReportUser[] = [];

    // Conversão simples e estática, coerente com frontend/src/utils/currency.ts
    const EUR_TO_BRL = 1 / 0.18; // ~5.5555
    const toBRL = (valor: number, moeda?: string): number => {
      if (!valor || !Number.isFinite(valor as number)) return 0;
      switch (moeda) {
        case 'Real':
          return valor;
        case 'Euro':
          return valor * EUR_TO_BRL;
        case 'Dolar':
          return valor * (0.90 * EUR_TO_BRL); // USD->EUR->BRL
        default:
          return valor; // fallback conservador
      }
    };
    const toEUR = (valor: number, moeda?: string): number => {
      if (!valor || !Number.isFinite(valor as number)) return 0;
      switch (moeda) {
        case 'Euro':
          return valor;
        case 'Real':
          return valor * 0.18;
        case 'Dolar':
          return valor * 0.90;
        default:
          return valor; // fallback conservador
      }
    };
    for (const user of users) {
      // Buscar salário do mês (um por mês por regra do sistema)
      const salaryDoc = await Salary.findOne({
        user: user._id,
        date: { $gte: firstDay, $lte: lastDay }
      });
      const salary = salaryDoc ? salaryDoc.value : 0;

      // Despesas do mês
      const expensesArr = await Expense.find({
        user: user._id,
        date: { $gte: firstDay, $lte: lastDay }
      });
      const expenses = expensesArr.reduce((sum, exp) => sum + exp.value, 0);

      // Outras saídas (entradas) do mês
      const [invEntries, emeSum, viaSum, carSum, mesSum] = await Promise.all([
        InvestmentEntry.find({ user: user._id, date: { $gte: firstDay, $lte: lastDay } }),
        EmergencyEntry.aggregate([
          { $match: { user: user._id, data: { $gte: firstDay, $lte: lastDay } } },
          { $group: { _id: null, total: { $sum: '$valor' } } }
        ]),
        ViagemEntry.aggregate([
          { $match: { user: user._id, data: { $gte: firstDay, $lte: lastDay } } },
          { $group: { _id: null, total: { $sum: '$valor' } } }
        ]),
        CarroEntry.aggregate([
          { $match: { user: user._id, data: { $gte: firstDay, $lte: lastDay } } },
          { $group: { _id: null, total: { $sum: '$valor' } } }
        ]),
        MesadaEntry.aggregate([
          { $match: { user: user._id, data: { $gte: firstDay, $lte: lastDay } } },
          { $group: { _id: null, total: { $sum: '$valor' } } }
        ])
      ]);
      // Converter entradas de investimento para BRL
      const invEntriesTotalBRL = invEntries.reduce((sum, e: any) => sum + toBRL(e.value, e.moeda), 0);
      const entriesTotal = invEntriesTotalBRL + (emeSum[0]?.total || 0) + (viaSum[0]?.total || 0) + (carSum[0]?.total || 0) + (mesSum[0]?.total || 0);

      // Total de Ativos (Investimentos) - snapshot até o fim do mês
      const investments = await Investment.find({
        user: user._id,
        data: { $lte: lastDay }
      });
  const assetsTotalBRL = investments.reduce((sum, inv) => sum + toBRL(inv.valor, inv.moeda), 0);
  const assetsTotalEUR = investments.reduce((sum, inv) => sum + toEUR(inv.valor, inv.moeda), 0);

      reportData.push({
        name: user.name,
        email: user.email,
        salary,
        expenses,
        entriesTotal,
        assetsTotalBRL,
        assetsTotalEUR,
        balance: salary - (expenses + entriesTotal),
      });
    }

    // Gerar PDF
    await generateMonthlyReportPDF(reportData, monthStr, targetYear, outputPath);

    // Autenticar e enviar para o Google Drive
    const auth = await authorize();
    const fileId = await uploadFileToDrive(auth, outputPath, GOOGLE_DRIVE_FOLDER_ID, fileName);

    res.json({ success: true, fileId });
  } catch (err) {
    console.error('Erro ao gerar/enviar relatório:', err);
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
}
